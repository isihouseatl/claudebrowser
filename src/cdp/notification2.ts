// src/cdp/notification2.ts
// Notification / toast / banner / alert inspection functions.
//
// Naming notes:
//   getNotificationPermission3 — getNotificationPermission taken by notify.ts,
//                                getNotificationPermission2 taken by notify2.ts
//   getBannerElements2          — getBannerElements taken by notify2.ts

export async function getNotificationPermission3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var supported = 'Notification' in window;
  var permission = supported ? Notification.permission : null;
  return JSON.stringify({ supported: supported, permission: permission });
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getToastElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="toast"],[class*="snackbar"],[class*="notification"][class*="show"],[aria-live]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var cls = (el.getAttribute('class') || '').slice(0, 80);
    var txt = el.textContent.trim().slice(0, 80);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: cls,
      text_preview: txt,
      ariaLive: el.getAttribute('aria-live')
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getBannerElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var seen = new Set();
  var items = [];
  var sel = '[role="banner"],[class*="banner"],[class*="announcement"],header:first-of-type';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 10) return;
    if (seen.has(el)) return;
    seen.add(el);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      role: el.getAttribute('role'),
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getAlertBanners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var seen = new Set();
  var items = [];
  var sel = '[role="alert"],[role="alertdialog"],[class*="alert"],[class*="warning"],[class*="error-banner"]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      role: el.getAttribute('role'),
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getCookieBanners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="cookie"],[id*="cookie"],[class*="consent"],[id*="consent"],[class*="gdpr"]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 5) return;
    if (seen.has(el)) return;
    seen.add(el);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getAriaLiveRegions(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[aria-live]').forEach(function(el) {
    if (items.length >= 20) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      ariaLive: el.getAttribute('aria-live'),
      ariaAtomic: el.getAttribute('aria-atomic'),
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getStatusMessages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[role="status"],[role="log"]').forEach(function(el) {
    if (items.length >= 20) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      role: el.getAttribute('role'),
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getDismissButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var seen = new Set();
  var items = [];
  var sel = '[class*="close"],[class*="dismiss"],[aria-label*="close" i],[aria-label*="dismiss" i]';
  document.querySelectorAll(sel).forEach(function(el) {
    if (items.length >= 20) return;
    if (seen.has(el)) return;
    seen.add(el);
    var lbl = (el.getAttribute('aria-label') || '').slice(0, 80);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 80),
      ariaLabel_preview: lbl,
      text_preview: el.textContent.trim().slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }, null, 2) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
