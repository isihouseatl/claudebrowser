// src/cdp/performance2.ts
// Page-level performance metrics — Web Vitals, memory, layout shifts, long tasks.
// All DOM access is inside evaluate expression strings (no DOM lib).
import { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Return helpers
// ---------------------------------------------------------------------------

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---------------------------------------------------------------------------
// Internal evaluate helper — no awaitPromise (synchronous expressions only)
// ---------------------------------------------------------------------------

async function evalSync<T>(client: CdpClient, expression: string): Promise<T> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(
      exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error',
    );
  }
  return result.value as T;
}

// ---------------------------------------------------------------------------
// 1. getPerformanceEntries
//    Returns JSON of the first 50 entries from performance.getEntries().
// ---------------------------------------------------------------------------

export async function getPerformanceEntries(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const entries = await evalSync<Array<{
      name: string;
      entryType: string;
      startTime: number;
      duration: number;
    }>>(
      client,
      `(function() {
        var all = performance.getEntries();
        var out = [];
        var limit = Math.min(all.length, 50);
        for (var i = 0; i < limit; i++) {
          var e = all[i];
          out.push({ name: e.name, entryType: e.entryType, startTime: e.startTime, duration: e.duration });
        }
        return out;
      })()`,
    );
    return ok(JSON.stringify(entries, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. getNavigationTiming
//    Reads PerformanceNavigationTiming (or legacy performance.timing fallback).
// ---------------------------------------------------------------------------

export async function getNavigationTiming(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const timing = await evalSync<{
      domContentLoaded: number;
      load: number;
      ttfb: number;
      domInteractive?: number;
    }>(
      client,
      `(function() {
        var nav = performance.getEntriesByType('navigation')[0];
        if (!nav) {
          var t = performance.timing;
          return {
            domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
            load: t.loadEventEnd - t.navigationStart,
            ttfb: t.responseStart - t.navigationStart
          };
        }
        return {
          domContentLoaded: nav.domContentLoadedEventEnd,
          load: nav.loadEventEnd,
          ttfb: nav.responseStart,
          domInteractive: nav.domInteractive
        };
      })()`,
    );
    return ok(JSON.stringify(timing, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. getResourceTimings
//    First 30 resource entries: name, duration, transferSize, initiatorType.
// ---------------------------------------------------------------------------

export async function getResourceTimings(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const resources = await evalSync<Array<{
      name: string;
      duration: number;
      transferSize: number;
      initiatorType: string;
    }>>(
      client,
      `(function() {
        var entries = performance.getEntriesByType('resource');
        var limit = Math.min(entries.length, 30);
        var out = [];
        for (var i = 0; i < limit; i++) {
          var e = entries[i];
          out.push({
            name: e.name,
            duration: e.duration,
            transferSize: e.transferSize !== undefined ? e.transferSize : 0,
            initiatorType: e.initiatorType
          });
        }
        return out;
      })()`,
    );
    return ok(JSON.stringify(resources, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. getLongTasks
//    Long task entries (>50 ms) via performance.getEntriesByType('longtask').
//    Only populated if a PerformanceObserver for 'longtask' was active.
// ---------------------------------------------------------------------------

export async function getLongTasks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const data = await evalSync<{
      count: number;
      entries: Array<{ name: string; startTime: number; duration: number }>;
    }>(
      client,
      `(function() {
        var tasks = performance.getEntriesByType('longtask');
        var entries = tasks.map(function(e) {
          return { name: e.name, startTime: e.startTime, duration: e.duration };
        });
        return { count: entries.length, entries: entries };
      })()`,
    );
    return ok(JSON.stringify(data, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. getMemoryInfo
//    Chrome-only performance.memory API.
// ---------------------------------------------------------------------------

export async function getMemoryInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const mem = await evalSync<{
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } | null>(
      client,
      `(function() {
        if (!performance.memory) return null;
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      })()`,
    );
    if (mem === null || mem === undefined) {
      return ok('Memory API not available');
    }
    return ok(JSON.stringify(mem, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. getCLS
//    Approximate Cumulative Layout Shift: sum of layout-shift entry values.
// ---------------------------------------------------------------------------

export async function getCLS(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const data = await evalSync<{ cls: number; shiftCount: number }>(
      client,
      `(function() {
        var entries = performance.getEntriesByType('layout-shift');
        var total = 0;
        for (var i = 0; i < entries.length; i++) {
          var v = entries[i].value;
          if (typeof v === 'number') total += v;
        }
        return { cls: total, shiftCount: entries.length };
      })()`,
    );
    return ok(JSON.stringify(data, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. getFCP
//    First Contentful Paint from paint entries.
// ---------------------------------------------------------------------------

export async function getFCP(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const data = await evalSync<{ fcp: number | null }>(
      client,
      `(function() {
        var entries = performance.getEntriesByType('paint');
        var fcp = null;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].name === 'first-contentful-paint') {
            fcp = entries[i].startTime;
            break;
          }
        }
        return { fcp: fcp };
      })()`,
    );
    return ok(JSON.stringify(data, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 8. getLCP
//    Largest Contentful Paint: last entry in largest-contentful-paint list.
// ---------------------------------------------------------------------------

export async function getLCP(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const data = await evalSync<{ lcp: number | null }>(
      client,
      `(function() {
        var entries = performance.getEntriesByType('largest-contentful-paint');
        var lcp = entries.length > 0 ? entries[entries.length - 1].startTime : null;
        return { lcp: lcp };
      })()`,
    );
    return ok(JSON.stringify(data, null, 2));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
