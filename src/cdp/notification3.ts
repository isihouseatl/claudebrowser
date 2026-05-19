import type CRI from 'chrome-remote-interface';

// src/cdp/notification3.ts
// Browser push / Web Notifications / badge inspection functions.
//
// Naming notes:
//   getNotificationPermission4 — getNotificationPermission taken by notify.ts,
//                                 getNotificationPermission2 taken by notify2.ts,
//                                 getNotificationPermission3 taken by notification2.ts

export async function getNotificationPermission4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var permission = ('Notification' in window) ? Notification.permission : 'unsupported';
    var canRequest = permission === 'default';
    return { permission: permission, canRequest: canRequest };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNotificationElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var seen = new Set();
    var items = [];
    var sel = [
      '[class*="notif"]',
      '[class*="notification"]',
      '[id*="notif"]',
      '[id*="notification"]',
      '[aria-label*="notification" i]',
      '[data-testid*="notif" i]'
    ].join(',');
    document.querySelectorAll(sel).forEach(function(el) {
      if (items.length >= 20) return;
      if (seen.has(el)) return;
      seen.add(el);
      items.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.getAttribute('class') || '').slice(0, 80),
        text_preview: el.textContent.trim().slice(0, 80)
      });
    });
    return items;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getPushSubscription(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    if (!('serviceWorker' in navigator)) {
      return { hasSubscription: false, endpoint_preview: null, isActive: false, error: 'ServiceWorker not supported' };
    }
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) {
        return { hasSubscription: false, endpoint_preview: null, isActive: false };
      }
      var ep = sub.endpoint || '';
      return {
        hasSubscription: true,
        endpoint_preview: ep.slice(0, 60),
        isActive: true
      };
    } catch(e) {
      return { hasSubscription: false, endpoint_preview: null, isActive: false, error: String(e) };
    }
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getServiceWorkerNotifications(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    if (!('serviceWorker' in navigator)) {
      return { hasRegistration: false, scope: null, state: null, error: 'ServiceWorker not supported' };
    }
    try {
      var regs = await navigator.serviceWorker.getRegistrations();
      if (!regs || regs.length === 0) {
        return { hasRegistration: false, scope: null, state: null };
      }
      var reg = regs[0];
      var worker = reg.active || reg.waiting || reg.installing;
      return {
        hasRegistration: true,
        scope: reg.scope,
        state: worker ? worker.state : null,
        totalRegistrations: regs.length
      };
    } catch(e) {
      return { hasRegistration: false, scope: null, state: null, error: String(e) };
    }
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNotificationBadge(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var seen = new Set();
    var items = [];
    var sel = [
      '[class*="badge"]',
      '[class*="Badge"]',
      '[class*="count"]',
      '[class*="indicator"]',
      '[data-count]',
      '[aria-label*="unread" i]',
      '[aria-label*="badge" i]'
    ].join(',');
    document.querySelectorAll(sel).forEach(function(el) {
      if (items.length >= 20) return;
      if (seen.has(el)) return;
      seen.add(el);
      var txt = el.textContent.trim();
      var count = parseInt(txt, 10);
      items.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.getAttribute('class') || '').slice(0, 80),
        count: isNaN(count) ? null : count
      });
    });
    return items;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNotificationCount(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var sel = [
      '[class*="badge"]',
      '[class*="Badge"]',
      '[class*="unread"]',
      '[data-count]',
      '[aria-label*="unread" i]',
      '[aria-label*="notifications" i]'
    ].join(',');
    var els = Array.from(document.querySelectorAll(sel));
    var totalBadges = els.length;
    var counts = els.map(function(el) {
      var txt = (el.getAttribute('data-count') || el.textContent || '').trim();
      var n = parseInt(txt, 10);
      return isNaN(n) ? 0 : n;
    }).filter(function(n) { return n > 0; });
    var visibleCount = els.filter(function(el) {
      var style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
    }).length;
    return {
      totalBadges: totalBadges,
      visibleCount: visibleCount,
      maxCount: counts.length > 0 ? Math.max.apply(null, counts) : 0
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getWebPushElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var seen = new Set();
    var items = [];
    var sel = [
      '[class*="push"]',
      '[id*="push"]',
      '[class*="subscribe"]',
      '[id*="subscribe"]',
      'button[class*="allow" i]',
      '[aria-label*="push" i]',
      '[aria-label*="subscribe" i]',
      '[data-testid*="push" i]'
    ].join(',');
    document.querySelectorAll(sel).forEach(function(el) {
      if (items.length >= 10) return;
      if (seen.has(el)) return;
      seen.add(el);
      items.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.getAttribute('class') || '').slice(0, 80),
        text_preview: el.textContent.trim().slice(0, 80)
      });
    });
    return items;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNotificationHistory(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var seen = new Set();
    var items = [];
    var sel = [
      '[aria-live]',
      '[role="log"]',
      '[role="status"]',
      '[class*="notif-history"]',
      '[class*="notification-history"]',
      '[id*="notif-history"]'
    ].join(',');
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
    return items;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
