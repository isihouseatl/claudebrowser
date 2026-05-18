// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CdpClient } from './cdp/client';
import { listTabs, listSessionTabs, newTab, closeTab, activateTab } from './cdp/tabs';
import { generateSessionId, registerSession, unregisterSession, pruneDeadSessions, getAllSessions } from './session';
import { navigate, reload, goBack, scroll, waitForSelector, waitForNetworkIdle, waitForUrl, scrollToElement, setViewport, printToPDF, waitForNewTab, getPageMetrics } from './cdp/page';
import { clickAt, clickSelector, typeText, pressKey, keyChord, selectOption, setValue, hoverAt, hoverSelector, handleDialog, uploadFile, doubleClickAt, clearInput, rightClickAt, dragAndDrop, focusElement, blurActiveElement, getFormValues } from './cdp/input';
import { takeScreenshot, getAccessibilityTree, getDom } from './cdp/capture';
import { evaluate, getNetworkRequests, startNetworkMonitor, resetNetworkMonitor, startConsoleMonitor, resetConsoleMonitor, getConsoleMessages, clearNetworkLog, clearConsoleLog } from './cdp/evaluate';
import { checkAllAuth, waitForAuth, AUTH_PRESETS } from './cdp/auth';
import { getText, getAttribute, isVisible, findText } from './cdp/query';
import { startFrameMonitor, getFrames, evaluateInFrame, switchToFrame, switchToMainFrame } from './cdp/frame';
import { applyStealthPatches } from './cdp/stealth';
import { getCookies, setCookie, deleteCookies, clearAllCookies, getLocalStorage, setLocalStorage, removeLocalStorage, getAllLocalStorage, clearLocalStorage } from './cdp/storage';
import { waitForResponse, interceptRequest, clearInterceptions } from './cdp/network';
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
  // ── Navigation ──────────────────────────────────────────────────────────────
  { name: 'browser_navigate', description: 'Navigate to a URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'browser_back', description: 'Go back in history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_reload', description: 'Reload the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for', description: 'Wait for a CSS selector to appear', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_network_idle', description: 'Wait until no network requests are in flight (essential after SPA navigation)', inputSchema: { type: 'object', properties: { idle_ms: { type: 'number' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_wait_for_url', description: 'Wait until page URL contains a substring (SPA route changes)', inputSchema: { type: 'object', properties: { pattern: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['pattern'] } },
  { name: 'browser_wait_for_response', description: 'Wait for a network response whose URL contains the given pattern', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['url_pattern'] } },
  { name: 'browser_wait_for_new_tab', description: 'Wait for a new browser tab to open (e.g. after clicking a link that opens in a new window)', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  // ── Tabs & sessions ─────────────────────────────────────────────────────────
  { name: 'browser_tabs', description: 'List tabs owned by this session. Pass all:true for all Chrome tabs.', inputSchema: { type: 'object', properties: { all: { type: 'boolean' } } } },
  { name: 'browser_sessions', description: 'List all active claudebrowser sessions', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_new_tab', description: 'Open a new tab', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
  { name: 'browser_close_tab', description: 'Close a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'browser_switch_tab', description: 'Switch to a tab by id', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  // ── Capture ──────────────────────────────────────────────────────────────────
  { name: 'browser_screenshot', description: 'Take a screenshot', inputSchema: { type: 'object', properties: { full_page: { type: 'boolean' } } } },
  { name: 'browser_accessibility_tree', description: 'Get ARIA accessibility tree', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dom', description: 'Get outer HTML of element or body', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'browser_network_requests', description: 'Get recent network requests', inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'URL substring filter' } } } },
  { name: 'browser_console_messages', description: 'Get browser console output (log, warn, error)', inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Filter by type: log, warn, error, info' } } } },
  { name: 'browser_clear_console', description: 'Clear the console message buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_network_log', description: 'Clear the network request buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_page_metrics', description: 'Get page performance metrics: DOM nodes, JS heap size, event listeners', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_print_to_pdf', description: 'Export the current page as a base64-encoded PDF', inputSchema: { type: 'object', properties: { landscape: { type: 'boolean' }, print_background: { type: 'boolean' }, scale: { type: 'number' } } } },
  // ── Viewport ─────────────────────────────────────────────────────────────────
  { name: 'browser_set_viewport', description: 'Resize the browser viewport (for responsive testing)', inputSchema: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, device_scale_factor: { type: 'number' }, mobile: { type: 'boolean' } }, required: ['width', 'height'] } },
  // ── Click & mouse ─────────────────────────────────────────────────────────────
  { name: 'browser_click', description: 'Click at x,y coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_click_selector', description: 'Click element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_wait_and_click', description: 'Wait for element to appear then click it', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_double_click', description: 'Double-click at x,y', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_right_click', description: 'Right-click at x,y (opens context menus)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_drag', description: 'Drag from one coordinate to another (drag and drop)', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' }, steps: { type: 'number', description: 'Intermediate steps (default 10)' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_hover', description: 'Move mouse over x,y (reveals tooltips/dropdowns)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_hover_selector', description: 'Move mouse over element by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_scroll', description: 'Scroll the page by pixel amount', inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }, amount: { type: 'number' } }, required: ['direction', 'amount'] } },
  { name: 'browser_scroll_to', description: 'Scroll an element into view by CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Keyboard & input ─────────────────────────────────────────────────────────
  { name: 'browser_type', description: 'Type text at current focus', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_press_key', description: 'Press a key with optional modifiers (Enter, Tab, Escape, etc.)', inputSchema: { type: 'object', properties: { key: { type: 'string' }, modifiers: { type: 'array', items: { type: 'string' }, description: 'e.g. ["ctrl", "shift"]' } }, required: ['key'] } },
  { name: 'browser_key_chord', description: 'Keyboard shortcut: Ctrl+A, Cmd+Z, Shift+Tab, etc.', inputSchema: { type: 'object', properties: { modifiers: { type: 'array', items: { type: 'string' } }, key: { type: 'string' } }, required: ['modifiers', 'key'] } },
  { name: 'browser_clear_input', description: 'Clear an input field (select all + backspace)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_focus', description: 'Focus an element without clicking it', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_blur', description: 'Remove focus from the currently focused element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_select_option', description: 'Select a <select> option by value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_value', description: 'Set input value (React/Vue safe via native setter)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_get_form_values', description: 'Read all field values from a form element as a key-value object', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <form> element' } }, required: ['selector'] } },
  { name: 'browser_handle_dialog', description: 'Accept or dismiss an alert/confirm/prompt dialog', inputSchema: { type: 'object', properties: { accept: { type: 'boolean' }, prompt_text: { type: 'string' } }, required: ['accept'] } },
  { name: 'browser_file_upload', description: 'Set files on an <input type="file"> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, file_paths: { type: 'array', items: { type: 'string' } } }, required: ['selector', 'file_paths'] } },
  // ── Evaluate & query ──────────────────────────────────────────────────────────
  { name: 'browser_evaluate', description: 'Execute JavaScript and return result', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
  { name: 'browser_get_text', description: 'Get innerText of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_attribute', description: 'Get an attribute value from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_is_visible', description: 'Check if an element is visible', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_text', description: 'Find elements containing text, returns positions (x,y)', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  // ── Storage ───────────────────────────────────────────────────────────────────
  { name: 'browser_get_cookies', description: 'Get all cookies for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_cookie', description: 'Set a cookie on the current page', inputSchema: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, domain: { type: 'string' }, path: { type: 'string' }, expires: { type: 'number' }, http_only: { type: 'boolean' }, secure: { type: 'boolean' } }, required: ['name', 'value'] } },
  { name: 'browser_delete_cookies', description: 'Delete cookies by name', inputSchema: { type: 'object', properties: { name: { type: 'string' }, domain: { type: 'string' } }, required: ['name'] } },
  { name: 'browser_clear_cookies', description: 'Clear all cookies for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_local_storage', description: 'Read a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_set_local_storage', description: 'Set a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
  { name: 'browser_remove_local_storage', description: 'Remove a localStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_get_all_local_storage', description: 'Get all localStorage entries as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_local_storage', description: 'Clear all localStorage for the current page', inputSchema: { type: 'object', properties: {} } },
  // ── Network interception ──────────────────────────────────────────────────────
  { name: 'browser_intercept_request', description: 'Mock a network request — matching URLs get the given response body instead of hitting the server', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, status: { type: 'number' }, body: { type: 'string' }, content_type: { type: 'string' } }, required: ['url_pattern'] } },
  { name: 'browser_clear_interceptions', description: 'Remove all active request interceptions', inputSchema: { type: 'object', properties: {} } },
  // ── Frames (iframes) ──────────────────────────────────────────────────────────
  { name: 'browser_get_frames', description: 'List all frames (iframes) on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_frame', description: 'Execute JavaScript inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <iframe> element' }, script: { type: 'string' } }, required: ['selector', 'script'] } },
  { name: 'browser_switch_frame', description: 'Switch all subsequent operations to run inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_switch_main_frame', description: 'Switch back to the main page frame', inputSchema: { type: 'object', properties: {} } },
  // ── Status & auth ─────────────────────────────────────────────────────────────
  { name: 'browser_status', description: 'Check CDP connection and active tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_auth_check', description: 'Check login status for Instagram, Meta Ads, TikTok Ads. Run before any automation.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_auth', description: 'Wait up to 2 minutes for the user to log in', inputSchema: { type: 'object', properties: { platform: { type: 'string' }, timeout_ms: { type: 'number' } } } },
];

export async function startServer(sessionName?: string): Promise<void> {
  const config = readConfig();
  const cdp = new CdpClient(config.debugPort);

  pruneDeadSessions();
  const sessionId = generateSessionId();
  registerSession(sessionId, sessionName);

  let watchdogHandle: NodeJS.Timeout | null = null;
  const reconnect = async () => {
    try {
      resetNetworkMonitor();
      resetConsoleMonitor();
      await cdp.connect();
      startNetworkMonitor(cdp);
      startConsoleMonitor(cdp);
      startFrameMonitor(cdp);
    } catch { /* retry on next watchdog tick */ }
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
    { name: 'claudebrowser', version: '1.6.0' },
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

    const NO_TIMEOUT = new Set(['browser_wait_for_auth', 'browser_auth_check', 'browser_status', 'browser_wait_for_response', 'browser_wait_for_new_tab']);

    const run = async () => {
      switch (name) {
        // Navigation
        case 'browser_navigate':               return ok(await navigate(cdp, a.url as string, config.navigationTimeoutMs));
        case 'browser_back':                   return ok({ url: await goBack(cdp) });
        case 'browser_reload':                 { await reload(cdp, config.navigationTimeoutMs); return ok('Reloaded'); }
        case 'browser_wait_for':               { await waitForSelector(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element found'); }
        case 'browser_wait_for_network_idle':  { await waitForNetworkIdle(cdp, a.idle_ms as number | undefined, a.timeout_ms as number | undefined); return ok('Network idle'); }
        case 'browser_wait_for_url':           return ok({ url: await waitForUrl(cdp, a.pattern as string, a.timeout_ms as number | undefined) });
        case 'browser_wait_for_response':      return ok(await waitForResponse(cdp, a.url_pattern as string, a.timeout_ms as number | undefined));
        case 'browser_wait_for_new_tab':       return ok({ targetId: await waitForNewTab(cdp, a.timeout_ms as number | undefined) });
        // Tabs
        case 'browser_tabs':                   return ok(a.all ? await listTabs(cdp) : await listSessionTabs(cdp, sessionId));
        case 'browser_sessions':               return ok(getAllSessions());
        case 'browser_new_tab':                return ok({ id: await newTab(config.debugPort, a.url as string | undefined, sessionId) });
        case 'browser_close_tab':              { await closeTab(config.debugPort, a.id as string, sessionId); return ok('Tab closed'); }
        case 'browser_switch_tab':             { await activateTab(config.debugPort, a.id as string); await cdp.disconnect(); await cdp.connect(a.id as string); return ok('Switched'); }
        // Capture
        case 'browser_screenshot':             return okImage(await takeScreenshot(cdp, (a.full_page as boolean) ?? false));
        case 'browser_accessibility_tree':     return ok(await getAccessibilityTree(cdp));
        case 'browser_dom':                    return ok(await getDom(cdp, a.selector as string | undefined));
        case 'browser_network_requests':       return ok(getNetworkRequests(a.filter as string | undefined));
        case 'browser_console_messages':       return ok(getConsoleMessages(a.type as string | undefined));
        case 'browser_clear_console':          { clearConsoleLog(); return ok('Console cleared'); }
        case 'browser_clear_network_log':      { clearNetworkLog(); return ok('Network log cleared'); }
        case 'browser_get_page_metrics':       return ok(await getPageMetrics(cdp));
        case 'browser_print_to_pdf':           return ok(await printToPDF(cdp, { landscape: a.landscape as boolean | undefined, printBackground: a.print_background as boolean | undefined, scale: a.scale as number | undefined }));
        // Viewport
        case 'browser_set_viewport':           { await setViewport(cdp, a.width as number, a.height as number, a.device_scale_factor as number | undefined, a.mobile as boolean | undefined); return ok('Viewport set'); }
        // Click & mouse
        case 'browser_click':                  { await clickAt(cdp, a.x as number, a.y as number); return ok('Clicked'); }
        case 'browser_click_selector':         { await clickSelector(cdp, a.selector as string); return ok('Clicked'); }
        case 'browser_wait_and_click':         { await retry(() => clickSelector(cdp, a.selector as string), { timeoutMs: (a.timeout_ms as number) ?? 10000, errorMessage: `Element not clickable: ${a.selector}` }); return ok('Clicked'); }
        case 'browser_double_click':           { await doubleClickAt(cdp, a.x as number, a.y as number); return ok('Double-clicked'); }
        case 'browser_right_click':            { await rightClickAt(cdp, a.x as number, a.y as number); return ok('Right-clicked'); }
        case 'browser_drag':                   { await dragAndDrop(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number, a.steps as number | undefined); return ok('Dragged'); }
        case 'browser_hover':                  { await hoverAt(cdp, a.x as number, a.y as number); return ok('Hovered'); }
        case 'browser_hover_selector':         { await hoverSelector(cdp, a.selector as string); return ok('Hovered'); }
        case 'browser_scroll':                 { await scroll(cdp, a.direction as any, a.amount as number); return ok('Scrolled'); }
        case 'browser_scroll_to':              return ok(await scrollToElement(cdp, a.selector as string));
        // Keyboard & input
        case 'browser_type':                   { await typeText(cdp, a.text as string); return ok('Typed'); }
        case 'browser_press_key':              { await pressKey(cdp, a.key as string, a.modifiers as string[] | undefined); return ok('Key pressed'); }
        case 'browser_key_chord':              { await keyChord(cdp, a.modifiers as string[], a.key as string); return ok('Chord sent'); }
        case 'browser_clear_input':            { await clearInput(cdp, a.selector as string); return ok('Input cleared'); }
        case 'browser_focus':                  { await focusElement(cdp, a.selector as string); return ok('Focused'); }
        case 'browser_blur':                   { await blurActiveElement(cdp); return ok('Blurred'); }
        case 'browser_select_option':          { await selectOption(cdp, a.selector as string, a.value as string); return ok('Selected'); }
        case 'browser_set_value':              { await setValue(cdp, a.selector as string, a.value as string); return ok('Value set'); }
        case 'browser_get_form_values':        return ok(await getFormValues(cdp, a.selector as string));
        case 'browser_handle_dialog':          { await handleDialog(cdp, a.accept as boolean, a.prompt_text as string | undefined); return ok('Dialog handled'); }
        case 'browser_file_upload':            { await uploadFile(cdp, a.selector as string, a.file_paths as string[]); return ok('Files set'); }
        // Evaluate & query
        case 'browser_evaluate':               return ok(await evaluate(cdp, a.script as string));
        case 'browser_get_text':               return ok(await getText(cdp, a.selector as string));
        case 'browser_get_attribute':          return ok(await getAttribute(cdp, a.selector as string, a.attribute as string));
        case 'browser_is_visible':             return ok({ visible: await isVisible(cdp, a.selector as string) });
        case 'browser_find_text':              return ok(await findText(cdp, a.text as string));
        // Storage
        case 'browser_get_cookies':            return ok(await getCookies(cdp));
        case 'browser_set_cookie':             { await setCookie(cdp, a.name as string, a.value as string, { domain: a.domain as string | undefined, path: a.path as string | undefined, expires: a.expires as number | undefined, httpOnly: a.http_only as boolean | undefined, secure: a.secure as boolean | undefined }); return ok('Cookie set'); }
        case 'browser_delete_cookies':         { await deleteCookies(cdp, a.name as string, { domain: a.domain as string | undefined }); return ok('Cookies deleted'); }
        case 'browser_clear_cookies':          { await clearAllCookies(cdp); return ok('Cookies cleared'); }
        case 'browser_get_local_storage':      return ok(await getLocalStorage(cdp, a.key as string));
        case 'browser_set_local_storage':      { await setLocalStorage(cdp, a.key as string, a.value as string); return ok('localStorage set'); }
        case 'browser_remove_local_storage':   { await removeLocalStorage(cdp, a.key as string); return ok('localStorage key removed'); }
        case 'browser_get_all_local_storage':  return ok(await getAllLocalStorage(cdp));
        case 'browser_clear_local_storage':    { await clearLocalStorage(cdp); return ok('localStorage cleared'); }
        // Network interception
        case 'browser_intercept_request': {
          const cleanup = await interceptRequest(cdp, { urlPattern: a.url_pattern as string, status: a.status as number | undefined, body: a.body as string | undefined, contentType: a.content_type as string | undefined });
          // Store cleanup in a module-level map keyed by session for later clearing
          _interceptCleanups.set(sessionId, [...(_interceptCleanups.get(sessionId) ?? []), cleanup]);
          return ok('Interception active');
        }
        case 'browser_clear_interceptions': {
          const cleanups = _interceptCleanups.get(sessionId) ?? [];
          for (const fn of cleanups) await fn().catch(() => {});
          _interceptCleanups.delete(sessionId);
          await clearInterceptions(cdp);
          return ok('Interceptions cleared');
        }
        // Frames
        case 'browser_get_frames':             return ok(await getFrames(cdp));
        case 'browser_evaluate_in_frame':      return ok(await evaluateInFrame(cdp, a.selector as string, a.script as string));
        case 'browser_switch_frame':           return ok({ frameId: await switchToFrame(cdp, a.selector as string) });
        case 'browser_switch_main_frame':      { switchToMainFrame(cdp); return ok('Switched to main frame'); }
        // Status
        case 'browser_status': {
          if (!cdp.isConnected()) return ok({ connected: false, port: config.debugPort });
          const target = await cdp.getActiveTarget();
          return ok({ connected: true, port: config.debugPort, sessionId, sessionName: sessionName ?? null, activeTab: target ? { url: target.url, title: target.title } : null });
        }
        // Auth
        case 'browser_auth_check': {
          const checks = config.authChecks ?? AUTH_PRESETS;
          return ok(await checkAllAuth(cdp, checks));
        }
        case 'browser_wait_for_auth': {
          const platformName = a.platform as string | undefined;
          const checks = config.authChecks ?? AUTH_PRESETS;
          const check = platformName ? checks.find(c => c.name.toLowerCase() === platformName.toLowerCase()) : checks[0];
          if (!check) return fail(`Unknown platform: ${platformName}`, 'AUTH_PLATFORM_NOT_FOUND', `Known: ${checks.map(c => c.name).join(', ')}`);
          return ok({ loggedIn: await waitForAuth(cdp, check, (a.timeout_ms as number) ?? 120000), platform: check.name });
        }
        default: return fail(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
      }
    };

    try {
      if (NO_TIMEOUT.has(name)) return await run();
      return await withTimeout(name, DEFAULT_TOOL_TIMEOUT_MS, run);
    } catch (e: any) {
      if (e instanceof TimeoutError) return fail(e.message, 'TOOL_TIMEOUT', 'The page may be unresponsive. Try browser_screenshot to check state.');
      return fail(e.message, 'TOOL_ERROR', 'Check browser_status to verify connection');
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Per-session intercept cleanup registry
const _interceptCleanups = new Map<string, Array<() => Promise<void>>>();
