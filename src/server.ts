// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CdpClient } from './cdp/client';
import { listTabs, listSessionTabs, newTab, closeTab, activateTab } from './cdp/tabs';
import { generateSessionId, registerSession, unregisterSession, pruneDeadSessions, getAllSessions } from './session';
import { navigate, reload, goBack, scroll, waitForSelector, waitForNetworkIdle, waitForUrl, scrollToElement } from './cdp/page';
import { clickAt, clickSelector, typeText, pressKey, keyChord, selectOption, setValue, hoverAt, hoverSelector, handleDialog, uploadFile, doubleClickAt, clearInput, rightClickAt } from './cdp/input';
import { takeScreenshot, getAccessibilityTree, getDom } from './cdp/capture';
import { evaluate, getNetworkRequests, startNetworkMonitor, resetNetworkMonitor, startConsoleMonitor, resetConsoleMonitor, getConsoleMessages } from './cdp/evaluate';
import { checkAllAuth, waitForAuth, AUTH_PRESETS } from './cdp/auth';
import { getText, getAttribute, isVisible, findText } from './cdp/query';
import { startFrameMonitor, getFrames, evaluateInFrame, switchToFrame, switchToMainFrame } from './cdp/frame';
import { applyStealthPatches } from './cdp/stealth';
import { startWatchdog, stopWatchdog } from './chrome';
import { withTimeout, TimeoutError, DEFAULT_TOOL_TIMEOUT_MS } from './timeout';
import { retry } from './retry';
import { readConfig } from './config';

function ok(content: unknown) {
  return { content: [{ type: 'text' as const, text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}

function okImage(base64: string) {
  return { content: [{ type: 'image' as const, data: base64, mimeType: 'image/png' as const }] };
}

function fail(message: string, code: string, suggestion?: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: message, code, suggestion }) }],
    isError: true,
  };
}

const TOOLS = [
  // Navigation
  { name: 'browser_navigate', description: 'Navigate to a URL', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to navigate to' } }, required: ['url'] } },
  { name: 'browser_back', description: 'Go back in history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_reload', description: 'Reload the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for', description: 'Wait for CSS selector to appear', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_network_idle', description: 'Wait until no network requests are in flight (essential after SPA navigation)', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number', description: 'Quiet period in ms (default 500)' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_wait_for_url', description: 'Wait until the page URL contains a substring (SPA route changes)', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'URL substring to wait for' }, timeout_ms: { type: 'number' } }, required: ['pattern'] } },
  // Tabs & sessions
  { name: 'browser_tabs', description: 'List tabs owned by this session. Pass all:true to see every tab in Chrome.', inputSchema: { type: 'object', properties: { all: { type: 'boolean', description: 'Show all Chrome tabs, not just this session\'s' } } } },
  { name: 'browser_sessions', description: 'List all active claudebrowser sessions (one per terminal)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_new_tab', description: 'Open a new tab', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
  { name: 'browser_close_tab', description: 'Close a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'browser_switch_tab', description: 'Switch to a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  // Capture
  { name: 'browser_screenshot', description: 'Take a screenshot', inputSchema: { type: 'object', properties: { full_page: { type: 'boolean' } } } },
  { name: 'browser_accessibility_tree', description: 'Get ARIA accessibility tree', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom', description: 'Get outer HTML of element or body', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_network_requests', description: 'Get recent network requests', inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'URL substring filter' } } } },
  { name: 'browser_console_messages', description: 'Get browser console output (log, warn, error). Useful for diagnosing JS errors.', inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Filter by type: log, warn, error, info' } } } },
  // Click & mouse
  { name: 'browser_click', description: 'Click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_click_selector', description: 'Click element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_and_click', description: 'Wait for an element to appear then click it. Use instead of browser_wait_for + browser_click_selector.', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_double_click', description: 'Double-click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_right_click', description: 'Right-click at x,y coordinates (opens context menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_hover', description: 'Move mouse over x,y coordinates (reveals tooltips and dropdown menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_hover_selector', description: 'Move mouse over element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_scroll', description: 'Scroll the page by pixel amount', inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, amount: { type: 'number' } }, required: ['direction', 'amount'] } },
  { name: 'browser_scroll_to', description: 'Scroll an element into view by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // Keyboard & input
  { name: 'browser_type', description: 'Type text at current focus', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_press_key', description: 'Press a key with optional modifiers. Key: Enter, Tab, Escape, Backspace, etc. Modifiers: ctrl, shift, alt, meta', inputSchema: { type: 'object', properties: { key: { type: 'string' }, modifiers: { type: 'array', items: { type: 'string' }, description: 'e.g. ["ctrl", "shift"]' } }, required: ['key'] } },
  { name: 'browser_key_chord', description: 'Press a keyboard shortcut (modifier + key). E.g. Ctrl+A, Cmd+Z.', inputSchema: { type: 'object', properties: { modifiers: { type: 'array', items: { type: 'string' }, description: 'e.g. ["ctrl"] or ["meta", "shift"]' }, key: { type: 'string', description: 'e.g. "a", "z", "Enter"' } }, required: ['modifiers', 'key'] } },
  { name: 'browser_clear_input', description: 'Clear an input field (select all + backspace)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_select_option', description: 'Select a <select> option by value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_value', description: 'Set input value (React/Vue safe via native setter)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_handle_dialog', description: 'Accept or dismiss an alert/confirm/prompt dialog', inputSchema: { type: 'object', properties: { accept: { type: 'boolean', description: 'true to click OK/Accept, false to click Cancel/Dismiss' }, prompt_text: { type: 'string', description: 'Text to enter into prompt dialogs' } }, required: ['accept'] } },
  { name: 'browser_file_upload', description: 'Set files on an <input type="file"> element', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the file input' }, file_paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to files' } }, required: ['selector', 'file_paths'] } },
  // Evaluate & query
  { name: 'browser_evaluate', description: 'Execute JavaScript and return result', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
  { name: 'browser_get_text', description: 'Get the innerText of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_attribute', description: 'Get an attribute value from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_is_visible', description: 'Check if an element is visible (rendered, non-zero size, not hidden)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_text', description: 'Find elements containing a text string and return their positions (x,y)', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  // Frames (iframes)
  { name: 'browser_get_frames', description: 'List all frames (iframes) on the page with their IDs and URLs', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_frame', description: 'Execute JavaScript inside a specific iframe (by CSS selector of the <iframe> element)', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <iframe> element' }, script: { type: 'string' } }, required: ['selector', 'script'] } },
  { name: 'browser_switch_frame', description: 'Switch all subsequent operations to run inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <iframe> element' } }, required: ['selector'] } },
  { name: 'browser_switch_main_frame', description: 'Switch back to the main page frame (after browser_switch_frame)', inputSchema: { type: 'object', properties: {} } },
  // Status & auth
  { name: 'browser_status', description: 'Check CDP connection and active tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_auth_check', description: 'Check login status for Instagram, Meta Ads, TikTok Ads (or configured platforms). Run this before starting any automation.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_auth', description: 'Wait up to 2 minutes for the user to log in on the current page. Use after telling the user a session has expired.', inputSchema: { type: 'object', properties: { platform: { type: 'string', description: 'Platform name matching an auth check preset (e.g. "Instagram")' }, timeout_ms: { type: 'number' } } } },
];

export async function startServer(sessionName?: string): Promise<void> {
  const config = readConfig();
  const cdp = new CdpClient(config.debugPort);

  // Session setup — one session per claudebrowser serve process
  pruneDeadSessions();
  const sessionId = generateSessionId();
  registerSession(sessionId, sessionName);

  // Chrome watchdog — auto-reconnect if Chrome dies
  let watchdogHandle: NodeJS.Timeout | null = null;
  const reconnect = async () => {
    try {
      resetNetworkMonitor();
      resetConsoleMonitor();
      await cdp.connect();
      startNetworkMonitor(cdp);
      startConsoleMonitor(cdp);
      startFrameMonitor(cdp);
    } catch {
      // will retry on next watchdog tick
    }
  };

  const cleanup = () => {
    if (watchdogHandle) stopWatchdog(watchdogHandle);
    unregisterSession(sessionId);
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  try {
    await cdp.connect();
    startNetworkMonitor(cdp);
    startConsoleMonitor(cdp);
    startFrameMonitor(cdp);
    await applyStealthPatches(cdp);
    watchdogHandle = startWatchdog(config.debugPort, reconnect);
  } catch {
    process.stderr.write(`Warning: Chrome not reachable on port ${config.debugPort}. Run claudebrowser init first.\n`);
  }

  const server = new Server(
    { name: 'claudebrowser', version: '1.5.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    const a = args as Record<string, unknown>;

    if (!cdp.isConnected() && name !== 'browser_status') {
      try { resetNetworkMonitor(); resetConsoleMonitor(); await cdp.connect(); startNetworkMonitor(cdp); startConsoleMonitor(cdp); startFrameMonitor(cdp); } catch {
        return fail('Chrome not connected. Is it running? Run: claudebrowser init', 'CDP_DISCONNECTED', 'claudebrowser status');
      }
    }

    // Auth tools have their own long timeouts — exclude from wrapper
    const NO_TIMEOUT_TOOLS = new Set(['browser_wait_for_auth', 'browser_auth_check', 'browser_status']);
    const toolTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS;

    const run = async () => {
      switch (name) {
        // Navigation
        case 'browser_navigate':      return ok(await navigate(cdp, a.url as string, config.navigationTimeoutMs));
        case 'browser_back':          return ok({ url: await goBack(cdp) });
        case 'browser_reload':        { await reload(cdp, config.navigationTimeoutMs); return ok('Reloaded'); }
        case 'browser_wait_for':      { await waitForSelector(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element found'); }
        case 'browser_wait_for_network_idle': { await waitForNetworkIdle(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Network idle'); }
        case 'browser_wait_for_url':  return ok({ url: await waitForUrl(cdp, a.pattern as string, a.timeout_ms as number | undefined) });
        // Tabs
        case 'browser_tabs':          return ok(a.all ? await listTabs(cdp) : await listSessionTabs(cdp, sessionId));
        case 'browser_sessions':      return ok(getAllSessions());
        case 'browser_new_tab':       return ok({ id: await newTab(config.debugPort, a.url as string | undefined, sessionId) });
        case 'browser_close_tab':     { await closeTab(config.debugPort, a.id as string, sessionId); return ok('Tab closed'); }
        case 'browser_switch_tab':    { await activateTab(config.debugPort, a.id as string); await cdp.disconnect(); await cdp.connect(a.id as string); return ok('Switched'); }
        // Capture
        case 'browser_screenshot':    return okImage(await takeScreenshot(cdp, (a.full_page as boolean) ?? false));
        case 'browser_accessibility_tree': return ok(await getAccessibilityTree(cdp));
        case 'browser_dom':           return ok(await getDom(cdp, a.selector as string | undefined));
        case 'browser_network_requests': return ok(getNetworkRequests(a.filter as string | undefined));
        case 'browser_console_messages': return ok(getConsoleMessages(a.type as string | undefined));
        // Click & mouse
        case 'browser_click':         { await clickAt(cdp, a.x as number, a.y as number); return ok('Clicked'); }
        case 'browser_click_selector':{ await clickSelector(cdp, a.selector as string); return ok('Clicked'); }
        case 'browser_wait_and_click':{ await retry(() => clickSelector(cdp, a.selector as string), { timeoutMs: (a.timeout_ms as number) ?? 10000, errorMessage: `Element not clickable: ${a.selector}` }); return ok('Clicked'); }
        case 'browser_double_click':  { await doubleClickAt(cdp, a.x as number, a.y as number); return ok('Double-clicked'); }
        case 'browser_right_click':   { await rightClickAt(cdp, a.x as number, a.y as number); return ok('Right-clicked'); }
        case 'browser_hover':         { await hoverAt(cdp, a.x as number, a.y as number); return ok('Hovered'); }
        case 'browser_hover_selector':{ await hoverSelector(cdp, a.selector as string); return ok('Hovered'); }
        case 'browser_scroll':        { await scroll(cdp, a.direction as any, a.amount as number); return ok('Scrolled'); }
        case 'browser_scroll_to':     return ok(await scrollToElement(cdp, a.selector as string));
        // Keyboard
        case 'browser_type':          { await typeText(cdp, a.text as string); return ok('Typed'); }
        case 'browser_press_key':     { await pressKey(cdp, a.key as string, a.modifiers as string[] | undefined); return ok('Key pressed'); }
        case 'browser_key_chord':     { await keyChord(cdp, a.modifiers as string[], a.key as string); return ok('Chord sent'); }
        case 'browser_clear_input':   { await clearInput(cdp, a.selector as string); return ok('Input cleared'); }
        case 'browser_select_option': { await selectOption(cdp, a.selector as string, a.value as string); return ok('Selected'); }
        case 'browser_set_value':     { await setValue(cdp, a.selector as string, a.value as string); return ok('Value set'); }
        case 'browser_handle_dialog': { await handleDialog(cdp, a.accept as boolean, a.prompt_text as string | undefined); return ok('Dialog handled'); }
        case 'browser_file_upload':   { await uploadFile(cdp, a.selector as string, a.file_paths as string[]); return ok('Files set'); }
        // Evaluate & query
        case 'browser_evaluate':      return ok(await evaluate(cdp, a.script as string));
        case 'browser_get_text':      return ok(await getText(cdp, a.selector as string));
        case 'browser_get_attribute': return ok(await getAttribute(cdp, a.selector as string, a.attribute as string));
        case 'browser_is_visible':    return ok({ visible: await isVisible(cdp, a.selector as string) });
        case 'browser_find_text':     return ok(await findText(cdp, a.text as string));
        // Frames
        case 'browser_get_frames':    return ok(await getFrames(cdp));
        case 'browser_evaluate_in_frame': return ok(await evaluateInFrame(cdp, a.selector as string, a.script as string));
        case 'browser_switch_frame':  return ok({ frameId: await switchToFrame(cdp, a.selector as string) });
        case 'browser_switch_main_frame': { switchToMainFrame(cdp); return ok('Switched to main frame'); }
        // Status
        case 'browser_status': {
          if (!cdp.isConnected()) return ok({ connected: false, port: config.debugPort });
          const target = await cdp.getActiveTarget();
          return ok({
            connected: true,
            port: config.debugPort,
            sessionId,
            sessionName: sessionName ?? null,
            activeTab: target ? { url: target.url, title: target.title } : null,
          });
        }
        // Auth
        case 'browser_auth_check': {
          const checks = config.authChecks ?? AUTH_PRESETS;
          const results = await checkAllAuth(cdp, checks);
          return ok(results);
        }
        case 'browser_wait_for_auth': {
          const platformName = a.platform as string | undefined;
          const checks = config.authChecks ?? AUTH_PRESETS;
          const check = platformName
            ? checks.find(c => c.name.toLowerCase() === platformName.toLowerCase())
            : checks[0];
          if (!check) return fail(`Unknown platform: ${platformName}`, 'AUTH_PLATFORM_NOT_FOUND', `Known platforms: ${checks.map(c => c.name).join(', ')}`);
          const loggedIn = await waitForAuth(cdp, check, (a.timeout_ms as number) ?? 120000);
          return ok({ loggedIn, platform: check.name });
        }
        default: return fail(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
      }
    };

    try {
      if (NO_TIMEOUT_TOOLS.has(name)) return await run();
      return await withTimeout(name, toolTimeoutMs, run);
    } catch (e: any) {
      if (e instanceof TimeoutError) {
        return fail(e.message, 'TOOL_TIMEOUT', 'The page may be unresponsive. Try browser_screenshot to check state.');
      }
      return fail(e.message, 'TOOL_ERROR', 'Check browser_status to verify connection');
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
