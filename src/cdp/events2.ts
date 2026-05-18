// src/cdp/events2.ts
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

/**
 * Check which inline event handler properties are non-null on the matched element.
 * Returns a JSON object with keys: onclick, onmouseenter, onmouseleave, onkeydown,
 * onkeyup, oninput, onchange, onsubmit, onfocus, onblur.
 */
export async function checkEventHandlers(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({
    onclick: el.onclick !== null && el.onclick !== undefined,
    onmouseenter: el.onmouseenter !== null && el.onmouseenter !== undefined,
    onmouseleave: el.onmouseleave !== null && el.onmouseleave !== undefined,
    onkeydown: el.onkeydown !== null && el.onkeydown !== undefined,
    onkeyup: el.onkeyup !== null && el.onkeyup !== undefined,
    oninput: el.oninput !== null && el.oninput !== undefined,
    onchange: el.onchange !== null && el.onchange !== undefined,
    onsubmit: el.onsubmit !== null && el.onsubmit !== undefined,
    onfocus: el.onfocus !== null && el.onfocus !== undefined,
    onblur: el.onblur !== null && el.onblur !== undefined,
  });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a CustomEvent on the matched element with the given name and detail.
 * detail should be a JSON string; it will be parsed before passing to CustomEvent.
 */
export async function dispatchCustomEvent(
  client: CdpClient,
  selector: string,
  eventName: string,
  detail: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const parsed = (function() {
    try { return JSON.parse(${JSON.stringify(detail)}); } catch(e) { return ${JSON.stringify(detail)}; }
  })();
  el.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}, {
    detail: parsed,
    bubbles: true,
    cancelable: true,
  }));
  return 'Event dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Trigger a MouseEvent of the given type on the matched element.
 * Supported types: click, mousedown, mouseup, mouseover, mouseout, mouseenter, mouseleave, etc.
 */
export async function triggerMouseEvent(
  client: CdpClient,
  selector: string,
  eventType: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new MouseEvent(${JSON.stringify(eventType)}, {
    bubbles: true,
    cancelable: true,
  }));
  return 'Event triggered';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Trigger a KeyboardEvent of the given type and key on the matched element.
 * Supported types: keydown, keyup, keypress.
 */
export async function triggerKeyEvent(
  client: CdpClient,
  selector: string,
  eventType: string,
  key: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new KeyboardEvent(${JSON.stringify(eventType)}, {
    key: ${JSON.stringify(key)},
    bubbles: true,
    cancelable: true,
  }));
  return 'Event triggered';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Trigger both 'input' and 'change' events on the matched element.
 * Useful for notifying frameworks (e.g. Vue, vanilla listeners) after programmatic value changes.
 */
export async function triggerInputEvent(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  return 'Events triggered';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Trigger a FocusEvent of the given type ('focus' or 'blur') on the matched element.
 */
export async function triggerFocusEvent(
  client: CdpClient,
  selector: string,
  type: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new FocusEvent(${JSON.stringify(type)}, { bubbles: true }));
  return 'Event triggered';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Wait for a DOM mutation on the matched element or its subtree using MutationObserver.
 * Resolves with "Mutation observed" or "Timeout" depending on whether a mutation fires
 * before timeoutMs elapses.
 */
export async function waitForDomMutation(
  client: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return Promise.resolve(null);
  return new Promise(function(resolve) {
    const obs = new MutationObserver(function() {
      obs.disconnect();
      resolve('Mutation observed');
    });
    obs.observe(el, { childList: true, subtree: true, attributes: true });
    setTimeout(function() {
      obs.disconnect();
      resolve('Timeout');
    }, ${timeoutMs});
  });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Get the action URL and method of a form element matched by selector.
 * Returns JSON with {action, method}. If the element is not a FORM, action will be null.
 */
export async function getFormSubmitUrl(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  if (el.tagName !== 'FORM') {
    return JSON.stringify({ action: null, method: null });
  }
  return JSON.stringify({
    action: el.action || window.location.href,
    method: (el.method || 'get').toLowerCase(),
  });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}
