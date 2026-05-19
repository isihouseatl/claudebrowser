// src/cdp/observer.ts
import type { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Return helpers
// ---------------------------------------------------------------------------

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---------------------------------------------------------------------------
// waitForElementAdded
// ---------------------------------------------------------------------------

/**
 * Wait for an element matching selector to appear in DOM using MutationObserver.
 * Resolves with "Element found" or "Timeout".
 */
export async function waitForElementAdded(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise((resolve) => {
  if (document.querySelector(${selectorJson})) {
    resolve('Element found');
    return;
  }
  var obs = new MutationObserver(function() {
    if (document.querySelector(${selectorJson})) {
      obs.disconnect();
      resolve('Element found');
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(function() {
    obs.disconnect();
    resolve('Timeout');
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// waitForElementRemoved
// ---------------------------------------------------------------------------

/**
 * Wait for element to be removed from DOM using MutationObserver.
 * Resolves with "Element removed" or "Timeout".
 */
export async function waitForElementRemoved(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise((resolve) => {
  if (!document.querySelector(${selectorJson})) {
    resolve('Element removed');
    return;
  }
  var obs = new MutationObserver(function() {
    if (!document.querySelector(${selectorJson})) {
      obs.disconnect();
      resolve('Element removed');
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(function() {
    obs.disconnect();
    resolve('Timeout');
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// waitForTextChange
// ---------------------------------------------------------------------------

/**
 * Wait for textContent to change on element. Resolves with "Text changed" or "Timeout".
 */
export async function waitForTextChange(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise((resolve) => {
  var el = document.querySelector(${selectorJson});
  if (!el) { resolve('Element not found'); return; }
  var initialText = el.textContent;
  var obs = new MutationObserver(function() {
    var current = document.querySelector(${selectorJson});
    if (current && current.textContent !== initialText) {
      obs.disconnect();
      resolve('Text changed');
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  setTimeout(function() {
    obs.disconnect();
    resolve('Timeout');
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// waitForClassChange
// ---------------------------------------------------------------------------

/**
 * Wait for className to change on element. Resolves with "Class changed" or "Timeout".
 */
export async function waitForClassChange(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise((resolve) => {
  var el = document.querySelector(${selectorJson});
  if (!el) { resolve('Element not found'); return; }
  var initialClass = el.className;
  var obs = new MutationObserver(function() {
    var current = document.querySelector(${selectorJson});
    if (current && current.className !== initialClass) {
      obs.disconnect();
      resolve('Class changed');
    }
  });
  obs.observe(el, { attributes: true, attributeFilter: ['class'] });
  setTimeout(function() {
    obs.disconnect();
    resolve('Timeout');
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getIntersectionRatio
// ---------------------------------------------------------------------------

interface IntersectionResult {
  ratio: number;
  inViewport: boolean;
}

/**
 * Get how much of element is in viewport (0-1 ratio). Calculated via getBoundingClientRect.
 */
export async function getIntersectionRatio(
  client: CdpClient,
  selector: string,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `(function() {
  var el = document.querySelector(${selectorJson});
  if (!el) return null;
  var r = el.getBoundingClientRect();
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var iw = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
  var ih = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  var area = r.width * r.height;
  var visibleArea = iw * ih;
  var ratio = area > 0 ? visibleArea / area : 0;
  return { ratio: ratio, inViewport: ratio > 0 };
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    if (result.value === null || result.value === undefined) {
      return err(`Element not found: ${selector}`);
    }
    const info = result.value as IntersectionResult;
    return ok(JSON.stringify(info));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// waitForValueChange
// ---------------------------------------------------------------------------

/**
 * Wait for input value to change via MutationObserver and 'input' event listener.
 * Resolves with "Value changed" or "Timeout".
 */
export async function waitForValueChange(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise((resolve) => {
  var el = document.querySelector(${selectorJson});
  if (!el) { resolve('Element not found'); return; }
  var initialValue = el.value !== undefined ? String(el.value) : el.textContent;
  var resolved = false;
  function onChanged() {
    if (resolved) return;
    var current = el.value !== undefined ? String(el.value) : el.textContent;
    if (current !== initialValue) {
      resolved = true;
      obs.disconnect();
      el.removeEventListener('input', onChanged);
      resolve('Value changed');
    }
  }
  var obs = new MutationObserver(onChanged);
  obs.observe(el, { attributes: true, childList: true, subtree: true, characterData: true });
  el.addEventListener('input', onChanged);
  setTimeout(function() {
    if (!resolved) {
      resolved = true;
      obs.disconnect();
      el.removeEventListener('input', onChanged);
      resolve('Timeout');
    }
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getResizeInfo
// ---------------------------------------------------------------------------

interface ResizeInfo {
  width: number;
  height: number;
  scrollWidth: number;
  scrollHeight: number;
  offsetWidth: number;
  offsetHeight: number;
}

/**
 * Get current size info for element: clientWidth/Height, scrollWidth/Height, offsetWidth/Height.
 */
export async function getResizeInfo(
  client: CdpClient,
  selector: string,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const expression = `(function() {
  var el = document.querySelector(${selectorJson});
  if (!el) return null;
  return {
    width: el.clientWidth,
    height: el.clientHeight,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
    offsetWidth: el.offsetWidth,
    offsetHeight: el.offsetHeight
  };
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    if (result.value === null || result.value === undefined) {
      return err(`Element not found: ${selector}`);
    }
    const info = result.value as ResizeInfo;
    return ok(JSON.stringify(info));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// waitForAttributeChange
// ---------------------------------------------------------------------------

/**
 * Wait for a specific attribute to change on element using MutationObserver.
 * Resolves with "Attribute changed" or "Timeout".
 */
export async function waitForAttributeChange(
  client: CdpClient,
  selector: string,
  attributeName: string,
  timeoutMs: number,
): Promise<ReturnType<typeof ok>> {
  const selectorJson = JSON.stringify(selector);
  const attributeJson = JSON.stringify(attributeName);
  const expression = `new Promise((resolve) => {
  var el = document.querySelector(${selectorJson});
  if (!el) { resolve('Element not found'); return; }
  var obs = new MutationObserver(function() {
    obs.disconnect();
    resolve('Attribute changed');
  });
  obs.observe(el, { attributes: true, attributeFilter: [${attributeJson}] });
  setTimeout(function() {
    obs.disconnect();
    resolve('Timeout');
  }, ${timeoutMs});
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// Return-type helpers for new functions
// ---------------------------------------------------------------------------

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok2(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err2(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ---------------------------------------------------------------------------
// 1. injectMutationMonitor
// ---------------------------------------------------------------------------

/**
 * Inject a MutationObserver on document.body that records DOM changes to
 * window.__mutationLog (array, max 50 entries).
 */
export async function injectMutationMonitor(client: CdpClient): Promise<ToolResult> {
  const expression = `(function() {
  if (window.__mutationObserver) {
    window.__mutationObserver.disconnect();
  }
  window.__mutationLog = [];
  window.__mutationObserver = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      var entry = {
        type: m.type,
        targetTag: m.target ? m.target.nodeName : null,
        targetId: (m.target && m.target.id) ? m.target.id : null,
        addedNodes: m.addedNodes ? m.addedNodes.length : 0,
        removedNodes: m.removedNodes ? m.removedNodes.length : 0,
        attributeName: m.attributeName || null
      };
      window.__mutationLog.push(entry);
      if (window.__mutationLog.length > 50) {
        window.__mutationLog.shift();
      }
    }
  });
  window.__mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: false
  });
  return 'MutationObserver injected';
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. getMutationLog
// ---------------------------------------------------------------------------

/**
 * Get all recorded mutations from window.__mutationLog (max 50).
 * Each entry: type, targetTag, targetId, addedNodes, removedNodes, attributeName.
 */
export async function getMutationLog(client: CdpClient): Promise<ToolResult> {
  const expression = `(function() {
  if (!window.__mutationLog) return [];
  return window.__mutationLog.slice();
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. clearMutationLog
// ---------------------------------------------------------------------------

/**
 * Clear window.__mutationLog (observer keeps running).
 */
export async function clearMutationLog(client: CdpClient): Promise<ToolResult> {
  const expression = `(function() {
  window.__mutationLog = [];
  return 'cleared';
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. waitForMutation2  (waitForMutation conflicts with cdp/mutation.ts in server.ts)
// ---------------------------------------------------------------------------

/**
 * Poll window.__mutationLog until at least 1 new entry appears.
 * Returns { found: boolean, count: number }.
 */
export async function waitForMutation2(
  client: CdpClient,
  timeoutMs: number = 3000,
): Promise<ToolResult> {
  let initialCount = 0;
  try {
    const { result: r0, exceptionDetails: ex0 } = await client.raw.Runtime.evaluate({
      expression: `(window.__mutationLog ? window.__mutationLog.length : 0)`,
      returnByValue: true,
    });
    if (ex0) return err2(ex0.exception?.description ?? ex0.text);
    initialCount = (r0.value as number) ?? 0;
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    try {
      const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
        expression: `(window.__mutationLog ? window.__mutationLog.length : 0)`,
        returnByValue: true,
      });
      if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
      const currentCount = (result.value as number) ?? 0;
      if (currentCount > initialCount) {
        return ok2({ found: true, count: currentCount });
      }
    } catch (e) {
      return err2(e instanceof Error ? e.message : String(e));
    }
  }

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(window.__mutationLog ? window.__mutationLog.length : 0)`,
      returnByValue: true,
    });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2({ found: false, count: (result.value as number) ?? 0 });
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. injectIntersectionMonitor
// ---------------------------------------------------------------------------

/**
 * Inject IntersectionObserver on all elements matching selector.
 * Records visibility changes to window.__intersectionLog.
 */
export async function injectIntersectionMonitor(
  client: CdpClient,
  selector: string,
): Promise<ToolResult> {
  const selectorJson = JSON.stringify(selector);
  const expression = `(function() {
  if (window.__intersectionObserver) {
    window.__intersectionObserver.disconnect();
  }
  window.__intersectionLog = window.__intersectionLog || [];
  var elements = Array.prototype.slice.call(document.querySelectorAll(${selectorJson}));
  if (elements.length === 0) return 'No elements matched selector: ' + ${selectorJson};
  window.__intersectionObserver = new IntersectionObserver(function(entries) {
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      window.__intersectionLog.push({
        selector: ${selectorJson},
        isIntersecting: e.isIntersecting,
        ratio: e.intersectionRatio,
        time: e.time
      });
    }
  }, { threshold: [0, 0.25, 0.5, 0.75, 1.0] });
  for (var j = 0; j < elements.length; j++) {
    window.__intersectionObserver.observe(elements[j]);
  }
  return 'IntersectionObserver injected on ' + elements.length + ' element(s)';
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. getIntersectionLog
// ---------------------------------------------------------------------------

/**
 * Get all intersection visibility log entries: selector, isIntersecting, ratio.
 */
export async function getIntersectionLog(client: CdpClient): Promise<ToolResult> {
  const expression = `(function() {
  if (!window.__intersectionLog) return [];
  return window.__intersectionLog.slice();
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. clearIntersectionLog
// ---------------------------------------------------------------------------

/**
 * Clear window.__intersectionLog (observer keeps running).
 */
export async function clearIntersectionLog(client: CdpClient): Promise<ToolResult> {
  const expression = `(function() {
  window.__intersectionLog = [];
  return 'cleared';
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 8. isElementVisible
// ---------------------------------------------------------------------------

/**
 * Use IntersectionObserver with threshold 0 to check if element matching
 * selector is currently intersecting the viewport.
 * Returns { visible: boolean, ratio: number, selector: string }.
 */
export async function isElementVisible(
  client: CdpClient,
  selector: string,
): Promise<ToolResult> {
  const selectorJson = JSON.stringify(selector);
  const expression = `new Promise(function(resolve) {
  var el = document.querySelector(${selectorJson});
  if (!el) { resolve({ visible: false, selector: ${selectorJson}, error: 'element not found' }); return; }
  var obs = new IntersectionObserver(function(entries) {
    obs.disconnect();
    resolve({ visible: entries[0].isIntersecting, ratio: entries[0].intersectionRatio, selector: ${selectorJson} });
  }, { threshold: 0 });
  obs.observe(el);
})`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) return err2(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return ok2(result.value);
  } catch (e) {
    return err2(e instanceof Error ? e.message : String(e));
  }
}
