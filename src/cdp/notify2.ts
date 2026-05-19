// src/cdp/notify2.ts
// Browser notification, banner, toast, and status message inspection functions.
//
// Naming notes:
//   getNotificationPermission2 — getNotificationPermission already exported from notify.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getToastMessages — Find toast/snackbar elements by class or role:
 * tag, id, class, text, isVisible (max 10).
 */
export async function getToastMessages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[class*="toast" i],[class*="snackbar" i],[class*="notification" i],[role="status"],[role="alert"]').forEach(function(el) {
    if (result.length < 10) {
      var r = el.getBoundingClientRect();
      result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: el.textContent.trim().slice(0,100), isVisible: r.width > 0 && r.height > 0 });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getBannerElements — Find banner/alert-bar elements at top of page:
 * tag, id, class, text (max 10, top < 200px only).
 */
export async function getBannerElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  var candidates = document.querySelectorAll('[class*="banner" i],[class*="alert-bar" i],[class*="notice" i],[class*="announcement" i],header[role="banner"],[role="banner"]');
  Array.from(candidates).slice(0,10).forEach(function(el) {
    var r = el.getBoundingClientRect();
    if (r.top < 200) result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: el.textContent.trim().slice(0,100) });
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getErrorMessages — Find error message elements by class/role/aria:
 * tag, id, text, ariaLive (max 20).
 */
export async function getErrorMessages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[class*="error" i],[class*="invalid" i],[role="alert"],[aria-invalid="true"],[class*="danger" i]').forEach(function(el) {
    if (result.length < 20 && el.textContent.trim()) {
      result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: el.textContent.trim().slice(0,100), ariaLive: el.getAttribute('aria-live') });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getSuccessMessages — Find success/confirmation elements:
 * tag, id, class, text (max 20).
 */
export async function getSuccessMessages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[class*="success" i],[class*="confirm" i],[class*="complete" i],[class*="done" i],[class*="valid" i]').forEach(function(el) {
    if (result.length < 20 && el.textContent.trim()) {
      result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: el.textContent.trim().slice(0,100) });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getWarningMessages — Find warning elements:
 * tag, id, class, text (max 20).
 */
export async function getWarningMessages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[class*="warn" i],[class*="caution" i],[class*="attention" i]').forEach(function(el) {
    if (result.length < 20 && el.textContent.trim()) {
      result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: el.textContent.trim().slice(0,100) });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getLoadingIndicators — Find loading/spinner elements:
 * tag, id, class, ariaLabel (max 10).
 */
export async function getLoadingIndicators(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[class*="spinner" i],[class*="loader" i],[class*="loading" i],[aria-busy="true"],[role="progressbar"]').forEach(function(el) {
    if (result.length < 10) result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), ariaLabel: el.getAttribute('aria-label') });
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getProgressBars — Find <progress> elements and role="progressbar":
 * value, max, percent, ariaValueNow (max 10).
 */
export async function getProgressBars(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('progress,[role="progressbar"]').forEach(function(el) {
    if (result.length < 10) {
      var val = el.value !== undefined ? el.value : parseFloat(el.getAttribute('aria-valuenow'));
      var max = el.max !== undefined ? el.max : parseFloat(el.getAttribute('aria-valuemax'));
      result.push({ tag: el.tagName.toLowerCase(), id: el.id, value: val, max: max || 100, percent: max ? Math.round(val/max*100) : null });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getNotificationPermission2 — Check browser Notification API permission:
 * { permission, supported }.
 * (Renamed from getNotificationPermission to avoid collision with notify.ts export.)
 */
export async function getNotificationPermission2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!('Notification' in window)) return JSON.stringify({ supported: false });
  return JSON.stringify({ supported: true, permission: Notification.permission });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
