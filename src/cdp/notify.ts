// src/cdp/notify.ts
import type { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface WaitForToastOptions {
  selector?: string;
  timeoutMs?: number;
}

export interface ToastInfo {
  text: string;
  selector: string;
  ariaRole?: string;
}

export interface BrowserNotification {
  title: string;
  body?: string;
  icon?: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const TOAST_SELECTORS = [
  '[role=alert]',
  '[role=status]',
  '.toast',
  '.snackbar',
  '.notification',
  '.alert',
  '[aria-live]',
];

// ---------------------------------------------------------------------------
// Internal polling primitive
// ---------------------------------------------------------------------------

async function poll<T>(
  fn: () => Promise<T | null | false | undefined>,
  timeoutMs: number,
  intervalMs: number = 200,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (result !== null && result !== undefined && result !== false) return result as T;
    await new Promise<void>(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// waitForToast
// ---------------------------------------------------------------------------

/**
 * Wait for a toast/snackbar/notification element to appear in the DOM.
 * Tries common toast selectors in order unless a custom selector is provided.
 * Polls every 200ms up to timeoutMs (default 10000ms).
 * Returns { text, selector, ariaRole } once an element is found.
 */
export async function waitForToast(
  client: CdpClient,
  options?: WaitForToastOptions,
): Promise<ToastInfo> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const selectorsToTry = options?.selector ? [options.selector] : TOAST_SELECTORS;
  const selectorsJson = JSON.stringify(selectorsToTry);

  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const selectors = ${selectorsJson};
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el.textContent || '').trim();
      const ariaRole = el.getAttribute('role') || undefined;
      return { text, selector: sel, ariaRole };
    }
  }
  return null;
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    return (result.value as ToastInfo | null) ?? null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// getToasts
// ---------------------------------------------------------------------------

/**
 * Return all currently visible toast/alert elements matching common selectors.
 * Deduplicates by text content.
 */
export async function getToasts(client: CdpClient): Promise<ToastInfo[]> {
  const selectorsJson = JSON.stringify(TOAST_SELECTORS);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const selectors = ${selectorsJson};
  const seen = new Set();
  const results = [];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = (el.textContent || '').trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        const ariaRole = el.getAttribute('role') || undefined;
        results.push({ text, selector: sel, ariaRole });
      }
    }
  }
  return results;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return (result.value as ToastInfo[]) ?? [];
}

// ---------------------------------------------------------------------------
// waitForToastContaining
// ---------------------------------------------------------------------------

/**
 * Wait for a toast whose text contains the given string (case-insensitive).
 * Polls every 200ms using Runtime.evaluate. Rejects after timeoutMs (default 10000ms).
 */
export async function waitForToastContaining(
  client: CdpClient,
  text: string,
  timeoutMs: number = 10000,
): Promise<ToastInfo> {
  const selectorsJson = JSON.stringify(TOAST_SELECTORS);
  const textJson = JSON.stringify(text.toLowerCase());

  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const selectors = ${selectorsJson};
  const needle = ${textJson};
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = (el.textContent || '').trim();
      if (text.toLowerCase().includes(needle)) {
        const ariaRole = el.getAttribute('role') || undefined;
        return { text, selector: sel, ariaRole };
      }
    }
  }
  return null;
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    return (result.value as ToastInfo | null) ?? null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// dismissToast
// ---------------------------------------------------------------------------

/**
 * Try to dismiss a visible toast/alert by clicking its close button.
 * Looks inside the toast for: [aria-label*=close], [aria-label*=dismiss], .close, button.
 * If a custom selector is provided, searches within that element; otherwise tries all common toast selectors.
 * Returns true if a close button was found and clicked, false otherwise.
 */
export async function dismissToast(
  client: CdpClient,
  selector?: string,
): Promise<boolean> {
  const containerSelectorsJson = selector
    ? JSON.stringify([selector])
    : JSON.stringify(TOAST_SELECTORS);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const containerSelectors = ${containerSelectorsJson};
  const closeSelectors = [
    '[aria-label*=close]',
    '[aria-label*=dismiss]',
    '[aria-label*=Close]',
    '[aria-label*=Dismiss]',
    '.close',
    'button',
  ];
  for (const contSel of containerSelectors) {
    const container = document.querySelector(contSel);
    if (!container) continue;
    for (const closeSel of closeSelectors) {
      const btn = container.querySelector(closeSel);
      if (btn) {
        btn.click();
        return true;
      }
    }
  }
  return false;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return (result.value as boolean) === true;
}

// ---------------------------------------------------------------------------
// interceptBrowserNotification
// ---------------------------------------------------------------------------

/**
 * Override the Notification constructor in the page to capture notification
 * requests instead of showing them. Captured entries are stored in
 * window.__cbNotifications = []. Each entry: { title, body, icon, timestamp }.
 */
export async function interceptBrowserNotification(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  window.__cbNotifications = window.__cbNotifications || [];
  window.Notification = function(title, options) {
    window.__cbNotifications.push({
      title: title,
      body: options && options.body !== undefined ? options.body : undefined,
      icon: options && options.icon !== undefined ? options.icon : undefined,
      timestamp: Date.now(),
    });
  };
  window.Notification.permission = 'granted';
  window.Notification.requestPermission = function() { return Promise.resolve('granted'); };
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// ---------------------------------------------------------------------------
// getCapturedNotifications
// ---------------------------------------------------------------------------

/**
 * Return all notifications captured by interceptBrowserNotification.
 * Returns window.__cbNotifications ?? [].
 */
export async function getCapturedNotifications(
  client: CdpClient,
): Promise<BrowserNotification[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return JSON.stringify(window.__cbNotifications || []);
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  try {
    return JSON.parse(result.value as string) as BrowserNotification[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// clearCapturedNotifications
// ---------------------------------------------------------------------------

/**
 * Clear the captured notification buffer (window.__cbNotifications = []).
 */
export async function clearCapturedNotifications(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => { window.__cbNotifications = []; })()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// ---------------------------------------------------------------------------
// waitForBannerChange
// ---------------------------------------------------------------------------

/**
 * Wait until the text content of a status banner/element changes from its current value.
 * Captures the current text, then polls until it differs.
 * Returns the new text content.
 * timeoutMs defaults to 10000ms.
 */
export async function waitForBannerChange(
  client: CdpClient,
  selector: string,
  timeoutMs: number = 10000,
): Promise<string> {
  const selectorJson = JSON.stringify(selector);

  // Capture the current text content
  const { result: initialResult, exceptionDetails: initEx } =
    await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) return null;
  return el.textContent || '';
})()`,
      returnByValue: true,
    });

  if (initEx) {
    throw new Error(
      `JS error: ${initEx.exception?.description ?? initEx.text}`,
    );
  }

  const initialText = initialResult.value as string | null;

  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) return null;
  return el.textContent || '';
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    const current = result.value as string | null;
    if (current === null) return null;
    if (current !== initialText) return current;
    return null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// Web Notifications and Page Visibility API tools
// ---------------------------------------------------------------------------

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// Returns the current Web Notification permission state for the page.
// Result: { permission: 'granted' | 'denied' | 'default' }
export async function getNotificationPermission(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ permission: Notification.permission })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns whether the Web Notifications API is supported in the current page context.
// Result: { supported: true | false }
export async function isNotificationSupported(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ supported: typeof Notification !== 'undefined' })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the Page Visibility API visibilityState for the current document.
// Result: { visibilityState: 'visible' | 'hidden' | 'prerender' }
export async function getPageVisibility(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ visibilityState: document.visibilityState })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns whether the page is currently visible (document.hidden === false).
// Result: { visible: true | false }
export async function isPageVisible(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ visible: !document.hidden })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the document's current ready state.
// Result: { readyState: 'loading' | 'interactive' | 'complete' }
export async function getDocumentReadyState(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ readyState: document.readyState })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the character set (encoding) of the current document.
// Result: { charset: string }
export async function getPageCharset(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ charset: document.characterSet || document.charset })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the document compatibility mode.
// CSS1Compat = standards mode, BackCompat = quirks mode.
// Result: { compatMode: string }
export async function getDocumentMode(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ compatMode: typeof document.compatMode !== 'undefined' ? document.compatMode : 'unknown' })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the date and time the document was last modified, as reported by the server.
// Result: { lastModified: string }
export async function getLastModified(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ lastModified: document.lastModified })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}
