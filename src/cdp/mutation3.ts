// src/cdp/mutation3.ts
// MutationObserver / dynamic DOM inspection functions (third batch).
//
// Naming notes:
//   getMutationObservers3 — getMutationObservers taken by event2.ts, getMutationObservers2 taken by observer2.ts
//   getLiveRegions2       — getLiveRegions taken by accessibility.ts

export async function getMutationObservers3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var hasObserver = false;
  var observerCount = 0;
  try {
    var orig = window.__mutationObserver;
    if (orig) { hasObserver = true; observerCount = 1; }
    var log = window.__mutationLog;
    if (log && log.length > 0) { hasObserver = true; }
    var all = window.__allMutationObservers;
    if (Array.isArray(all)) { observerCount = all.length; hasObserver = all.length > 0; }
  } catch(e) {}
  return JSON.stringify({ hasObserver: hasObserver, observerCount: observerCount });
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getDynamicContent(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var els = document.querySelectorAll('[aria-live],[data-dynamic],[data-live],[data-update],[data-poll],[data-refresh],[data-realtime]');
  for (var i = 0; i < els.length && results.length < 20; i++) {
    var el = els[i];
    var cls = el.className;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: typeof cls === 'string' ? cls.slice(0, 60) : null,
      ariaLive: el.getAttribute('aria-live') || null
    });
  }
  return JSON.stringify(results);
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getLoadingSpinners(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var selectors = [
    '[class*="spinner"]',
    '[class*="loader"]',
    '[class*="loading"]',
    '[aria-label*="loading"]',
    '[aria-label*="spinner"]',
    '[role="progressbar"]',
    '[data-loading]',
    '[data-spinner]'
  ];
  var seen = new Set();
  for (var s = 0; s < selectors.length && results.length < 20; s++) {
    var els;
    try { els = document.querySelectorAll(selectors[s]); } catch(e) { continue; }
    for (var i = 0; i < els.length && results.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var style = window.getComputedStyle(el);
      var visible = style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
      var cls = el.className;
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: typeof cls === 'string' ? cls.slice(0, 60) : null,
        visible: visible
      });
    }
  }
  return JSON.stringify(results);
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getSkeletonScreens(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var selectors = [
    '[class*="skeleton"]',
    '[class*="placeholder"]',
    '[class*="shimmer"]',
    '[class*="ghost"]',
    '[aria-label*="skeleton"]',
    '[data-skeleton]',
    '[data-placeholder]'
  ];
  var seen = new Set();
  for (var s = 0; s < selectors.length && results.length < 20; s++) {
    var els;
    try { els = document.querySelectorAll(selectors[s]); } catch(e) { continue; }
    for (var i = 0; i < els.length && results.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var cls = el.className;
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: typeof cls === 'string' ? cls.slice(0, 60) : null
      });
    }
  }
  return JSON.stringify(results);
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getMutationState(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var hasMutationObserver = !!(window.__mutationObserver || (Array.isArray(window.__allMutationObservers) && window.__allMutationObservers.length > 0));
  var hasLiveRegions = document.querySelectorAll('[aria-live]').length > 0;
  var spinnerSels = '[class*="spinner"],[class*="loader"],[class*="loading"],[role="progressbar"]';
  var hasSpinners = false;
  try { hasSpinners = document.querySelectorAll(spinnerSels).length > 0; } catch(e) {}
  var skelSels = '[class*="skeleton"],[class*="shimmer"],[class*="ghost"],[data-skeleton]';
  var hasSkeletons = false;
  try { hasSkeletons = document.querySelectorAll(skelSels).length > 0; } catch(e) {}
  return JSON.stringify({ hasMutationObserver: hasMutationObserver, hasLiveRegions: hasLiveRegions, hasSpinners: hasSpinners, hasSkeletons: hasSkeletons });
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getLiveRegions2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var els = document.querySelectorAll('[aria-live]');
  var results = [];
  for (var i = 0; i < els.length && results.length < 20; i++) {
    var el = els[i];
    var cls = el.className;
    var txt = (el.textContent || '').trim().slice(0, 80);
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: typeof cls === 'string' ? cls.slice(0, 60) : null,
      ariaLive: el.getAttribute('aria-live'),
      ariaAtomic: el.getAttribute('aria-atomic') || null,
      text_preview: txt || null
    });
  }
  return JSON.stringify(results);
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getPollingElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var selectors = [
    '[data-poll]',
    '[data-refresh]',
    '[data-interval]',
    '[data-realtime]',
    '[data-auto-refresh]',
    '[data-polling]'
  ];
  var results = [];
  var seen = new Set();
  for (var s = 0; s < selectors.length && results.length < 20; s++) {
    var els;
    try { els = document.querySelectorAll(selectors[s]); } catch(e) { continue; }
    for (var i = 0; i < els.length && results.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var interval = el.getAttribute('data-poll') || el.getAttribute('data-refresh') || el.getAttribute('data-interval') || null;
      var cls = el.className;
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        interval_preview: interval ? interval.slice(0, 40) : null
      });
    }
  }
  return JSON.stringify(results);
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}

export async function getMutationApiUsage(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var hasMutationObserver = !!(window.__mutationObserver || (Array.isArray(window.__allMutationObservers) && window.__allMutationObservers.length > 0));
  var hasAriaLive = document.querySelectorAll('[aria-live]').length > 0;
  var pollSels = '[data-poll],[data-refresh],[data-interval],[data-realtime],[data-auto-refresh]';
  var hasPolling = false;
  try { hasPolling = document.querySelectorAll(pollSels).length > 0; } catch(e) {}
  var hasWebSocket = typeof window.WebSocket !== 'undefined' && !!(window.__wsConnections && window.__wsConnections.length > 0);
  var hasSse = typeof window.EventSource !== 'undefined' && !!(window.__sseConnections && window.__sseConnections.length > 0);
  return JSON.stringify({ hasMutationObserver: hasMutationObserver, hasAriaLive: hasAriaLive, hasPolling: hasPolling, hasWebSocket: hasWebSocket, hasSse: hasSse });
})()
`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = JSON.parse(result.value);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e.message }) }] };
  }
}
