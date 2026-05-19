// src/cdp/notification2.ts
// Browser notifications and in-page notification UI inspection.
//
// Naming notes (suffixes applied to avoid server.ts conflicts):
//   getNotificationPermission5 — 1 taken by notify.ts, 2 by notify2.ts,
//                                 3 by this file (prev version), 4 by notification3.ts
//   getAlertElements3           — 1 taken by dialog2.ts, 2 by error2.ts
//   getToastMessages3           — 1 taken by notify2.ts, 2 by error2.ts
//   All others (getNotificationBanners, getNotificationState, getSnackbarElements,
//   getBadgeNotifications, getNotificationApiUsage) are unused elsewhere.

export async function getNotificationPermission5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var supported = 'Notification' in window;
  var permission = supported ? Notification.permission : null;
  return JSON.stringify({ supported: supported, permission: permission });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getNotificationBanners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var seen = new Set();
  var items = [];
  var sel = '[role="status"],[role="alert"],[class*="banner"],[class*="announcement"],[class*="notification-bar"]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      role: el.getAttribute('role'),
      ariaLive: el.getAttribute('aria-live'),
      text_preview: el.textContent.trim().slice(0, 100)
    });
  });
  return JSON.stringify(items);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getAlertElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var seen = new Set();
  var items = [];
  document.querySelectorAll('[role="alert"],[aria-live="assertive"]').forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var rect = el.getBoundingClientRect();
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      role: el.getAttribute('role'),
      ariaLive: el.getAttribute('aria-live'),
      visible: rect.width > 0 && rect.height > 0,
      text_preview: el.textContent.trim().slice(0, 100)
    });
  });
  return JSON.stringify(items);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getToastMessages3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="toast"],[class*="snackbar"],[data-toast],[data-type="toast"],[class*="notification"][class*="show"]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var rect = el.getBoundingClientRect();
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      dataToast: el.getAttribute('data-toast'),
      visible: rect.width > 0 && rect.height > 0,
      text_preview: el.textContent.trim().slice(0, 100)
    });
  });
  return JSON.stringify(items);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getNotificationState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var permission = ('Notification' in window) ? Notification.permission : 'unsupported';
  var hasToasts = document.querySelectorAll('[class*="toast"],[class*="snackbar"],[data-toast]').length > 0;
  var hasBanners = document.querySelectorAll('[role="status"],[class*="banner"],[class*="announcement"]').length > 0;
  var hasAlerts = document.querySelectorAll('[role="alert"],[aria-live="assertive"]').length > 0;
  var badgeSel = '[class*="badge"],[class*="dot"],[class*="indicator"],[class*="count"]';
  var badgeEls = document.querySelectorAll(badgeSel);
  var hasNotificationDot = false;
  badgeEls.forEach(function(el) {
    var txt = el.textContent.trim();
    if (txt && /^[0-9]+\+?$/.test(txt)) hasNotificationDot = true;
  });
  return JSON.stringify({ permission: permission, hasToasts: hasToasts, hasBanners: hasBanners, hasAlerts: hasAlerts, hasNotificationDot: hasNotificationDot });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSnackbarElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="snackbar"],[class*="notification"][role],[data-toast],[class*="notistack"],[class*="react-toast"]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var rect = el.getBoundingClientRect();
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      role: el.getAttribute('role'),
      ariaLive: el.getAttribute('aria-live'),
      visible: rect.width > 0 && rect.height > 0,
      text_preview: el.textContent.trim().slice(0, 100)
    });
  });
  return JSON.stringify(items);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getBadgeNotifications(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="badge"],[class*="notification-dot"],[class*="unread-count"],[class*="indicator"],[aria-label*="notification" i]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var rect = el.getBoundingClientRect();
    var txt = el.textContent.trim();
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      ariaLabel: el.getAttribute('aria-label'),
      count_text: txt.slice(0, 20),
      is_numeric: /^[0-9]+\+?$/.test(txt),
      visible: rect.width > 0 && rect.height > 0
    });
  });
  return JSON.stringify(items);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getNotificationApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var hasWebNotification = 'Notification' in window;
  var hasPushApi = 'PushManager' in window;
  var hasServiceWorker = 'serviceWorker' in navigator;
  var scripts = Array.from(document.querySelectorAll('script[src]')).map(function(s) { return s.getAttribute('src') || ''; });
  var scriptText = scripts.join(' ').toLowerCase();
  var inlineText = Array.from(document.querySelectorAll('script:not([src])')).map(function(s) { return s.textContent || ''; }).join(' ').toLowerCase();
  var allText = scriptText + ' ' + inlineText;
  var hasToastLib = /toastify|react-hot-toast|notistack|sonner|notyf|izitoast|sweetalert|swal/.test(allText);
  var hasPushApi = 'PushManager' in window || /pushmanager|push\.subscribe/.test(allText);
  var hasInPageAlerts = document.querySelectorAll('[role="alert"],[aria-live]').length > 0;
  return JSON.stringify({
    hasWebNotification: hasWebNotification,
    hasToastLib: hasToastLib,
    hasPushApi: hasPushApi,
    hasServiceWorker: hasServiceWorker,
    hasInPageAlerts: hasInPageAlerts
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
