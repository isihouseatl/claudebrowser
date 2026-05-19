// src/cdp/event2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * Dispatch a CustomEvent on an element matched by selector.
 * Returns 'not-found' if the selector matches nothing, 'dispatched' on success.
 */
export async function dispatchCustomEvent(
  client: CdpClient,
  selector: string,
  eventName: string,
  detail?: unknown,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
 * Check which common inline event handler properties (onclick, onchange, oninput,
 * onfocus, onblur, onkeydown, onkeyup, onsubmit) are non-null on the matched element.
 * Returns JSON: { selector, listeners: [{ event, set: true }] } for all non-null handlers.
 */
export async function getEventListenerCount(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
