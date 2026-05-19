// src/cdp/performance3.ts
// Browser performance metrics — navigation timing, resource timings, Web Vitals, memory, long tasks.
// All DOM/browser API access is inside evaluate expression strings (no DOM lib types).
import type CRI from 'chrome-remote-interface';

// ---------------------------------------------------------------------------
// 1. getPerformanceTiming
//    Navigation timing summary: domContentLoaded, loadTime, ttfb, dnsLookup
// ---------------------------------------------------------------------------

export async function getPerformanceTiming(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        loadTime: Math.round(nav.loadEventEnd),
        ttfb: Math.round(nav.responseStart),
        dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart)
      };
    }
    var t = performance.timing;
    if (t) {
      return {
        domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
        loadTime: t.loadEventEnd - t.navigationStart,
        ttfb: t.responseStart - t.navigationStart,
        dnsLookup: t.domainLookupEnd - t.domainLookupStart
      };
    }
    return { error: 'Navigation timing not available' };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 2. getResourceTimings4
//    Top resource load times: [{name_preview, duration, initiatorType, size}] (max 20)
// ---------------------------------------------------------------------------

export async function getResourceTimings4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var entries = performance.getEntriesByType('resource');
    var sorted = entries.slice().sort(function(a, b) { return b.duration - a.duration; });
    var limit = Math.min(sorted.length, 20);
    var out = [];
    for (var i = 0; i < limit; i++) {
      var e = sorted[i];
      var name = e.name || '';
      var preview = name.length > 80 ? name.substring(name.length - 80) : name;
      out.push({
        name_preview: preview,
        duration: Math.round(e.duration),
        initiatorType: e.initiatorType || 'unknown',
        size: e.transferSize !== undefined ? e.transferSize : 0
      });
    }
    return out;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 3. getLargestContentfulPaint3
//    LCP value from largest-contentful-paint entries: {lcp, element_preview}
// ---------------------------------------------------------------------------

export async function getLargestContentfulPaint3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var entries = performance.getEntriesByType('largest-contentful-paint');
    if (!entries || entries.length === 0) {
      return { lcp: null, element_preview: null, hasData: false };
    }
    var last = entries[entries.length - 1];
    var preview = null;
    if (last.element) {
      var el = last.element;
      var tag = el.tagName ? el.tagName.toLowerCase() : 'unknown';
      var id = el.id ? '#' + el.id : '';
      var cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '';
      preview = tag + id + cls;
    } else if (last.url) {
      preview = last.url.length > 60 ? last.url.substring(last.url.length - 60) : last.url;
    }
    return { lcp: Math.round(last.startTime), element_preview: preview, hasData: true };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 4. getCumulativeLayoutShift3
//    CLS score from layout-shift entries: {cls, entryCount}
// ---------------------------------------------------------------------------

export async function getCumulativeLayoutShift3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var entries = performance.getEntriesByType('layout-shift');
    var cls = 0;
    for (var i = 0; i < entries.length; i++) {
      var v = entries[i].value;
      if (typeof v === 'number') cls += v;
    }
    return { cls: Math.round(cls * 10000) / 10000, entryCount: entries.length };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 5. getFirstInputDelay3
//    FID/INP from performance entries: {fid, inp, hasData}
// ---------------------------------------------------------------------------

export async function getFirstInputDelay3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var fidEntries = performance.getEntriesByType('first-input');
    var inpEntries = performance.getEntriesByType('event');
    var fid = null;
    var inp = null;
    if (fidEntries && fidEntries.length > 0) {
      fid = Math.round(fidEntries[0].processingStart - fidEntries[0].startTime);
    }
    if (inpEntries && inpEntries.length > 0) {
      var maxDuration = 0;
      for (var i = 0; i < inpEntries.length; i++) {
        var d = inpEntries[i].duration;
        if (typeof d === 'number' && d > maxDuration) maxDuration = d;
      }
      inp = maxDuration > 0 ? Math.round(maxDuration) : null;
    }
    return { fid: fid, inp: inp, hasData: fid !== null || inp !== null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 6. getNavigationTiming5
//    Full navigation timing: {redirectCount, type, protocol}
// ---------------------------------------------------------------------------

export async function getNavigationTiming5(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var nav = performance.getEntriesByType('navigation')[0];
    if (!nav) {
      return { redirectCount: null, type: null, protocol: null, error: 'No navigation entry' };
    }
    return {
      redirectCount: nav.redirectCount,
      type: nav.type,
      protocol: nav.nextHopProtocol || null,
      transferSize: nav.transferSize || 0,
      encodedBodySize: nav.encodedBodySize || 0,
      decodedBodySize: nav.decodedBodySize || 0
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 7. getMemoryInfo3
//    JS heap memory (Chrome only): {usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit}
// ---------------------------------------------------------------------------

export async function getMemoryInfo3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    if (!performance.memory) {
      return { usedJSHeapSize: null, totalJSHeapSize: null, jsHeapSizeLimit: null, available: false };
    }
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      available: true
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// ---------------------------------------------------------------------------
// 8. getLongTasks3
//    Long task entries (>50ms): [{duration, startTime, attribution_preview}] (max 20)
// ---------------------------------------------------------------------------

export async function getLongTasks3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    var tasks = performance.getEntriesByType('longtask');
    var limit = Math.min(tasks.length, 20);
    var out = [];
    for (var i = 0; i < limit; i++) {
      var t = tasks[i];
      var attrPreview = null;
      if (t.attribution && t.attribution.length > 0) {
        var a = t.attribution[0];
        attrPreview = (a.containerType || 'unknown') + (a.containerName ? ':' + a.containerName.substring(0, 30) : '');
      }
      out.push({
        duration: Math.round(t.duration),
        startTime: Math.round(t.startTime),
        attribution_preview: attrPreview
      });
    }
    return { count: tasks.length, entries: out };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
