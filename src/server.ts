// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CdpClient } from './cdp/client';
import { listTabs, listSessionTabs, newTab, closeTab, activateTab } from './cdp/tabs';
import { generateSessionId, registerSession, unregisterSession, pruneDeadSessions, getAllSessions } from './session';
import { navigate, reload, goBack, goForward, scroll, waitForSelector, waitForNetworkIdle, waitForUrl, scrollToElement, setViewport, printToPDF, waitForNewTab, getPageMetrics, getUrl, getTitle, waitForElementRemoved, waitForText, getScrollPosition, scrollToCoords, scrollToTop, scrollToBottom, waitForAttribute, waitForElementCount, getPageSource, getHistoryLength, goToHistoryIndex, scrollIntoView, getMetaTags, getLinkTags, getReadyState, waitForDOMContentLoaded } from './cdp/page';
import { clickAt, clickSelector, typeText, pressKey, keyChord, setValue, hoverAt, hoverSelector, handleDialog, uploadFile, doubleClickAt, clearInput, rightClickAt, dragAndDrop, focusElement, blurActiveElement, getFormValues, setRangeValue, setDateValue, setColorValue, setSelectionRange, tapAt, swipeAt, pinchZoom } from './cdp/input';
import { takeScreenshot, getAccessibilityTree, getDom } from './cdp/capture';
import { evaluate, getNetworkRequests, startNetworkMonitor, resetNetworkMonitor, startConsoleMonitor, resetConsoleMonitor, getConsoleMessages, clearNetworkLog, clearConsoleLog, evaluateOnElement, getWindowGlobals } from './cdp/evaluate';
import { checkAllAuth, waitForAuth, AUTH_PRESETS } from './cdp/auth';
import { getText, getAttribute, isVisible, findText, getAllText, getAllAttributes } from './cdp/query';
import { startFrameMonitor, getFrames, evaluateInFrame, switchToFrame, switchToMainFrame } from './cdp/frame';
import { applyStealthPatches } from './cdp/stealth';
import { getCookies, setCookie, deleteCookies, clearAllCookies, getLocalStorage, setLocalStorage, removeLocalStorage, getAllLocalStorage, clearLocalStorage, getSessionStorage, setSessionStorage, removeSessionStorage, getAllSessionStorage, clearSessionStorage } from './cdp/storage';
import { waitForResponse, interceptRequest, clearInterceptions, getResponseBody } from './cdp/network';
import { isEnabled, isChecked, getBoundingBox, countElements, getComputedStyle as getElementComputedStyle, selectOption as elementSelectOption, getSelectOptions } from './cdp/element';
import { startConsoleMonitor as startCdpConsole, getConsoleMessages as getCdpConsoleMessages, clearConsoleMessages as clearCdpConsoleMessages, getJsErrors, clearJsErrors, stopConsoleMonitor as stopCdpConsole } from './cdp/console';
import { startNetworkLog, getNetworkLog, clearNetworkLog as clearNetLog, stopNetworkLog } from './cdp/netlog';
import { setUserAgent, setDeviceMetrics, clearDeviceMetrics, setNetworkConditions, clearNetworkConditions, setGeolocation, clearGeolocation, grantPermission, resetPermissions, setMediaType, setColorScheme, setPrefersReducedMotion } from './cdp/emulation';
import { setExtraHeaders, clearExtraHeaders } from './cdp/network';
import { getInnerHtml, getTableData, screenshotElement } from './cdp/extract';
import { queryShadow, getShadowHtml, evaluateInShadow } from './cdp/shadow';
import { setAttribute, removeAttribute, addClass, removeClass, injectCss, removeInjectedCss, submitForm, resetForm } from './cdp/dom';
import { setClipboard, getClipboard } from './cdp/clipboard';
import { listIndexedDatabases, getAllIndexedDb, getIndexedDb, clearIndexedDb } from './cdp/indexeddb';
import { getPaintTiming, getNavigationTiming, getResourceTimings, clearPerformanceBuffer } from './cdp/performance';
import { startWebSocketLog, getWebSocketMessages, getWebSocketConnections, clearWebSocketLog, stopWebSocketLog } from './cdp/websocket';
import { startCssCoverage, stopCssCoverage, startJsCoverage, takeJsCoverage, stopJsCoverage } from './cdp/coverage';
import { listServiceWorkers, unregisterServiceWorker, updateServiceWorker, isControlledByServiceWorker } from './cdp/serviceworker';
import { getPageSnapshot } from './cdp/snapshot';
import { startMutationObserver, getMutations, clearMutations, stopMutationObserver, stopAllMutationObservers, waitForMutation } from './cdp/mutation';
import { getMediaElements, playMedia, pauseMedia, seekMedia, setMediaVolume, setMediaMuted, setPlaybackRate, waitForMediaReady } from './cdp/media';
import { dispatchEvent as dispatchDomEvent, triggerReactChange, waitForEvent, getPerformanceMarks, setPerformanceMark, measurePerformance } from './cdp/events';
import { getAllTabSnapshots, findTabsByUrl, duplicateTab, getTabInfo, waitForTabLoad } from './cdp/tabstate';
import { startDownloadMonitor, getDownloads, clearDownloads, stopDownloadMonitor, waitForDownload } from './cdp/download';
import { getAxSubtree, getFocusedElement, getInteractiveAxNodes, getLiveRegions } from './cdp/accessibility';
import { waitForDialog, isDialogOpen, dismissPrintDialog } from './cdp/dialog';
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
  { name: 'browser_get_url', description: 'Get the current page URL', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_title', description: 'Get the current page title', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_forward', description: 'Go forward in browser history', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_removed', description: 'Wait until an element is removed from the DOM (e.g. loading spinner disappears)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  { name: 'browser_wait_for_text', description: 'Wait until an element exists and its text contains the given string', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'text'] } },
  { name: 'browser_wait_for_attribute', description: 'Wait until an element has a specific attribute value', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' }, value: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'attribute', 'value'] } },
  { name: 'browser_wait_for_count', description: 'Wait until exactly N elements match a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, count: { type: 'number' }, timeout_ms: { type: 'number' } }, required: ['selector', 'count'] } },
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
  { name: 'browser_get_page_source', description: 'Get the full HTML source of the page (document.documentElement.outerHTML)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_history_length', description: 'Get the number of entries in the browser history for this tab', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_go_to_history_index', description: 'Navigate to a history entry by offset (e.g. -2 = two pages back, 1 = one page forward)', inputSchema: { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] } },
  { name: 'browser_scroll_into_view', description: 'Scroll so that coordinates (x,y) are centered in the viewport', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_scroll_to_top', description: 'Scroll to the top of the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_bottom', description: 'Scroll to the bottom of the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_scroll_to_coords', description: 'Scroll to absolute coordinates (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_get_scroll_position', description: 'Get the current scroll position: {x, y}', inputSchema: { type: 'object', properties: {} } },
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
  { name: 'browser_get_all_text', description: 'Get innerText of ALL elements matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_attribute', description: 'Get an attribute value from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_get_all_attributes', description: 'Get an attribute value from ALL elements matching a selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_is_visible', description: 'Check if an element is visible', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_find_text', description: 'Find elements containing text, returns positions (x,y)', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  // ── DOM manipulation ──────────────────────────────────────────────────────────
  { name: 'browser_set_attribute', description: 'Set an attribute on an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'attribute', 'value'] } },
  { name: 'browser_remove_attribute', description: 'Remove an attribute from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, attribute: { type: 'string' } }, required: ['selector', 'attribute'] } },
  { name: 'browser_add_class', description: 'Add a CSS class to an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, class_name: { type: 'string' } }, required: ['selector', 'class_name'] } },
  { name: 'browser_remove_class', description: 'Remove a CSS class from an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, class_name: { type: 'string' } }, required: ['selector', 'class_name'] } },
  { name: 'browser_inject_css', description: 'Inject a <style> tag into the page. Returns a styleId for removal.', inputSchema: { type: 'object', properties: { css: { type: 'string' } }, required: ['css'] } },
  { name: 'browser_remove_css', description: 'Remove a previously injected style by its styleId', inputSchema: { type: 'object', properties: { style_id: { type: 'string' } }, required: ['style_id'] } },
  { name: 'browser_submit_form', description: 'Submit a form element programmatically', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_reset_form', description: 'Reset a form to its default values', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Clipboard ─────────────────────────────────────────────────────────────────
  { name: 'browser_set_clipboard', description: 'Write text to the clipboard', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'browser_get_clipboard', description: 'Read text from the clipboard (requires clipboard-read permission — use browser_grant_permission first)', inputSchema: { type: 'object', properties: {} } },
  // ── IndexedDB ─────────────────────────────────────────────────────────────────
  { name: 'browser_list_indexed_databases', description: 'List all IndexedDB database names for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_all_indexed_db', description: 'Get all records from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  { name: 'browser_get_indexed_db', description: 'Get a single record from IndexedDB by key', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' }, key: {} }, required: ['db_name', 'store_name', 'key'] } },
  { name: 'browser_clear_indexed_db', description: 'Clear all records from an IndexedDB object store', inputSchema: { type: 'object', properties: { db_name: { type: 'string' }, store_name: { type: 'string' } }, required: ['db_name', 'store_name'] } },
  // ── Performance ───────────────────────────────────────────────────────────────
  { name: 'browser_get_paint_timing', description: 'Get First Paint and First Contentful Paint timings in ms', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_navigation_timing', description: 'Get navigation timing breakdown: TTFB, DOMContentLoaded, load, DNS, TCP', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_resource_timings', description: 'Get all resource timings (scripts, images, XHR, etc.) with duration and size', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_performance_buffer', description: 'Clear the performance resource timing buffer', inputSchema: { type: 'object', properties: {} } },
  // ── Media & CSS emulation ─────────────────────────────────────────────────────
  { name: 'browser_set_media_type', description: "Emulate CSS media type ('print', 'screen', or '' to reset)", inputSchema: { type: 'object', properties: { media: { type: 'string' } }, required: ['media'] } },
  { name: 'browser_set_color_scheme', description: "Emulate prefers-color-scheme ('light', 'dark', or '' to reset)", inputSchema: { type: 'object', properties: { scheme: { type: 'string' } }, required: ['scheme'] } },
  { name: 'browser_set_prefers_reduced_motion', description: "Emulate prefers-reduced-motion ('reduce' or '' to reset)", inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } },
  // ── Extra HTTP headers ────────────────────────────────────────────────────────
  { name: 'browser_set_extra_headers', description: 'Add extra HTTP headers to all subsequent requests (e.g. Authorization tokens)', inputSchema: { type: 'object', properties: { headers: { type: 'object', additionalProperties: { type: 'string' } } }, required: ['headers'] } },
  { name: 'browser_clear_extra_headers', description: 'Remove all extra HTTP header overrides', inputSchema: { type: 'object', properties: {} } },
  // ── Extraction ────────────────────────────────────────────────────────────────
  { name: 'browser_get_inner_html', description: 'Get the innerHTML of an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_table', description: 'Extract a table as an array of row objects (headers as keys)', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <table> element' } }, required: ['selector'] } },
  { name: 'browser_screenshot_element', description: 'Take a screenshot clipped to a single element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── Shadow DOM ────────────────────────────────────────────────────────────────
  { name: 'browser_query_shadow', description: 'querySelector inside a shadow root. Returns outerHTML of the found element or null.', inputSchema: { type: 'object', properties: { host_selector: { type: 'string', description: 'CSS selector for the shadow host element' }, shadow_selector: { type: 'string', description: 'CSS selector to run inside the shadow root' } }, required: ['host_selector', 'shadow_selector'] } },
  { name: 'browser_get_shadow_html', description: 'Get the innerHTML of a shadow root', inputSchema: { type: 'object', properties: { host_selector: { type: 'string' } }, required: ['host_selector'] } },
  { name: 'browser_evaluate_in_shadow', description: 'Run a JS function inside a shadow root. Script receives (shadowRoot, host) as arguments.', inputSchema: { type: 'object', properties: { host_selector: { type: 'string' }, script: { type: 'string', description: 'JS function expression e.g. (shadowRoot) => shadowRoot.querySelector("input").value' } }, required: ['host_selector', 'script'] } },
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
  { name: 'browser_get_session_storage', description: 'Read a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_set_session_storage', description: 'Set a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
  { name: 'browser_remove_session_storage', description: 'Remove a sessionStorage key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'browser_get_all_session_storage', description: 'Get all sessionStorage entries as a key-value object', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_session_storage', description: 'Clear all sessionStorage for the current page', inputSchema: { type: 'object', properties: {} } },
  // ── Element state ─────────────────────────────────────────────────────────────
  { name: 'browser_is_enabled', description: 'Check if an element is enabled (not disabled)', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_is_checked', description: 'Check if a checkbox or radio input is checked', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_bounding_box', description: 'Get the bounding box of an element: {x, y, width, height}', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_count_elements', description: 'Count how many elements match a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_computed_style', description: 'Get a computed CSS property value for an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, property: { type: 'string', description: 'CSS property name e.g. "color", "display"' } }, required: ['selector', 'property'] } },
  { name: 'browser_get_select_options', description: 'List all options in a <select> element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  // ── JS errors ─────────────────────────────────────────────────────────────────
  { name: 'browser_get_js_errors', description: 'Get JavaScript errors thrown on the page since monitoring started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_clear_js_errors', description: 'Clear the JavaScript error buffer', inputSchema: { type: 'object', properties: {} } },
  // ── Network capture (manual, full request log) ────────────────────────────────
  { name: 'browser_network_log_start', description: 'Start capturing all network requests and responses to a buffer', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_get', description: 'Get all captured network requests since log was started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_clear', description: 'Clear the network capture buffer without stopping capture', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_network_log_stop', description: 'Stop network capture and return the final log', inputSchema: { type: 'object', properties: {} } },
  // ── Device & environment emulation ───────────────────────────────────────────
  { name: 'browser_set_user_agent', description: 'Override the browser User-Agent string', inputSchema: { type: 'object', properties: { user_agent: { type: 'string' } }, required: ['user_agent'] } },
  { name: 'browser_set_device_metrics', description: 'Emulate a device: set viewport size, scale factor, and mobile mode', inputSchema: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, device_scale_factor: { type: 'number' }, mobile: { type: 'boolean' } }, required: ['width', 'height'] } },
  { name: 'browser_clear_device_metrics', description: 'Clear device metric overrides (restore actual screen)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_network_conditions', description: 'Simulate network throttling (e.g. slow 3G, offline)', inputSchema: { type: 'object', properties: { offline: { type: 'boolean' }, latency: { type: 'number', description: 'Latency in ms' }, download_throughput: { type: 'number', description: 'bytes/sec, -1 = no throttle' }, upload_throughput: { type: 'number', description: 'bytes/sec, -1 = no throttle' }, connection_type: { type: 'string', description: 'cellular2g|cellular3g|cellular4g|wifi|ethernet|none' } } } },
  { name: 'browser_clear_network_conditions', description: 'Remove network throttling (restore full speed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_geolocation', description: 'Spoof GPS location (latitude, longitude)', inputSchema: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, accuracy: { type: 'number', description: 'Accuracy in meters (default 100)' } }, required: ['latitude', 'longitude'] } },
  { name: 'browser_clear_geolocation', description: 'Remove geolocation override', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_grant_permission', description: 'Grant a browser permission (geolocation, notifications, camera, microphone, clipboard-read, clipboard-write)', inputSchema: { type: 'object', properties: { permission: { type: 'string' }, origin: { type: 'string', description: 'Origin to grant for (e.g. https://example.com). Omit for all origins.' } }, required: ['permission'] } },
  { name: 'browser_reset_permissions', description: 'Reset all browser permission overrides to default', inputSchema: { type: 'object', properties: {} } },
  // ── Network interception ──────────────────────────────────────────────────────
  { name: 'browser_intercept_request', description: 'Mock a network request — matching URLs get the given response body instead of hitting the server', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' }, status: { type: 'number' }, body: { type: 'string' }, content_type: { type: 'string' } }, required: ['url_pattern'] } },
  { name: 'browser_clear_interceptions', description: 'Remove all active request interceptions', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_response_body', description: 'Get the decoded response body for a captured network request by requestId', inputSchema: { type: 'object', properties: { request_id: { type: 'string' } }, required: ['request_id'] } },
  // ── Frames (iframes) ──────────────────────────────────────────────────────────
  { name: 'browser_get_frames', description: 'List all frames (iframes) on the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_evaluate_in_frame', description: 'Execute JavaScript inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector for the <iframe> element' }, script: { type: 'string' } }, required: ['selector', 'script'] } },
  { name: 'browser_switch_frame', description: 'Switch all subsequent operations to run inside a specific iframe', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_switch_main_frame', description: 'Switch back to the main page frame', inputSchema: { type: 'object', properties: {} } },
  // ── Input type helpers ────────────────────────────────────────────────────────
  { name: 'browser_set_range', description: 'Set the value of an <input type="range"> slider', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'number' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_date', description: 'Set the value of an <input type="date"> field (YYYY-MM-DD)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string', description: 'Date string in YYYY-MM-DD format' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_color', description: 'Set the value of an <input type="color"> field (#rrggbb hex)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string', description: 'Hex color e.g. #ff0000' } }, required: ['selector', 'value'] } },
  { name: 'browser_set_selection_range', description: 'Set the text selection range inside an input or textarea', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' } }, required: ['selector', 'start', 'end'] } },
  // ── Touch ─────────────────────────────────────────────────────────────────────
  { name: 'browser_tap', description: 'Simulate a touch tap at (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'browser_swipe', description: 'Simulate a touch swipe from (startX, startY) to (endX, endY)', inputSchema: { type: 'object', properties: { start_x: { type: 'number' }, start_y: { type: 'number' }, end_x: { type: 'number' }, end_y: { type: 'number' }, steps: { type: 'number', description: 'Number of intermediate touch points (default 10)' } }, required: ['start_x', 'start_y', 'end_x', 'end_y'] } },
  { name: 'browser_pinch_zoom', description: 'Simulate a two-finger pinch or zoom gesture at center (x, y)', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, from_distance: { type: 'number', description: 'Initial finger spread in pixels' }, to_distance: { type: 'number', description: 'Final finger spread in pixels (larger = zoom in, smaller = zoom out)' }, steps: { type: 'number' } }, required: ['x', 'y', 'from_distance', 'to_distance'] } },
  // ── WebSocket monitor ─────────────────────────────────────────────────────────
  { name: 'browser_websocket_start', description: 'Start capturing WebSocket messages and connections', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_messages', description: 'Get all captured WebSocket messages (sent + received) since log started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_connections', description: 'Get all WebSocket connections (open and closed) since log started', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_clear', description: 'Clear the WebSocket message/connection buffer without stopping capture', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_websocket_stop', description: 'Stop WebSocket capture and return the final message log', inputSchema: { type: 'object', properties: {} } },
  // ── CSS & JS Coverage ─────────────────────────────────────────────────────────
  { name: 'browser_start_css_coverage', description: 'Start CSS rule usage tracking (to find unused CSS)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_stop_css_coverage', description: 'Stop CSS coverage and return used/unused rules with offsets', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_start_js_coverage', description: 'Start JavaScript precise coverage tracking', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_take_js_coverage', description: 'Take a JS coverage snapshot without stopping (shows which code ranges ran)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_stop_js_coverage', description: 'Stop JS coverage and return the final coverage report', inputSchema: { type: 'object', properties: {} } },
  // ── Service Workers ───────────────────────────────────────────────────────────
  { name: 'browser_list_service_workers', description: 'List all registered service workers for the current page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_unregister_service_worker', description: 'Unregister a service worker by scope URL', inputSchema: { type: 'object', properties: { scope_url: { type: 'string' } }, required: ['scope_url'] } },
  { name: 'browser_update_service_worker', description: 'Force a service worker registration to update (re-fetch)', inputSchema: { type: 'object', properties: { scope_url: { type: 'string' } }, required: ['scope_url'] } },
  { name: 'browser_is_controlled_by_sw', description: 'Check whether the current page is controlled by a service worker', inputSchema: { type: 'object', properties: {} } },
  // ── DOM mutation observer ─────────────────────────────────────────────────────
  { name: 'browser_mutation_start', description: 'Start observing DOM mutations on elements matching a selector. Use a unique observerId to manage multiple observers.', inputSchema: { type: 'object', properties: { observer_id: { type: 'string', description: 'Unique name for this observer (e.g. "nav-changes")' }, selector: { type: 'string', description: 'CSS selector to observe, or "document" for page-level' }, child_list: { type: 'boolean' }, attributes: { type: 'boolean' }, character_data: { type: 'boolean' }, subtree: { type: 'boolean', description: 'Observe descendants too (default true)' } }, required: ['observer_id', 'selector'] } },
  { name: 'browser_mutation_get', description: 'Get all captured DOM mutations for a given observerId', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_clear', description: 'Clear the mutation buffer for an observer', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_stop', description: 'Stop a DOM mutation observer and return final mutations', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' } }, required: ['observer_id'] } },
  { name: 'browser_mutation_stop_all', description: 'Stop all active DOM mutation observers for this session', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_mutation', description: 'Wait for at least one DOM mutation to be captured by an observer', inputSchema: { type: 'object', properties: { observer_id: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['observer_id'] } },
  // ── Media ─────────────────────────────────────────────────────────────────────
  { name: 'browser_get_media', description: 'Get info for all <video> and <audio> elements: src, time, duration, paused, volume, etc.', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_play_media', description: 'Play a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_pause_media', description: 'Pause a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_seek_media', description: 'Seek a media element to a time in seconds', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, time: { type: 'number', description: 'Time in seconds' } }, required: ['selector', 'time'] } },
  { name: 'browser_set_media_volume', description: 'Set volume on a media element (0.0 to 1.0)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, volume: { type: 'number', description: '0.0 (silent) to 1.0 (full)' } }, required: ['selector', 'volume'] } },
  { name: 'browser_set_media_muted', description: 'Mute or unmute a media element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, muted: { type: 'boolean' } }, required: ['selector', 'muted'] } },
  { name: 'browser_set_playback_rate', description: 'Set playback rate on a media element (e.g. 0.5 = half speed, 2 = double speed)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, rate: { type: 'number' } }, required: ['selector', 'rate'] } },
  { name: 'browser_wait_for_media_ready', description: 'Wait for a media element to reach a readyState (default 4 = HAVE_ENOUGH_DATA)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, ready_state: { type: 'number', description: '1-4 (default 4)' }, timeout_ms: { type: 'number' } }, required: ['selector'] } },
  // ── DOM events & performance marks ────────────────────────────────────────────
  { name: 'browser_dispatch_event', description: 'Dispatch a DOM event on an element (click, change, input, focus, blur, keydown, custom, etc.)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, event_type: { type: 'string' }, bubbles: { type: 'boolean' }, cancelable: { type: 'boolean' }, detail: { description: 'Custom event detail (any JSON value)' }, key: { type: 'string' }, ctrl_key: { type: 'boolean' }, shift_key: { type: 'boolean' }, alt_key: { type: 'boolean' }, meta_key: { type: 'boolean' }, button: { type: 'number' }, client_x: { type: 'number' }, client_y: { type: 'number' } }, required: ['selector', 'event_type'] } },
  { name: 'browser_trigger_react_change', description: 'Trigger a React synthetic change event on a controlled input (bypasses React synthetic event system)', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'browser_wait_for_event', description: 'Wait for a custom DOM event to fire on document, window, or an element', inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector, "document", or "window"' }, event_type: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['selector', 'event_type'] } },
  { name: 'browser_get_performance_marks', description: 'Get all performance.mark() entries set by the page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_set_performance_mark', description: 'Set a performance mark in the page (performance.mark)', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'browser_measure_performance', description: 'Measure elapsed time between two performance marks', inputSchema: { type: 'object', properties: { name: { type: 'string' }, start_mark: { type: 'string' }, end_mark: { type: 'string' } }, required: ['name', 'start_mark', 'end_mark'] } },
  // ── Tab state ─────────────────────────────────────────────────────────────────
  { name: 'browser_get_all_tabs', description: 'Get a snapshot of all open Chrome tabs: id, url, title, loading state', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_find_tabs_by_url', description: 'Find tabs whose URL contains a given pattern', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string' } }, required: ['url_pattern'] } },
  { name: 'browser_duplicate_tab', description: 'Open a duplicate of a tab by its id', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' } }, required: ['tab_id'] } },
  { name: 'browser_get_tab_info', description: 'Get details for a specific tab by id', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' } }, required: ['tab_id'] } },
  { name: 'browser_wait_for_tab_load', description: 'Wait for a tab to finish loading', inputSchema: { type: 'object', properties: { tab_id: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['tab_id'] } },
  // ── Page snapshot ─────────────────────────────────────────────────────────────
  { name: 'browser_page_snapshot', description: 'Get a structured text snapshot of the page: URL, title, scroll, interactive elements, headings, ARIA alerts — faster than a screenshot for understanding page state', inputSchema: { type: 'object', properties: {} } },
  // ── Page metadata ─────────────────────────────────────────────────────────────
  { name: 'browser_get_meta_tags', description: 'Get all <meta> tags as array of {name, property, content, httpEquiv}', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_link_tags', description: 'Get all <link rel="..."> tags (stylesheets, canonical, preloads, etc.)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_ready_state', description: 'Get the document readyState: "loading", "interactive", or "complete"', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_load', description: 'Wait for document readyState to become "complete"', inputSchema: { type: 'object', properties: { timeout_ms: { type: 'number' } } } },
  // ── Evaluate helpers ──────────────────────────────────────────────────────────
  { name: 'browser_evaluate_on_element', description: 'Run a JS expression with the matched element as argument (e.g. "(el) => el.value")', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, script: { type: 'string', description: 'JS expression — can be arrow fn like (el) => el.value or plain expression like el.value' } }, required: ['selector', 'script'] } },
  { name: 'browser_get_window_globals', description: 'Get all app-defined global variables on the window object (filters out standard browser builtins)', inputSchema: { type: 'object', properties: {} } },
  // ── Downloads ─────────────────────────────────────────────────────────────────
  { name: 'browser_download_start', description: 'Start monitoring file downloads. Files are saved to downloadPath (default /tmp).', inputSchema: { type: 'object', properties: { download_path: { type: 'string', description: 'Directory to save downloads (default /tmp)' } } } },
  { name: 'browser_download_get', description: 'Get all captured download events (in-progress and completed)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_download_clear', description: 'Clear the download buffer without stopping monitoring', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_download_stop', description: 'Stop download monitoring and return the final event list', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_wait_for_download', description: 'Wait for a file download to complete. Optionally filter by URL pattern.', inputSchema: { type: 'object', properties: { url_pattern: { type: 'string', description: 'URL substring to match (optional)' }, timeout_ms: { type: 'number' } } } },
  // ── Accessibility (extended) ──────────────────────────────────────────────────
  { name: 'browser_get_ax_subtree', description: 'Get the accessibility tree subtree rooted at the element matching a CSS selector', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'browser_get_focused_element', description: 'Get the accessibility info for the currently focused element', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_interactive_ax_nodes', description: 'Get all interactive accessibility nodes (buttons, links, inputs, etc.) that are not disabled', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_live_regions', description: 'Get ARIA live region content: role="alert", role="status", role="log"', inputSchema: { type: 'object', properties: {} } },
  // ── Dialog ────────────────────────────────────────────────────────────────────
  { name: 'browser_wait_for_dialog', description: 'Wait for a browser dialog (alert/confirm/prompt) to appear, then handle it', inputSchema: { type: 'object', properties: { accept: { type: 'boolean', description: 'true = accept/OK, false = dismiss/Cancel (default true)' }, prompt_text: { type: 'string', description: 'Text for prompt dialogs' }, timeout_ms: { type: 'number' } } } },
  { name: 'browser_is_dialog_open', description: 'Check whether a browser dialog is currently open (non-blocking)', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_dismiss_print_dialog', description: 'Dismiss an open print dialog if one exists', inputSchema: { type: 'object', properties: {} } },
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
      await startCdpConsole(cdp);
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
    await startCdpConsole(cdp);
    await applyStealthPatches(cdp);
    watchdogHandle = startWatchdog(config.debugPort, reconnect);
  } catch {
    process.stderr.write(`Warning: Chrome not reachable on port ${config.debugPort}. Run claudebrowser init first.\n`);
  }

  const server = new Server(
    { name: 'claudebrowser', version: '1.12.0' },
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

    const NO_TIMEOUT = new Set(['browser_wait_for_auth', 'browser_auth_check', 'browser_status', 'browser_wait_for_response', 'browser_wait_for_new_tab', 'browser_wait_for_download', 'browser_wait_for_dialog']);

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
        case 'browser_get_url':                return ok({ url: await getUrl(cdp) });
        case 'browser_get_title':              return ok({ title: await getTitle(cdp) });
        case 'browser_forward':                return ok({ url: await goForward(cdp) });
        case 'browser_wait_for_removed':       { await waitForElementRemoved(cdp, a.selector as string, a.timeout_ms as number | undefined); return ok('Element removed'); }
        case 'browser_wait_for_text':          { await waitForText(cdp, a.selector as string, a.text as string, a.timeout_ms as number | undefined); return ok('Text found'); }
        case 'browser_wait_for_attribute':     { await waitForAttribute(cdp, a.selector as string, a.attribute as string, a.value as string, a.timeout_ms as number | undefined); return ok('Attribute matched'); }
        case 'browser_wait_for_count':         { await waitForElementCount(cdp, a.selector as string, a.count as number, a.timeout_ms as number | undefined); return ok('Count matched'); }
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
        case 'browser_scroll_to_top':          { await scrollToTop(cdp); return ok('Scrolled to top'); }
        case 'browser_scroll_to_bottom':       { await scrollToBottom(cdp); return ok('Scrolled to bottom'); }
        case 'browser_scroll_to_coords':       { await scrollToCoords(cdp, a.x as number, a.y as number); return ok('Scrolled'); }
        case 'browser_get_scroll_position':    return ok(await getScrollPosition(cdp));
        // Keyboard & input
        case 'browser_type':                   { await typeText(cdp, a.text as string); return ok('Typed'); }
        case 'browser_press_key':              { await pressKey(cdp, a.key as string, a.modifiers as string[] | undefined); return ok('Key pressed'); }
        case 'browser_key_chord':              { await keyChord(cdp, a.modifiers as string[], a.key as string); return ok('Chord sent'); }
        case 'browser_clear_input':            { await clearInput(cdp, a.selector as string); return ok('Input cleared'); }
        case 'browser_focus':                  { await focusElement(cdp, a.selector as string); return ok('Focused'); }
        case 'browser_blur':                   { await blurActiveElement(cdp); return ok('Blurred'); }
        case 'browser_select_option':          { await elementSelectOption(cdp, a.selector as string, a.value as string); return ok('Selected'); }
        case 'browser_set_value':              { await setValue(cdp, a.selector as string, a.value as string); return ok('Value set'); }
        case 'browser_get_form_values':        return ok(await getFormValues(cdp, a.selector as string));
        case 'browser_handle_dialog':          { await handleDialog(cdp, a.accept as boolean, a.prompt_text as string | undefined); return ok('Dialog handled'); }
        case 'browser_file_upload':            { await uploadFile(cdp, a.selector as string, a.file_paths as string[]); return ok('Files set'); }
        // Evaluate & query
        case 'browser_evaluate':               return ok(await evaluate(cdp, a.script as string));
        case 'browser_get_text':               return ok(await getText(cdp, a.selector as string));
        case 'browser_get_all_text':           return ok(await getAllText(cdp, a.selector as string));
        case 'browser_get_attribute':          return ok(await getAttribute(cdp, a.selector as string, a.attribute as string));
        case 'browser_get_all_attributes':     return ok(await getAllAttributes(cdp, a.selector as string, a.attribute as string));
        case 'browser_is_visible':             return ok({ visible: await isVisible(cdp, a.selector as string) });
        case 'browser_find_text':              return ok(await findText(cdp, a.text as string));
        // DOM manipulation
        case 'browser_set_attribute':          { await setAttribute(cdp, a.selector as string, a.attribute as string, a.value as string); return ok('Attribute set'); }
        case 'browser_remove_attribute':       { await removeAttribute(cdp, a.selector as string, a.attribute as string); return ok('Attribute removed'); }
        case 'browser_add_class':              { await addClass(cdp, a.selector as string, a.class_name as string); return ok('Class added'); }
        case 'browser_remove_class':           { await removeClass(cdp, a.selector as string, a.class_name as string); return ok('Class removed'); }
        case 'browser_inject_css':             return ok({ styleId: await injectCss(cdp, a.css as string) });
        case 'browser_remove_css':             { await removeInjectedCss(cdp, a.style_id as string); return ok('Style removed'); }
        case 'browser_submit_form':            { await submitForm(cdp, a.selector as string); return ok('Form submitted'); }
        case 'browser_reset_form':             { await resetForm(cdp, a.selector as string); return ok('Form reset'); }
        // Clipboard
        case 'browser_set_clipboard':          { await setClipboard(cdp, a.text as string); return ok('Clipboard set'); }
        case 'browser_get_clipboard':          return ok({ text: await getClipboard(cdp) });
        // IndexedDB
        case 'browser_list_indexed_databases': return ok(await listIndexedDatabases(cdp));
        case 'browser_get_all_indexed_db':     return ok(await getAllIndexedDb(cdp, a.db_name as string, a.store_name as string));
        case 'browser_get_indexed_db':         return ok(await getIndexedDb(cdp, a.db_name as string, a.store_name as string, a.key as any));
        case 'browser_clear_indexed_db':       { await clearIndexedDb(cdp, a.db_name as string, a.store_name as string); return ok('IndexedDB store cleared'); }
        // Extraction
        case 'browser_get_inner_html':         return ok(await getInnerHtml(cdp, a.selector as string));
        case 'browser_get_table':              return ok(await getTableData(cdp, a.selector as string));
        case 'browser_screenshot_element':     return okImage(await screenshotElement(cdp, a.selector as string));
        // Shadow DOM
        case 'browser_query_shadow':           return ok(await queryShadow(cdp, a.host_selector as string, a.shadow_selector as string));
        case 'browser_get_shadow_html':        return ok(await getShadowHtml(cdp, a.host_selector as string));
        case 'browser_evaluate_in_shadow':     return ok(await evaluateInShadow(cdp, a.host_selector as string, a.script as string));
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
        case 'browser_get_session_storage':    return ok(await getSessionStorage(cdp, a.key as string));
        case 'browser_set_session_storage':    { await setSessionStorage(cdp, a.key as string, a.value as string); return ok('sessionStorage set'); }
        case 'browser_remove_session_storage': { await removeSessionStorage(cdp, a.key as string); return ok('sessionStorage key removed'); }
        case 'browser_get_all_session_storage':return ok(await getAllSessionStorage(cdp));
        case 'browser_clear_session_storage':  { await clearSessionStorage(cdp); return ok('sessionStorage cleared'); }
        // Element state
        case 'browser_is_enabled':             return ok({ enabled: await isEnabled(cdp, a.selector as string) });
        case 'browser_is_checked':             return ok({ checked: await isChecked(cdp, a.selector as string) });
        case 'browser_get_bounding_box':       return ok(await getBoundingBox(cdp, a.selector as string));
        case 'browser_count_elements':         return ok({ count: await countElements(cdp, a.selector as string) });
        case 'browser_get_computed_style':     return ok({ value: await getElementComputedStyle(cdp, a.selector as string, a.property as string) });
        case 'browser_get_select_options':     return ok(await getSelectOptions(cdp, a.selector as string));
        // JS errors
        case 'browser_get_js_errors':          return ok(getJsErrors(cdp));
        case 'browser_clear_js_errors':        { clearJsErrors(cdp); return ok('JS error buffer cleared'); }
        // Network capture
        case 'browser_network_log_start':      { await startNetworkLog(cdp); return ok('Network capture started'); }
        case 'browser_network_log_get':        return ok(getNetworkLog(cdp));
        case 'browser_network_log_clear':      { clearNetLog(cdp); return ok('Network capture buffer cleared'); }
        case 'browser_network_log_stop':       return ok(await stopNetworkLog(cdp));
        // Emulation
        case 'browser_set_user_agent':         { await setUserAgent(cdp, a.user_agent as string); return ok('User-Agent set'); }
        case 'browser_set_device_metrics':     { await setDeviceMetrics(cdp, { width: a.width as number, height: a.height as number, deviceScaleFactor: a.device_scale_factor as number | undefined, mobile: a.mobile as boolean | undefined }); return ok('Device metrics set'); }
        case 'browser_clear_device_metrics':   { await clearDeviceMetrics(cdp); return ok('Device metrics cleared'); }
        case 'browser_set_network_conditions': { await setNetworkConditions(cdp, { offline: a.offline as boolean | undefined, latency: a.latency as number | undefined, downloadThroughput: a.download_throughput as number | undefined, uploadThroughput: a.upload_throughput as number | undefined, connectionType: a.connection_type as string | undefined }); return ok('Network conditions set'); }
        case 'browser_clear_network_conditions':{ await clearNetworkConditions(cdp); return ok('Network conditions cleared'); }
        case 'browser_set_geolocation':        { await setGeolocation(cdp, a.latitude as number, a.longitude as number, a.accuracy as number | undefined); return ok('Geolocation set'); }
        case 'browser_clear_geolocation':      { await clearGeolocation(cdp); return ok('Geolocation cleared'); }
        case 'browser_grant_permission':       { await grantPermission(cdp, a.permission as string, a.origin as string | undefined); return ok('Permission granted'); }
        case 'browser_reset_permissions':      { await resetPermissions(cdp); return ok('Permissions reset'); }
        case 'browser_set_media_type':         { await setMediaType(cdp, a.media as string); return ok('Media type set'); }
        case 'browser_set_color_scheme':       { await setColorScheme(cdp, a.scheme as string); return ok('Color scheme set'); }
        case 'browser_set_prefers_reduced_motion': { await setPrefersReducedMotion(cdp, a.value as string); return ok('Reduced motion set'); }
        case 'browser_set_extra_headers':      { await setExtraHeaders(cdp, a.headers as Record<string, string>); return ok('Extra headers set'); }
        case 'browser_clear_extra_headers':    { await clearExtraHeaders(cdp); return ok('Extra headers cleared'); }
        // Performance
        case 'browser_get_paint_timing':       return ok(await getPaintTiming(cdp));
        case 'browser_get_navigation_timing':  return ok(await getNavigationTiming(cdp));
        case 'browser_get_resource_timings':   return ok(await getResourceTimings(cdp));
        case 'browser_clear_performance_buffer': { await clearPerformanceBuffer(cdp); return ok('Performance buffer cleared'); }
        // Network interception
        case 'browser_intercept_request': {
          const cleanup = await interceptRequest(cdp, { urlPattern: a.url_pattern as string, status: a.status as number | undefined, body: a.body as string | undefined, contentType: a.content_type as string | undefined });
          // Store cleanup in a module-level map keyed by session for later clearing
          _interceptCleanups.set(sessionId, [...(_interceptCleanups.get(sessionId) ?? []), cleanup]);
          return ok('Interception active');
        }
        case 'browser_get_response_body':      return ok(await getResponseBody(cdp, a.request_id as string));
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
        // Input type helpers
        case 'browser_set_range':              { await setRangeValue(cdp, a.selector as string, a.value as number); return ok('Range value set'); }
        case 'browser_set_date':               { await setDateValue(cdp, a.selector as string, a.value as string); return ok('Date value set'); }
        case 'browser_set_color':              { await setColorValue(cdp, a.selector as string, a.value as string); return ok('Color value set'); }
        case 'browser_set_selection_range':    { await setSelectionRange(cdp, a.selector as string, a.start as number, a.end as number); return ok('Selection range set'); }
        // Touch
        case 'browser_tap':                    { await tapAt(cdp, a.x as number, a.y as number); return ok('Tapped'); }
        case 'browser_swipe':                  { await swipeAt(cdp, a.start_x as number, a.start_y as number, a.end_x as number, a.end_y as number, a.steps as number | undefined); return ok('Swiped'); }
        case 'browser_pinch_zoom':             { await pinchZoom(cdp, a.x as number, a.y as number, a.from_distance as number, a.to_distance as number, a.steps as number | undefined); return ok('Pinch zoom applied'); }
        // WebSocket monitor
        case 'browser_websocket_start':        { await startWebSocketLog(cdp); return ok('WebSocket capture started'); }
        case 'browser_websocket_messages':     return ok(getWebSocketMessages(cdp));
        case 'browser_websocket_connections':  return ok(getWebSocketConnections(cdp));
        case 'browser_websocket_clear':        { clearWebSocketLog(cdp); return ok('WebSocket buffer cleared'); }
        case 'browser_websocket_stop':         return ok(await stopWebSocketLog(cdp));
        // CSS & JS coverage
        case 'browser_start_css_coverage':     { await startCssCoverage(cdp); return ok('CSS coverage started'); }
        case 'browser_stop_css_coverage':      return ok(await stopCssCoverage(cdp));
        case 'browser_start_js_coverage':      { await startJsCoverage(cdp); return ok('JS coverage started'); }
        case 'browser_take_js_coverage':       return ok(await takeJsCoverage(cdp));
        case 'browser_stop_js_coverage':       return ok(await stopJsCoverage(cdp));
        // Service workers
        case 'browser_list_service_workers':   return ok(await listServiceWorkers(cdp));
        case 'browser_unregister_service_worker': return ok({ unregistered: await unregisterServiceWorker(cdp, a.scope_url as string) });
        case 'browser_update_service_worker':  { await updateServiceWorker(cdp, a.scope_url as string); return ok('Service worker updated'); }
        case 'browser_is_controlled_by_sw':    return ok({ controlled: await isControlledByServiceWorker(cdp) });
        // DOM mutation observer
        case 'browser_mutation_start':         { await startMutationObserver(cdp, a.observer_id as string, a.selector as string, { childList: a.child_list as boolean | undefined, attributes: a.attributes as boolean | undefined, characterData: a.character_data as boolean | undefined, subtree: a.subtree as boolean | undefined }); return ok('Mutation observer started'); }
        case 'browser_mutation_get':           return ok(await getMutations(cdp, a.observer_id as string));
        case 'browser_mutation_clear':         { await clearMutations(cdp, a.observer_id as string); return ok('Mutation buffer cleared'); }
        case 'browser_mutation_stop':          return ok(await stopMutationObserver(cdp, a.observer_id as string));
        case 'browser_mutation_stop_all':      { await stopAllMutationObservers(cdp); return ok('All mutation observers stopped'); }
        case 'browser_wait_for_mutation':      return ok(await waitForMutation(cdp, a.observer_id as string, a.timeout_ms as number | undefined));
        // Media
        case 'browser_get_media':              return ok(await getMediaElements(cdp));
        case 'browser_play_media':             { await playMedia(cdp, a.selector as string); return ok('Playing'); }
        case 'browser_pause_media':            { await pauseMedia(cdp, a.selector as string); return ok('Paused'); }
        case 'browser_seek_media':             { await seekMedia(cdp, a.selector as string, a.time as number); return ok('Seeked'); }
        case 'browser_set_media_volume':       { await setMediaVolume(cdp, a.selector as string, a.volume as number); return ok('Volume set'); }
        case 'browser_set_media_muted':        { await setMediaMuted(cdp, a.selector as string, a.muted as boolean); return ok('Muted state set'); }
        case 'browser_set_playback_rate':      { await setPlaybackRate(cdp, a.selector as string, a.rate as number); return ok('Playback rate set'); }
        case 'browser_wait_for_media_ready':   { await waitForMediaReady(cdp, a.selector as string, a.ready_state as number | undefined, a.timeout_ms as number | undefined); return ok('Media ready'); }
        // DOM events & performance marks
        case 'browser_dispatch_event':         { await dispatchDomEvent(cdp, a.selector as string, a.event_type as string, { bubbles: a.bubbles as boolean | undefined, cancelable: a.cancelable as boolean | undefined, detail: a.detail, key: a.key as string | undefined, ctrlKey: a.ctrl_key as boolean | undefined, shiftKey: a.shift_key as boolean | undefined, altKey: a.alt_key as boolean | undefined, metaKey: a.meta_key as boolean | undefined, button: a.button as number | undefined, clientX: a.client_x as number | undefined, clientY: a.client_y as number | undefined }); return ok('Event dispatched'); }
        case 'browser_trigger_react_change':   { await triggerReactChange(cdp, a.selector as string, a.value as string); return ok('React change triggered'); }
        case 'browser_wait_for_event':         return ok(await waitForEvent(cdp, a.selector as string, a.event_type as string, a.timeout_ms as number | undefined));
        case 'browser_get_performance_marks':  return ok(await getPerformanceMarks(cdp));
        case 'browser_set_performance_mark':   { await setPerformanceMark(cdp, a.name as string); return ok('Mark set'); }
        case 'browser_measure_performance':    return ok({ durationMs: await measurePerformance(cdp, a.name as string, a.start_mark as string, a.end_mark as string) });
        // Tab state
        case 'browser_get_all_tabs':           return ok(await getAllTabSnapshots(cdp, config.debugPort));
        case 'browser_find_tabs_by_url':       return ok(await findTabsByUrl(cdp, config.debugPort, a.url_pattern as string));
        case 'browser_duplicate_tab':          return ok({ newTabId: await duplicateTab(config.debugPort, a.tab_id as string) });
        case 'browser_get_tab_info':           return ok(await getTabInfo(cdp, config.debugPort, a.tab_id as string));
        case 'browser_wait_for_tab_load':      { await waitForTabLoad(cdp, config.debugPort, a.tab_id as string, a.timeout_ms as number | undefined); return ok('Tab loaded'); }
        // Page snapshot
        case 'browser_page_snapshot':          return ok(await getPageSnapshot(cdp));
        // Page metadata
        case 'browser_get_meta_tags':          return ok(await getMetaTags(cdp));
        case 'browser_get_link_tags':          return ok(await getLinkTags(cdp));
        case 'browser_get_ready_state':        return ok({ readyState: await getReadyState(cdp) });
        case 'browser_wait_for_load':          { await waitForDOMContentLoaded(cdp, a.timeout_ms as number | undefined); return ok('Page loaded'); }
        // Evaluate helpers
        case 'browser_evaluate_on_element':    return ok(await evaluateOnElement(cdp, a.selector as string, a.script as string));
        case 'browser_get_window_globals':     return ok(await getWindowGlobals(cdp));
        // Downloads
        case 'browser_download_start':         { await startDownloadMonitor(cdp, a.download_path as string | undefined); return ok('Download monitoring started'); }
        case 'browser_download_get':           return ok(getDownloads(cdp));
        case 'browser_download_clear':         { clearDownloads(cdp); return ok('Download buffer cleared'); }
        case 'browser_download_stop':          return ok(await stopDownloadMonitor(cdp));
        case 'browser_wait_for_download':      return ok(await waitForDownload(cdp, a.url_pattern as string | undefined, a.timeout_ms as number | undefined));
        // Accessibility (extended)
        case 'browser_get_ax_subtree':         return ok(await getAxSubtree(cdp, a.selector as string));
        case 'browser_get_focused_element':    return ok(await getFocusedElement(cdp));
        case 'browser_get_interactive_ax_nodes': return ok(await getInteractiveAxNodes(cdp));
        case 'browser_get_live_regions':       return ok(await getLiveRegions(cdp));
        // Dialog
        case 'browser_wait_for_dialog':        return ok(await waitForDialog(cdp, { accept: (a.accept as boolean) ?? true, promptText: a.prompt_text as string | undefined, timeoutMs: a.timeout_ms as number | undefined }));
        case 'browser_is_dialog_open':         return ok({ open: await isDialogOpen(cdp) });
        case 'browser_dismiss_print_dialog':   { await dismissPrintDialog(cdp); return ok('Print dialog dismissed'); }
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
