// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CdpClient } from './cdp/client';
import { listTabs, listSessionTabs, newTab, closeTab, activateTab } from './cdp/tabs';
import { generateSessionId, registerSession, unregisterSession, pruneDeadSessions, getAllSessions } from './session';
import { navigate, reload, goBack, scroll, waitForSelector, waitForNetworkIdle, waitForUrl } from './cdp/page';
import { clickAt, clickSelector, typeText, pressKey, selectOption, setValue, hoverAt, hoverSelector, handleDialog, uploadFile, doubleClickAt, clearInput, rightClickAt } from './cdp/input';
import { takeScreenshot, getAccessibilityTree, getDom } from './cdp/capture';
import { evaluate, getNetworkRequests, startNetworkMonitor, resetNetworkMonitor, startConsoleMonitor, resetConsoleMonitor, getConsoleMessages } from './cdp/evaluate';
import { checkAllAuth, waitForAuth, AUTH_PRESETS } from './cdp/auth';
import { getText, getAttribute, isVisible, findText } from './cdp/query';
import { startWatchdog, stopWatchdog } from './chrome';
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
  { name: 'browser_navigate', description: 'Navigate to a URL', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'URL to navigate to' } }, required: ['url'] } },
  { name: 'browser_tabs', description: 'List tabs owned by this session. Pass all:true to see every tab in Chrome.', inputSchema: { type: 'object', properties: { all: { type: 'boolean', description: 'Show all Chrome tabs, not just this session\'s' } } } },
  { name: 'browser_sessions', description: 'List all active claudebrowser sessions (one per terminal)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_new_tab', description: 'Open a new tab', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
  { name: 'browser_close_tab', description: 'Close a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'browser_switch_tab', description: 'Switch to a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'browser_back', description: 'Go back in history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_reload', description: 'Reload the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_screenshot', description: 'Take a screenshot', inputSchema: { type: 'object', properties: { full_page: { type: 'boolean' } } } },
  { name: 'browser_accessibility_tree', description: 'Get ARIA accessibility tree', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom', description: 'Get outer HTML of element or body', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_network_requests', description: 'Get recent network requests', inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'URL substring filter' } } } },
  { name: 'browser_click', description: 'Click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_click_selector', description: 'Click element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_double_click', description: 'Double-click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_right_click', description: 'Right-click at x,y coordinates (opens context menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_type', description: 'Type text at current focus', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_press_key', description: 'Press a key (Enter, Tab, Escape, etc.)', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_clear_input', description: 'Clear an input field (select all + backspace)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_scroll', description: 'Scroll the page', inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, amount: { type: 'number' } }, required: ['direction', 'amount'] } },
  { name: 'browser_select_option', description: 'Select a <select> option by value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_wait_for', description: 'Wait for CSS selector to appear', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_network_idle', description: 'Wait until no network requests are in flight (useful after SPA navigation)', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number', description: 'Quiet period in ms (default 500)' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_wait_for_url', description: 'Wait until the page URL contains a substring (useful for SPA route changes)', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'URL substring to wait for' }, timeout_ms: { type: 'number' } }, required: ['pattern'] } },
  { name: 'browser_evaluate', description: 'Execute JavaScript and return result', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
  { name: 'browser_set_value', description: 'Set input value (React/Vue safe via native setter)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_get_text', description: 'Get the innerText of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_attribute', description: 'Get an attribute value from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_is_visible', description: 'Check if an element is visible (rendered, non-zero size, not hidden)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_text', description: 'Find elements containing a text string and return their positions (x,y)', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_status', description: 'Check CDP connection and active tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_hover', description: 'Move mouse over x,y coordinates (reveals tooltips and dropdown menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_hover_selector', description: 'Move mouse over element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_handle_dialog', description: 'Accept or dismiss an alert/confirm/prompt dialog', inputSchema: { type: 'object', properties: { accept: { type: 'boolean', description: 'true to click OK/Accept, false to click Cancel/Dismiss' }, prompt_text: { type: 'string', description: 'Text to enter into prompt dialogs' } }, required: ['accept'] } },
  { name: 'browser_file_upload', description: 'Set files on an <input type="file"> element', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the file input' }, file_paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to files' } }, required: ['selector', 'file_paths'] } },
  { name: 'browser_console_messages', description: 'Get browser console output (log, warn, error). Useful for diagnosing JS errors.', inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Filter by type: log, warn, error, info' } } } },
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
    watchdogHandle = startWatchdog(config.debugPort, reconnect);
  } catch {
    process.stderr.write(`Warning: Chrome not reachable on port ${config.debugPort}. Run claudebrowser init first.\n`);
  }

  const server = new Server(
    { name: 'claudebrowser', version: '1.4.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    const a = args as Record<string, unknown>;

    if (!cdp.isConnected() && name !== 'browser_status') {
      try { resetNetworkMonitor(); resetConsoleMonitor(); await cdp.connect(); startNetworkMonitor(cdp); startConsoleMonitor(cdp); } catch {
        return fail('Chrome not connected. Is it running? Run: claudebrowser init', 'CDP_DISCONNECTED', 'claudebrowser status');
      }
    }

    try {
      switch (name) {
        case 'browser_navigate':      return ok(await navigate(cdp, a.url as string, config.navigationTimeoutMs));
        case 'browser_tabs':          return ok(a.all ? await listTabs(cdp) : await listSessionTabs(cdp, sessionId));
        case 'browser_sessions':      return ok(getAllSessions());
        case 'browser_new_tab':       return ok({ id: await newTab(config.debugPort, a.url as string | undefined, sessionId) });
        case 'browser_close_tab':     { await closeTab(config.debugPort, a.id as string, sessionId); return ok('Tab closed'); }
        case 'browser_switch_tab':    { await activateTab(config.debugPort, a.id as string); await cdp.disconnect(); await cdp.connect(a.id as string); return ok('Switched'); }
        case 'browser_back':          return ok({ url: await goBack(cdp) });
        case 'browser_reload':        { await reload(cdp, config.navigationTimeoutMs); return ok('Reloaded'); }
        case 'browser_screenshot':    return okImage(await takeScreenshot(cdp, (a.full_page as boolean) ?? false));
        case 'browser_accessibility_tree': return ok(await getAccessibilityTree(cdp));
        case 'browser_dom':           return ok(await getDom(cdp, a.selector as string | undefined));
        case 'browser_network_requests': return ok(getNetworkRequests(a.filter as string | undefined));
        case 'browser_click':         { await clickAt(cdp, a.x as number, a.y as number); return ok('Clicked'); }
        case 'browser_click_selector':{ await clickSelector(cdp, a.selector as string); return ok('Clicked'); }
        case 'browser_double_click':  { await doubleClickAt(cdp, a.x as number, a.y as number); return ok('Double-clicked'); }
        case 'browser_right_click':   { await rightClickAt(cdp, a.x as number, a.y as number); return ok('Right-clicked'); }
        case 'browser_type':          { await typeText(cdp, a.text as string); return ok('Typed'); }
        case 'browser_press_key':     { await pressKey(cdp, a.key as string); return ok('Key pressed'); }
        case 'browser_clear_input':   { await clearInput(cdp, a.selector as string); return ok('Input cleared'); }
        case 'browser_scroll':        { await scroll(cdp, a.direction as any, a.amount as number); return ok('Scrolled'); }
        case 'browser_select_option': { await selectOption(cdp, a.selector as string, a.value as string); return ok('Selected'); }
        case 'browser_wait_for':      { await waitForSelector(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element found'); }
        case 'browser_wait_for_network_idle': { await waitForNetworkIdle(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Network idle'); }
        case 'browser_wait_for_url':  return ok({ url: await waitForUrl(cdp, a.pattern as string, a.timeout_ms as number | undefined) });
        case 'browser_evaluate':      return ok(await evaluate(cdp, a.script as string));
        case 'browser_set_value':     { await setValue(cdp, a.selector as string, a.value as string); return ok('Value set'); }
        case 'browser_get_text':      return ok(await getText(cdp, a.selector as string));
        case 'browser_get_attribute': return ok(await getAttribute(cdp, a.selector as string, a.attribute as string));
        case 'browser_is_visible':    return ok({ visible: await isVisible(cdp, a.selector as string) });
        case 'browser_find_text':     return ok(await findText(cdp, a.text as string));
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
        case 'browser_hover':         { await hoverAt(cdp, a.x as number, a.y as number); return ok('Hovered'); }
        case 'browser_hover_selector':{ await hoverSelector(cdp, a.selector as string); return ok('Hovered'); }
        case 'browser_handle_dialog': { await handleDialog(cdp, a.accept as boolean, a.prompt_text as string | undefined); return ok('Dialog handled'); }
        case 'browser_file_upload':   { await uploadFile(cdp, a.selector as string, a.file_paths as string[]); return ok('Files set'); }
        case 'browser_console_messages': return ok(getConsoleMessages(a.type as string | undefined));
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
    } catch (e: any) {
      return fail(e.message, 'TOOL_ERROR', 'Check browser_status to verify connection');
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
