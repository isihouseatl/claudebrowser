// src/cdp/events.ts
import { CdpClient } from './client';

export interface DispatchEventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  detail?: unknown;
  key?: string;
  keyCode?: number;
  which?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  button?: number;
  clientX?: number;
  clientY?: number;
}

// Dispatch a custom DOM event on an element matched by selector.
// Builds the appropriate constructor (KeyboardEvent / MouseEvent / CustomEvent / Event)
// based on eventType. All parameters are JSON-serialised for safe injection.
export async function dispatchEvent(
  client: CdpClient,
  selector: string,
  eventType: string,
  options: DispatchEventOptions = {},
): Promise<void> {
  const {
    bubbles = true,
    cancelable = true,
    detail,
    key,
    keyCode,
    which,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    button = 0,
    clientX = 0,
    clientY = 0,
  } = options;

  const selectorJson = JSON.stringify(selector);
  const eventTypeJson = JSON.stringify(eventType);
  const detailJson = JSON.stringify(detail ?? null);
  const keyJson = JSON.stringify(key ?? '');

  const expression = `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) throw new Error('Element not found: ' + ${selectorJson});

  const type = ${eventTypeJson};
  const isKeyboard = ['keydown', 'keyup', 'keypress'].includes(type.toLowerCase());
  const isMouse = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
                   'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
                   'contextmenu'].includes(type.toLowerCase());

  let ev;
  if (isKeyboard) {
    ev = new KeyboardEvent(type, {
      bubbles: ${bubbles},
      cancelable: ${cancelable},
      key: ${keyJson},
      code: ${keyJson},
      keyCode: ${keyCode ?? 0},
      which: ${which ?? keyCode ?? 0},
      ctrlKey: ${ctrlKey},
      shiftKey: ${shiftKey},
      altKey: ${altKey},
      metaKey: ${metaKey},
    });
  } else if (isMouse) {
    const buttonMap = [0, 1, 2];
    ev = new MouseEvent(type, {
      bubbles: ${bubbles},
      cancelable: ${cancelable},
      ctrlKey: ${ctrlKey},
      shiftKey: ${shiftKey},
      altKey: ${altKey},
      metaKey: ${metaKey},
      button: ${button},
      buttons: buttonMap[${button}] ?? 0,
      clientX: ${clientX},
      clientY: ${clientY},
    });
  } else if (${detailJson} !== null) {
    ev = new CustomEvent(type, {
      bubbles: ${bubbles},
      cancelable: ${cancelable},
      detail: ${detailJson},
    });
  } else {
    ev = new Event(type, {
      bubbles: ${bubbles},
      cancelable: ${cancelable},
    });
  }

  el.dispatchEvent(ev);
})()`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Trigger a React synthetic event on a controlled input or textarea by using the
// native value setter (bypasses React's internal tracking) then dispatching 'input'
// and 'change' events so React reconciles the new value.
export async function triggerReactChange(
  client: CdpClient,
  selector: string,
  value: string,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});

  const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const textareaDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  const nativeSetter = (inputDescriptor || textareaDescriptor)?.set;

  if (nativeSetter) {
    nativeSetter.call(el, ${JSON.stringify(value)});
  } else {
    el.value = ${JSON.stringify(value)};
  }

  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export interface WaitForEventResult {
  type: string;
  detail?: unknown;
  timestamp: number;
}

// Wait for a custom DOM event to fire on document, window, or a CSS-selector element.
// Injects a one-shot addEventListener that stores the result in a unique window variable,
// polls every 200 ms until the variable is populated, then cleans up.
export async function waitForEvent(
  client: CdpClient,
  selector: string | 'document' | 'window',
  eventType: string,
  timeoutMs: number = 10000,
): Promise<WaitForEventResult> {
  // Use a unique key so concurrent calls do not collide.
  const storeKey = `__cdpEventResult_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const selectorJson = JSON.stringify(selector);
  const eventTypeJson = JSON.stringify(eventType);
  const storeKeyJson = JSON.stringify(storeKey);

  // Inject the listener.
  const { exceptionDetails: injectErr } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  let target;
  const sel = ${selectorJson};
  if (sel === 'document') {
    target = document;
  } else if (sel === 'window') {
    target = window;
  } else {
    target = document.querySelector(sel);
    if (!target) throw new Error('Element not found: ' + sel);
  }

  const key = ${storeKeyJson};

  function handler(ev) {
    window[key] = {
      type: ev.type,
      detail: (ev instanceof CustomEvent) ? ev.detail : undefined,
      timestamp: Date.now(),
    };
    target.removeEventListener(${eventTypeJson}, handler);
  }

  target.addEventListener(${eventTypeJson}, handler, { once: true });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (injectErr) {
    throw new Error(`JS error (inject): ${injectErr.exception?.description ?? injectErr.text}`);
  }

  // Poll until the window variable is set or we time out.
  const pollIntervalMs = 200;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, pollIntervalMs));

    const { result, exceptionDetails: pollErr } = await client.raw.Runtime.evaluate({
      expression: `window[${JSON.stringify(storeKey)}] !== undefined
        ? JSON.stringify(window[${JSON.stringify(storeKey)}])
        : null`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (pollErr) {
      throw new Error(`JS error (poll): ${pollErr.exception?.description ?? pollErr.text}`);
    }

    if (result.value !== null && result.value !== undefined) {
      // Clean up the window variable.
      await client.raw.Runtime.evaluate({
        expression: `delete window[${JSON.stringify(storeKey)}]`,
        returnByValue: true,
      });
      return JSON.parse(result.value as string) as WaitForEventResult;
    }
  }

  // Clean up the stale window variable and listener key on timeout.
  await client.raw.Runtime.evaluate({
    expression: `delete window[${JSON.stringify(storeKey)}]`,
    returnByValue: true,
  });
  throw new Error(`waitForEvent: timed out after ${timeoutMs}ms waiting for '${eventType}' on '${selector}'`);
}

// Return all performance.mark() entries currently in the page's performance timeline.
export async function getPerformanceMarks(
  client: CdpClient,
): Promise<Array<{ name: string; startTime: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(
  performance.getEntriesByType('mark').map(e => ({ name: e.name, startTime: e.startTime }))
)`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as Array<{ name: string; startTime: number }>;
}

// Set a performance mark in the page via performance.mark().
export async function setPerformanceMark(client: CdpClient, name: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `performance.mark(${JSON.stringify(name)})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Call performance.measure() between two existing marks and return the duration in milliseconds.
// Stores the measure under the given name; cleans up the measure entry afterward.
export async function measurePerformance(
  client: CdpClient,
  name: string,
  startMark: string,
  endMark: string,
): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  performance.measure(${JSON.stringify(name)}, ${JSON.stringify(startMark)}, ${JSON.stringify(endMark)});
  const entries = performance.getEntriesByName(${JSON.stringify(name)}, 'measure');
  const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0;
  performance.clearMeasures(${JSON.stringify(name)});
  return duration;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}
