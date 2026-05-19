// src/cdp/perf2.ts
// Additional performance and memory measurement tools via CDP.
// No DOM lib — all DOM access is inside Runtime.evaluate expression strings.
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ---------------------------------------------------------------------------
// 1. getCdpMetrics
//    Get Chrome performance metrics via CDP Performance domain.
// ---------------------------------------------------------------------------

export async function getCdpMetrics(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Performance as any).enable({});
    const { metrics } = await (client.raw.Performance as any).getMetrics();
    return ok(JSON.stringify(metrics));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. getJsHeapSize
//    Get JS heap size from performance.memory (Chrome-only).
// ---------------------------------------------------------------------------

export async function getJsHeapSize(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `typeof performance.memory !== 'undefined' ? JSON.stringify({ usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit }) : null`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('performance.memory not available');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. getDomNodeCount
//    Count total DOM nodes in the page.
// ---------------------------------------------------------------------------

export async function getDomNodeCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.querySelectorAll('*').length`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ count: result.value as number }));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. getEventListenerTotal
//    Approximate count of event listeners by checking on* properties across
//    up to 500 elements.
// ---------------------------------------------------------------------------

export async function getEventListenerTotal(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var props = ['onclick','onchange','oninput','onkeydown','onkeyup','onkeypress',
                     'onmousedown','onmouseup','onmousemove','onmouseover','onmouseout',
                     'onfocus','onblur','onsubmit','onload','onerror','ontouchstart',
                     'ontouchend','onscroll','ondblclick'];
        var all = document.querySelectorAll('*');
        var limit = Math.min(all.length, 500);
        var count = 0;
        for (var i = 0; i < limit; i++) {
          var el = all[i];
          for (var j = 0; j < props.length; j++) {
            if (el[props[j]] !== null && el[props[j]] !== undefined) {
              count++;
            }
          }
        }
        return count;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ approximate: result.value as number }));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. markPerformance
//    Create a named performance mark.
// ---------------------------------------------------------------------------

export async function markPerformance(
  client: CdpClient,
  name: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.mark(${JSON.stringify(name)}); 'marked'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance mark created: ' + name);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. measurePerformance
//    Create a named performance measure between two marks.
// ---------------------------------------------------------------------------

export async function measurePerformance(
  client: CdpClient,
  name: string,
  startMark: string,
  endMark: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.measure(${JSON.stringify(name)}, ${JSON.stringify(startMark)}, ${JSON.stringify(endMark)}); 'measured'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance measure created: ' + name);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. clearPerformanceMarks
//    Clear all performance marks and measures.
// ---------------------------------------------------------------------------

export async function clearPerformanceMarks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.clearMarks(); performance.clearMeasures(); 'cleared'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance marks and measures cleared');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 8. getPerformanceMarks
//    Get all performance marks and measures.
// ---------------------------------------------------------------------------

export async function getPerformanceMarks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ marks: performance.getEntriesByType('mark').map(e => ({name: e.name, startTime: e.startTime})), measures: performance.getEntriesByType('measure').map(e => ({name: e.name, startTime: e.startTime, duration: e.duration})) })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// New functions — all 8 requested names conflict with existing server.ts
// imports, so each gets the suffix "2".
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// N1. getNavigationTiming2
//     window.performance.timing metrics: domContentLoaded, loadComplete,
//     ttfb, domInteractive — all in ms relative to navigationStart.
//     Conflicts with: getNavigationTiming (performance.ts) and
//                     getNavigationTiming as getNavigationTiming3 (performance2.ts)
//                     and getNavigationTiming2 (pageload.ts) -> use suffix below
// ---------------------------------------------------------------------------

export async function getNavigationTimingPerf2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var t = window.performance && window.performance.timing;
        if (!t) return null;
        var nav = t.navigationStart;
        return JSON.stringify({
          domContentLoaded: t.domContentLoadedEventEnd - nav,
          loadComplete: t.loadEventEnd - nav,
          ttfb: t.responseStart - nav,
          domInteractive: t.domInteractive - nav
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('performance.timing not available');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N2. getResourceTiming2
//     performance.getEntriesByType('resource'): up to 20 entries with
//     name_preview (last 60 chars), initiatorType, duration, transferSize.
//     Conflicts with: getResourceTiming (perf3.ts)
// ---------------------------------------------------------------------------

export async function getResourceTiming2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('resource');
        var out = [];
        var limit = Math.min(entries.length, 20);
        for (var i = 0; i < limit; i++) {
          var e = entries[i];
          var name = e.name || '';
          out.push({
            name_preview: name.length > 60 ? name.slice(name.length - 60) : name,
            initiatorType: e.initiatorType,
            duration: Math.round(e.duration * 100) / 100,
            transferSize: e.transferSize || 0
          });
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '[]');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N3. getLargestContentfulPaint2
//     largest-contentful-paint PerformanceObserver entry: {startTime, size,
//     url_preview} or null if not available.
//     Conflicts with: getLargestContentfulPaint (timing2.ts)
// ---------------------------------------------------------------------------

export async function getLargestContentfulPaint2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('largest-contentful-paint');
        if (!entries || entries.length === 0) return null;
        var last = entries[entries.length - 1];
        var url = (last.url || last.element && last.element.src) || '';
        return JSON.stringify({
          startTime: Math.round(last.startTime * 100) / 100,
          size: last.size || 0,
          url_preview: url.length > 60 ? url.slice(url.length - 60) : url
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      const data = null;
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N4. getFirstInputDelay2
//     first-input entry: {startTime, processingStart, duration} or null.
//     Conflicts with: getFirstInputDelay (timing2.ts)
// ---------------------------------------------------------------------------

export async function getFirstInputDelay2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('first-input');
        if (!entries || entries.length === 0) return null;
        var e = entries[0];
        return JSON.stringify({
          startTime: Math.round(e.startTime * 100) / 100,
          processingStart: Math.round(e.processingStart * 100) / 100,
          duration: Math.round(e.duration * 100) / 100
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      const data = null;
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N5. getCumulativeLayoutShift2
//     layout-shift entries summed: {cls, entries_count}.
//     Conflicts with: getCumulativeLayoutShift (timing2.ts)
// ---------------------------------------------------------------------------

export async function getCumulativeLayoutShift2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('layout-shift');
        var cls = 0;
        for (var i = 0; i < entries.length; i++) {
          cls += entries[i].value || 0;
        }
        return JSON.stringify({
          cls: Math.round(cls * 10000) / 10000,
          entries_count: entries.length
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '{"cls":0,"entries_count":0}');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N6. getLongTasks2 (already taken by timing2.ts as getLongTasks2)
//     longtask entries (duration > 50ms): up to 10 with
//     {startTime, duration, attribution}.
//     Conflicts with: getLongTasks (performance2.ts) AND
//                     getLongTasks2 (timing2.ts) -> use suffix "Perf2"
// ---------------------------------------------------------------------------

export async function getLongTasksPerf2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('longtask');
        var out = [];
        var count = 0;
        for (var i = 0; i < entries.length && count < 10; i++) {
          var e = entries[i];
          if (e.duration > 50) {
            var attr = e.attribution && e.attribution.length > 0
              ? { name: e.attribution[0].name, containerType: e.attribution[0].containerType }
              : null;
            out.push({
              startTime: Math.round(e.startTime * 100) / 100,
              duration: Math.round(e.duration * 100) / 100,
              attribution: attr
            });
            count++;
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '[]');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N7. getMemoryInfo2
//     performance.memory if available: {usedJSHeapSize, totalJSHeapSize,
//     jsHeapSizeLimit} in MB.
//     Conflicts with: getMemoryInfo (performance2.ts)
// ---------------------------------------------------------------------------

export async function getMemoryInfo2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var mem = window.performance && window.performance.memory;
        if (!mem) return null;
        var mb = 1048576;
        return JSON.stringify({
          usedJSHeapSize: Math.round(mem.usedJSHeapSize / mb * 100) / 100,
          totalJSHeapSize: Math.round(mem.totalJSHeapSize / mb * 100) / 100,
          jsHeapSizeLimit: Math.round(mem.jsHeapSizeLimit / mb * 100) / 100
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      const data = null;
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// N8. getPaintTiming2
//     first-paint and first-contentful-paint entries: {firstPaint,
//     firstContentfulPaint} in ms.
//     Conflicts with: getPaintTiming (performance.ts)
// ---------------------------------------------------------------------------

export async function getPaintTiming2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('paint');
        var fp = null;
        var fcp = null;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].name === 'first-paint') {
            fp = Math.round(entries[i].startTime * 100) / 100;
          } else if (entries[i].name === 'first-contentful-paint') {
            fcp = Math.round(entries[i].startTime * 100) / 100;
          }
        }
        return JSON.stringify({ firstPaint: fp, firstContentfulPaint: fcp });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '{"firstPaint":null,"firstContentfulPaint":null}');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// Batch 3 — Core Web Vitals & perf monitoring utilities
// Suffix notes:
//   getResourceTiming          -> getResourceTiming3  (getResourceTiming taken by perf3.ts,
//                                                       getResourceTiming2 taken above)
//   getLargestContentfulPaint  -> getLargestContentfulPaint4  (2 & 3 already taken)
//   getFirstContentfulPaint    -> getFirstContentfulPaint2    (timing2.ts has the base name)
//   getCumulativeLayoutShift   -> getCumulativeLayoutShift4   (2 & 3 already taken)
//   getPerformanceMetrics, getPageLoadTiming, getPerformanceState, getPerfApiUsage
//                              -> no conflicts, used as-is
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// B3-1. getPerformanceMetrics
//       Core Web Vitals snapshot: lcp, fcp, cls, ttfb, domInteractive (all ms).
// ---------------------------------------------------------------------------

export async function getPerformanceMetrics(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var t = window.performance && window.performance.timing;
        var ttfb = t ? (t.responseStart - t.navigationStart) : null;
        var domInteractive = t ? (t.domInteractive - t.navigationStart) : null;
        var paintEntries = performance.getEntriesByType('paint');
        var fcp = null;
        for (var i = 0; i < paintEntries.length; i++) {
          if (paintEntries[i].name === 'first-contentful-paint') {
            fcp = Math.round(paintEntries[i].startTime * 100) / 100;
          }
        }
        var lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        var lcp = lcpEntries.length > 0
          ? Math.round(lcpEntries[lcpEntries.length - 1].startTime * 100) / 100
          : null;
        var shiftEntries = performance.getEntriesByType('layout-shift');
        var cls = 0;
        for (var j = 0; j < shiftEntries.length; j++) { cls += shiftEntries[j].value || 0; }
        return JSON.stringify({
          lcp: lcp,
          fcp: fcp,
          cls: Math.round(cls * 10000) / 10000,
          ttfb: ttfb,
          domInteractive: domInteractive
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? 'null');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-2. getPageLoadTiming
//       Navigation Timing API: loadTime, domContentLoaded, firstByte (ms).
// ---------------------------------------------------------------------------

export async function getPageLoadTiming(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var t = window.performance && window.performance.timing;
        if (!t) return null;
        var nav = t.navigationStart;
        var loadTime = t.loadEventEnd > 0 ? (t.loadEventEnd - nav) : null;
        var dclEnd = t.domContentLoadedEventEnd > 0 ? (t.domContentLoadedEventEnd - nav) : null;
        var firstByte = t.responseStart > 0 ? (t.responseStart - nav) : null;
        return JSON.stringify({
          loadTime: loadTime,
          domContentLoaded: dclEnd,
          firstByte: firstByte
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('performance.timing not available');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-3. getResourceTiming3
//       Top 20 PerformanceResourceTiming entries sorted by duration descending.
//       name_preview, initiatorType, duration, transferSize, decodedBodySize.
//       (getResourceTiming taken by perf3.ts; getResourceTiming2 taken above)
// ---------------------------------------------------------------------------

export async function getResourceTiming3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('resource');
        var sorted = entries.slice().sort(function(a, b) { return b.duration - a.duration; });
        var limit = Math.min(sorted.length, 20);
        var out = [];
        for (var i = 0; i < limit; i++) {
          var e = sorted[i];
          var name = e.name || '';
          out.push({
            name_preview: name.length > 60 ? name.slice(name.length - 60) : name,
            initiatorType: e.initiatorType,
            duration: Math.round(e.duration * 100) / 100,
            transferSize: e.transferSize || 0,
            decodedBodySize: e.decodedBodySize || 0
          });
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '[]');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-4. getLargestContentfulPaint4
//       LCP value and element tag/id/src from largest-contentful-paint entries.
//       (getLargestContentfulPaint, getLargestContentfulPaint2,
//        getLargestContentfulPaint3 are all taken)
// ---------------------------------------------------------------------------

export async function getLargestContentfulPaint4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('largest-contentful-paint');
        if (!entries || entries.length === 0) return null;
        var last = entries[entries.length - 1];
        var el = last.element;
        var elementInfo = null;
        if (el) {
          elementInfo = {
            tagName: el.tagName ? el.tagName.toLowerCase() : null,
            id: el.id || null,
            src: el.src || el.currentSrc || null
          };
        }
        var url = last.url || '';
        return JSON.stringify({
          lcpMs: Math.round(last.startTime * 100) / 100,
          size: last.size || 0,
          url_preview: url.length > 80 ? url.slice(url.length - 80) : url,
          element: elementInfo
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return { content: [{ type: 'text' as const, text: JSON.stringify(null) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-5. getFirstContentfulPaint2
//       FCP value from paint PerformanceEntries (no PerformanceObserver needed).
//       (getFirstContentfulPaint taken by timing2.ts)
// ---------------------------------------------------------------------------

export async function getFirstContentfulPaint2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('paint');
        var fcp = null;
        var fp = null;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].name === 'first-contentful-paint') {
            fcp = Math.round(entries[i].startTime * 100) / 100;
          }
          if (entries[i].name === 'first-paint') {
            fp = Math.round(entries[i].startTime * 100) / 100;
          }
        }
        return JSON.stringify({
          fcpMs: fcp,
          firstPaintMs: fp,
          available: fcp !== null
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '{"fcpMs":null,"firstPaintMs":null,"available":false}');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-6. getCumulativeLayoutShift4
//       CLS score from layout-shift entries with hadRecentInput filtering.
//       (getCumulativeLayoutShift, getCumulativeLayoutShift2,
//        getCumulativeLayoutShift3 are all taken)
// ---------------------------------------------------------------------------

export async function getCumulativeLayoutShift4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var entries = performance.getEntriesByType('layout-shift');
        var clsAll = 0;
        var clsFiltered = 0;
        var totalEntries = entries.length;
        var filteredEntries = 0;
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          var v = e.value || 0;
          clsAll += v;
          if (!e.hadRecentInput) {
            clsFiltered += v;
            filteredEntries++;
          }
        }
        return JSON.stringify({
          clsScore: Math.round(clsFiltered * 10000) / 10000,
          clsAllEntries: Math.round(clsAll * 10000) / 10000,
          totalShiftEntries: totalEntries,
          filteredShiftEntries: filteredEntries
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? '{"clsScore":0,"clsAllEntries":0,"totalShiftEntries":0,"filteredShiftEntries":0}');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-7. getPerformanceState
//       Summary booleans + key metric values for a quick page health check.
// ---------------------------------------------------------------------------

export async function getPerformanceState(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasPerf = typeof window.performance !== 'undefined';
        var lcpMs = null;
        var fcpMs = null;
        var ttfbMs = null;
        var clsScore = 0;
        if (hasPerf) {
          var lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            lcpMs = Math.round(lcpEntries[lcpEntries.length - 1].startTime * 100) / 100;
          }
          var paintEntries = performance.getEntriesByType('paint');
          for (var i = 0; i < paintEntries.length; i++) {
            if (paintEntries[i].name === 'first-contentful-paint') {
              fcpMs = Math.round(paintEntries[i].startTime * 100) / 100;
            }
          }
          var t = performance.timing;
          if (t && t.responseStart > 0) {
            ttfbMs = t.responseStart - t.navigationStart;
          }
          var shiftEntries = performance.getEntriesByType('layout-shift');
          for (var j = 0; j < shiftEntries.length; j++) {
            if (!shiftEntries[j].hadRecentInput) clsScore += shiftEntries[j].value || 0;
          }
        }
        return JSON.stringify({
          hasPerformanceApi: hasPerf,
          lcpMs: lcpMs,
          fcpMs: fcpMs,
          ttfbMs: ttfbMs,
          clsScore: Math.round(clsScore * 10000) / 10000
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? 'null');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// B3-8. getPerfApiUsage
//       Detect third-party performance monitoring libraries on the page.
// ---------------------------------------------------------------------------

export async function getPerfApiUsage(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasWebVitals = typeof window.webVitals !== 'undefined'
          || typeof window.__WEB_VITALS_POLYFILL__ !== 'undefined'
          || (typeof window.performance !== 'undefined' && typeof window.performance.mark === 'function'
              && document.querySelector('script[src*="web-vitals"]') !== null);
        var hasNewRelic = typeof window.newrelic !== 'undefined'
          || document.querySelector('script[src*="nr-spa"]') !== null
          || document.querySelector('script[src*="newrelic"]') !== null;
        var hasDatadog = typeof window.DD_RUM !== 'undefined'
          || typeof window.DD_LOGS !== 'undefined'
          || document.querySelector('script[src*="datadog"]') !== null;
        var hasGoogleAnalytics = typeof window.gtag !== 'undefined'
          || typeof window.ga !== 'undefined'
          || typeof window._ga !== 'undefined'
          || document.querySelector('script[src*="googletagmanager"]') !== null
          || document.querySelector('script[src*="google-analytics"]') !== null;
        var hasSentry = typeof window.Sentry !== 'undefined'
          || typeof window.__SENTRY__ !== 'undefined'
          || document.querySelector('script[src*="sentry"]') !== null;
        return JSON.stringify({
          hasWebVitals: hasWebVitals,
          hasNewRelic: hasNewRelic,
          hasDatadog: hasDatadog,
          hasGoogleAnalytics: hasGoogleAnalytics,
          hasSentry: hasSentry
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    const data = JSON.parse((result.value as string) ?? 'null');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
