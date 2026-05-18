// src/cdp/observer.ts
import { CdpClient } from './client';

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
