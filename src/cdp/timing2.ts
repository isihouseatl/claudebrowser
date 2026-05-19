// src/cdp/timing2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getDomContentLoadedTime — time from navigation start to DOMContentLoaded in ms.
 * Uses the legacy performance.timing API which is universally available.
 */
export async function getDomContentLoadedTime(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ ms: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getLoadEventTime — time from navigation start to load event end in ms.
 */
export async function getLoadEventTime(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ ms: performance.timing.loadEventEnd - performance.timing.navigationStart })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTimeToFirstByte — TTFB: responseStart minus navigationStart in ms.
 */
export async function getTimeToFirstByte(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ ms: performance.timing.responseStart - performance.timing.navigationStart })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getPageTimingSummary — summary object with ttfb, domInteractive,
 * domContentLoaded, and loadEvent, all in ms from navigationStart.
 */
export async function getPageTimingSummary(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var t = performance.timing;
  var nav = t.navigationStart;
  return JSON.stringify({
    ttfb: t.responseStart - nav,
    domInteractive: t.domInteractive - nav,
    domContentLoaded: t.domContentLoadedEventEnd - nav,
    loadEvent: t.loadEventEnd - nav,
  });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getFirstPaint — FP start time in ms from the Paint Timing API.
 * Returns { startTime: <ms> } or null if not available.
 */
export async function getFirstPaint(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('paint');
  var fp = null;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].name === 'first-paint') { fp = entries[i]; break; }
  }
  return JSON.stringify(fp ? { startTime: fp.startTime } : null);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getFirstContentfulPaint — FCP start time in ms from the Paint Timing API.
 * Returns { startTime: <ms> } or null if not available.
 */
export async function getFirstContentfulPaint(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('paint');
  var fcp = null;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].name === 'first-contentful-paint') { fcp = entries[i]; break; }
  }
  return JSON.stringify(fcp ? { startTime: fcp.startTime } : null);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getResourceCount — number of resources loaded on the page.
 */
export async function getResourceCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ count: performance.getEntriesByType('resource').length })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getSlowResources — list resources that took longer than threshold_ms to load.
 * Returns JSON array of { name, duration, initiatorType }, limited to 20 results.
 * @param threshold_ms  minimum duration to include; default 500 ms
 */
export async function getSlowResources(
  client: CdpClient,
  threshold_ms = 500,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const safeThreshold = Number(threshold_ms);
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var threshold_ms = ${safeThreshold} || 500;
  var entries = performance.getEntriesByType('resource');
  var slow = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.duration > threshold_ms) {
      slow.push({ name: e.name, duration: e.duration, initiatorType: e.initiatorType });
    }
  }
  slow.sort(function(a, b) { return b.duration - a.duration; });
  return JSON.stringify(slow.slice(0, 20));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// New timing inspection functions (8 exported)
// Naming notes:
//   getNavigationTiming4   — versions 1-3 already used in performance/pageload/performance2
//   getResourceCount2      — getResourceCount already exported above in this file
//   getTimeToFirstByte2    — getTimeToFirstByte already exported above in this file
//   getLongTasks2          — getLongTasks already exported from performance2.ts
// ---------------------------------------------------------------------------

/**
 * getNavigationTiming4 — Returns key PerformanceNavigationTiming values as
 * offsets from fetchStart: domContentLoaded, loadEventEnd, domInteractive,
 * responseStart, requestStart, fetchStart (absolute).
 */
export async function getNavigationTiming4(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var t = performance.timing;
  var fs = t.fetchStart;
  return JSON.stringify({
    fetchStart: fs,
    requestStart: t.requestStart - fs,
    responseStart: t.responseStart - fs,
    domInteractive: t.domInteractive - fs,
    domContentLoaded: t.domContentLoadedEventEnd - fs,
    loadEventEnd: t.loadEventEnd - fs,
  });
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
 * getPaintTimings — Returns all paint entries from the Paint Timing API.
 * Each entry: { name, startTime }. Typically includes first-paint and
 * first-contentful-paint.
 */
export async function getPaintTimings(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('paint');
  var out = [];
  for (var i = 0; i < entries.length; i++) {
    out.push({ name: entries[i].name, startTime: entries[i].startTime });
  }
  return JSON.stringify(out);
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
 * getLargestContentfulPaint — Returns the most recent LCP entry via
 * performance.getEntriesByType('largest-contentful-paint').
 * Returns { lcp_ms, element, url } or { lcp_ms: null, reason: 'not yet observed' }.
 */
export async function getLargestContentfulPaint(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('largest-contentful-paint');
  if (!entries || entries.length === 0) {
    return JSON.stringify({ lcp_ms: null, reason: 'not yet observed' });
  }
  var last = entries[entries.length - 1];
  var el = last.element;
  var elementDesc = el ? (el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ').join('.') : '')) : null;
  return JSON.stringify({
    lcp_ms: last.startTime,
    element: elementDesc,
    url: last.url || null,
  });
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
 * getFirstInputDelay — Returns FID from performance.getEntriesByType('first-input').
 * Returns { fid_ms, processingStart, target } or { fid_ms: null } if no input yet.
 */
export async function getFirstInputDelay(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('first-input');
  if (!entries || entries.length === 0) {
    return JSON.stringify({ fid_ms: null });
  }
  var e = entries[0];
  var targetDesc = e.target ? (e.target.tagName + (e.target.id ? '#' + e.target.id : '')) : null;
  return JSON.stringify({
    fid_ms: e.processingStart - e.startTime,
    processingStart: e.processingStart,
    target: targetDesc,
  });
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
 * getCumulativeLayoutShift — Returns CLS score and shift count from
 * performance.getEntriesByType('layout-shift').
 * Returns { cls_score, shiftCount }.
 */
export async function getCumulativeLayoutShift(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('layout-shift');
  var cls = 0;
  for (var i = 0; i < entries.length; i++) {
    cls += entries[i].value;
  }
  return JSON.stringify({ cls_score: cls, shiftCount: entries.length });
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
 * getResourceCount2 — Returns total resource count plus breakdown by initiatorType:
 * { total, script, css, img, fetch, xhr, font, other }.
 * (Renamed from getResourceCount to avoid collision with the existing export above.)
 */
export async function getResourceCount2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('resource');
  var counts = { total: entries.length, script: 0, css: 0, img: 0, fetch: 0, xhr: 0, font: 0, other: 0 };
  var known = { script: true, css: true, img: true, fetch: true, xhr: true, font: true };
  for (var i = 0; i < entries.length; i++) {
    var t = entries[i].initiatorType;
    if (known[t]) {
      counts[t]++;
    } else {
      counts.other++;
    }
  }
  return JSON.stringify(counts);
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
 * getTimeToFirstByte2 — Returns TTFB from performance.timing:
 * { ttfb_ms, requestStart, responseStart }.
 * (Renamed from getTimeToFirstByte to avoid collision with the existing export above.)
 */
export async function getTimeToFirstByte2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var t = performance.timing;
  return JSON.stringify({
    ttfb_ms: t.responseStart - t.requestStart,
    requestStart: t.requestStart,
    responseStart: t.responseStart,
  });
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
 * getLongTasks2 — Returns long tasks (duration > 50ms) from
 * performance.getEntriesByType('longtask').
 * Returns { tasks: [{duration, startTime}], count, totalBlockingTime }.
 * (Renamed from getLongTasks to avoid collision with performance2.ts export.)
 */
export async function getLongTasks2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('longtask');
  var tasks = [];
  var tbt = 0;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    tasks.push({ startTime: e.startTime, duration: e.duration });
    tbt += e.duration - 50;
  }
  return JSON.stringify({ tasks: tasks, count: tasks.length, totalBlockingTime: tbt });
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
