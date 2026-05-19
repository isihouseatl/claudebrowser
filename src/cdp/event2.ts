// src/cdp/event2.ts
import { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpContent {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

/**
 * Inject an addEventListener patch that records events to window.__eventLog = [].
 * Each entry: { type, target_tag, target_id, timestamp }.
 * Max 100 entries, circular buffer (oldest dropped when full).
 * Returns { injected: boolean }.
 */
export async function injectEventMonitor(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  if (window.__eventMonitorInjected) return JSON.stringify({ injected: true });
  window.__eventLog = [];
  var _orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    var self = this;
    var wrapped = function(ev) {
      var entry = {
        type: ev.type,
        target_tag: (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : 'unknown',
        target_id: (ev.target && ev.target.id) ? ev.target.id : '',
        timestamp: Date.now()
      };
      if (window.__eventLog.length >= 100) {
        window.__eventLog.shift();
      }
      window.__eventLog.push(entry);
      if (typeof listener === 'function') {
        listener.call(self, ev);
      } else if (listener && typeof listener.handleEvent === 'function') {
        listener.handleEvent(ev);
      }
    };
    _orig.call(this, type, wrapped, options);
  };
  window.__eventMonitorInjected = true;
  return JSON.stringify({ injected: true });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Return window.__eventLog contents.
 * Returns { events: [], count: 0, message: 'not injected' } if not injected.
 */
export async function getEventLog(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  if (!window.__eventMonitorInjected || !window.__eventLog) {
    return JSON.stringify({ events: [], count: 0, message: 'not injected' });
  }
  return JSON.stringify({ events: window.__eventLog, count: window.__eventLog.length });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Clear window.__eventLog = [].
 * Returns { cleared: true }.
 */
export async function clearEventLog(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  window.__eventLog = [];
  return JSON.stringify({ cleared: true });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Find elements with onclick attribute or window.__clickListeners (from patch).
 * Uses getEventListeners if available (Chrome DevTools).
 * Returns { elements: [{tag, id, hasOnclick}], count }. Max 20.
 */
export async function getClickListeners(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  var results = [];
  var all = document.querySelectorAll('[onclick]');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      hasOnclick: true
    });
  }
  return JSON.stringify({ elements: results, count: results.length });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Find elements with onkeydown, onkeyup, onkeypress attributes.
 * Also check document and window.
 * Returns { elements: [{tag, id, events}], count }. Max 20.
 */
export async function getKeyboardListeners(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  var results = [];
  var attrs = ['onkeydown', 'onkeyup', 'onkeypress'];
  var selector = attrs.map(function(a) { return '[' + a + ']'; }).join(',');
  var all = document.querySelectorAll(selector);
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var evs = attrs.filter(function(a) { return el.hasAttribute(a); });
    results.push({ tag: el.tagName.toLowerCase(), id: el.id || '', events: evs });
  }
  var docEvents = attrs.filter(function(a) { return document[a] !== null && document[a] !== undefined; });
  if (docEvents.length > 0 && results.length < 20) {
    results.push({ tag: 'document', id: '', events: docEvents });
  }
  var winEvents = attrs.filter(function(a) { return window[a] !== null && window[a] !== undefined; });
  if (winEvents.length > 0 && results.length < 20) {
    results.push({ tag: 'window', id: '', events: winEvents });
  }
  return JSON.stringify({ elements: results, count: results.length });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Find elements with onscroll attribute. Check document and window too.
 * Returns { elements: [{tag, id}], hasWindowListener, hasDocumentListener }.
 */
export async function getScrollListeners(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  var results = [];
  var all = document.querySelectorAll('[onscroll]');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    results.push({ tag: el.tagName.toLowerCase(), id: el.id || '' });
  }
  var hasWindowListener = window.onscroll !== null && window.onscroll !== undefined;
  var hasDocumentListener = document.onscroll !== null && document.onscroll !== undefined;
  return JSON.stringify({
    elements: results,
    hasWindowListener: hasWindowListener,
    hasDocumentListener: hasDocumentListener
  });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Find <form> elements with onsubmit attribute.
 * Returns { forms: [{id, action, hasOnsubmit}], count }. Max 10.
 */
export async function getSubmitListeners(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  var forms = document.querySelectorAll('form');
  var results = [];
  for (var i = 0; i < forms.length && results.length < 10; i++) {
    var f = forms[i];
    results.push({
      id: f.id || '',
      action: f.getAttribute('action') || '',
      hasOnsubmit: f.hasAttribute('onsubmit')
    });
  }
  return JSON.stringify({ forms: results, count: results.length });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

/**
 * Check if window.onresize is set and window.__resizeListeners (from patch).
 * Returns { hasWindowOnresize, listenerCount }.
 */
export async function getResizeListeners(client: CdpClient): Promise<McpContent> {
  const expression = `(function() {
  var hasWindowOnresize = window.onresize !== null && window.onresize !== undefined;
  var listenerCount = (Array.isArray(window.__resizeListeners)) ? window.__resizeListeners.length : 0;
  return JSON.stringify({ hasWindowOnresize: hasWindowOnresize, listenerCount: listenerCount });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(JSON.parse(result.value as string));
}

// ---------------------------------------------------------------------------
// Legacy exports retained for server.ts compatibility
// ---------------------------------------------------------------------------

/**
 * Dispatch a CustomEvent on an element matched by selector.
 * Returns 'not-found' if the selector matches nothing, 'dispatched' on success.
 */
export async function dispatchCustomEvent(
  client: CdpClient,
  selector: string,
  eventName: string,
  detail?: unknown,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}, { bubbles: true, cancelable: true, detail: ${JSON.stringify(detail ?? null)} }));
  return 'dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Dispatch a CustomEvent on window with the given event name.
 * Always returns 'dispatched'.
 */
export async function dispatchWindowEvent(
  client: CdpClient,
  eventName: string,
): Promise<McpContent> {
  const expression = `(function() {
  window.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}, { bubbles: false }));
  return 'dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Check which common inline event handler properties are non-null on the matched element.
 * Returns JSON: { selector, listeners: [{ event, set: true }] } for all non-null handlers.
 */
export async function getEventListenerCount(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var props = ['onclick', 'onchange', 'oninput', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onsubmit'];
  var listeners = [];
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (el[p] !== null && el[p] !== undefined) {
      listeners.push({ event: p, set: true });
    }
  }
  return JSON.stringify({ selector: ${JSON.stringify(selector)}, listeners: listeners });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value);
}

/**
 * Dispatch an 'input' event (bubbles: true) on the element matched by selector.
 */
export async function triggerInputEvent(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return 'Input event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Dispatch a 'change' event (bubbles: true) on the element matched by selector.
 */
export async function triggerChangeEvent(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'Change event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Dispatch a 'focus' event on the element matched by selector, then call el.focus().
 */
export async function triggerFocusEvent(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new Event('focus', { bubbles: true }));
  el.focus();
  return 'Focus event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Dispatch a 'blur' event on the element matched by selector, then call el.blur().
 */
export async function triggerBlurEvent(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  el.blur();
  return 'Blur event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}

/**
 * Dispatch a 'submit' event (bubbles: true, cancelable: true) on a form element
 * matched by selector.
 */
export async function triggerSubmitEvent(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'not-found';
  el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'Submit event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value);
}
