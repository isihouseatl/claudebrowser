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
