// src/cdp/network2.ts
// Advanced network inspection — complements cdp/network.ts with
// PerformanceResourceTiming-based analysis and in-page introspection.
import { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Internal helper: evaluate an expression in the page and return the value.
// ---------------------------------------------------------------------------
async function evaluate<T>(client: CdpClient, expression: string): Promise<T> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `evaluate error: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
    );
  }
  return result.value as T;
}

// ---------------------------------------------------------------------------
// 1. getNetworkTimings
// ---------------------------------------------------------------------------

export interface NetworkTiming {
  url: string;
  dns: number;
  connect: number;
  ttfb: number;
  total: number;
}

/**
 * Collect timing breakdown for every loaded resource via
 * `performance.getEntriesByType('resource')`.
 *
 * - dns    : domainLookupEnd - domainLookupStart
 * - connect: connectEnd - connectStart
 * - ttfb   : responseStart - requestStart
 * - total  : duration
 *
 * All values are rounded to 2 decimal places (milliseconds).
 */
export async function getNetworkTimings(client: CdpClient): Promise<NetworkTiming[]> {
  const expression = `(function() {
    return performance.getEntriesByType('resource').map(function(e) {
      return {
        url: e.name,
        dns: Math.round((e.domainLookupEnd - e.domainLookupStart) * 100) / 100,
        connect: Math.round((e.connectEnd - e.connectStart) * 100) / 100,
        ttfb: Math.round((e.responseStart - e.requestStart) * 100) / 100,
        total: Math.round(e.duration * 100) / 100
      };
    });
  })()`;
  return evaluate<NetworkTiming[]>(client, expression);
}

// ---------------------------------------------------------------------------
// 2. getLargestRequests
// ---------------------------------------------------------------------------

export interface LargeRequest {
  url: string;
  size: number;
  type: string;
}

/**
 * Return the top `limit` requests sorted by transferSize (descending).
 * Uses PerformanceResourceTiming entries visible in the page.
 * Default limit: 10.
 */
export async function getLargestRequests(
  client: CdpClient,
  limit = 10,
): Promise<LargeRequest[]> {
  const expression = `(function(limit) {
    var entries = performance.getEntriesByType('resource');
    var mapped = entries.map(function(e) {
      return { url: e.name, size: e.transferSize, type: e.initiatorType };
    });
    mapped.sort(function(a, b) { return b.size - a.size; });
    return mapped.slice(0, limit);
  })(${limit})`;
  return evaluate<LargeRequest[]>(client, expression);
}

// ---------------------------------------------------------------------------
// 3. getFailedRequests
// ---------------------------------------------------------------------------

export interface FailedRequest {
  url: string;
  duration: number;
}

/**
 * Return resource entries where `transferSize === 0 && duration > 0`.
 * These are requests that took time but transferred no bytes — a reliable
 * signal for blocked or failed resources (excluding data: URIs).
 */
export async function getFailedRequests(
  client: CdpClient,
): Promise<FailedRequest[]> {
  const expression = `(function() {
    return performance.getEntriesByType('resource')
      .filter(function(e) {
        return e.transferSize === 0 && e.duration > 0 && e.name.indexOf('data:') !== 0;
      })
      .map(function(e) {
        return { url: e.name, duration: Math.round(e.duration * 100) / 100 };
      });
  })()`;
  return evaluate<FailedRequest[]>(client, expression);
}

// ---------------------------------------------------------------------------
// 4. getRequestCount
// ---------------------------------------------------------------------------

export interface RequestCount {
  total: number;
  byType: Record<string, number>;
}

/**
 * Count all resource requests and group them by `initiatorType`
 * (e.g. "script", "img", "fetch", "xmlhttprequest", "css", etc.)
 */
export async function getRequestCount(client: CdpClient): Promise<RequestCount> {
  const expression = `(function() {
    var entries = performance.getEntriesByType('resource');
    var byType = {};
    entries.forEach(function(e) {
      var t = e.initiatorType || 'other';
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total: entries.length, byType: byType };
  })()`;
  return evaluate<RequestCount>(client, expression);
}

// ---------------------------------------------------------------------------
// 5. getServiceWorkerInfo
// ---------------------------------------------------------------------------

export interface ServiceWorkerInfo {
  controlled: boolean;
  scriptURL: string | null;
  state: string | null;
}

/**
 * Evaluate in-page to inspect the active ServiceWorker controller.
 * Returns controlled=false when no service worker controls this page.
 *
 * Note: this reads the in-page `navigator.serviceWorker.controller` —
 * distinct from CDP ServiceWorker domain methods in cdp/serviceworker.ts.
 */
export async function getServiceWorkerInfo(
  client: CdpClient,
): Promise<ServiceWorkerInfo> {
  const expression = `(function() {
    if (!('serviceWorker' in navigator)) {
      return { controlled: false, scriptURL: null, state: null };
    }
    var c = navigator.serviceWorker.controller;
    if (!c) {
      return { controlled: false, scriptURL: null, state: null };
    }
    return { controlled: true, scriptURL: c.scriptURL, state: c.state };
  })()`;
  return evaluate<ServiceWorkerInfo>(client, expression);
}

// ---------------------------------------------------------------------------
// 6. getPageProtocol
// ---------------------------------------------------------------------------

/**
 * Return `window.location.protocol` for the current page
 * (e.g. "https:", "http:", "file:").
 */
export async function getPageProtocol(client: CdpClient): Promise<string> {
  return evaluate<string>(client, 'window.location.protocol');
}

// ---------------------------------------------------------------------------
// 7. getDnsLookupTime
// ---------------------------------------------------------------------------

/**
 * Find the first PerformanceResourceTiming entry whose URL includes
 * `hostname` and return its DNS lookup duration
 * (`domainLookupEnd - domainLookupStart`) rounded to 2 decimal places.
 *
 * Returns null if no matching entry is found or if DNS timing is not
 * available (cross-origin entries may report 0/0 for security reasons).
 */
export async function getDnsLookupTime(
  client: CdpClient,
  hostname: string,
): Promise<number | null> {
  const expression = `(function(hostname) {
    var entries = performance.getEntriesByType('resource');
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.name.indexOf(hostname) !== -1) {
        var dns = e.domainLookupEnd - e.domainLookupStart;
        return Math.round(dns * 100) / 100;
      }
    }
    return null;
  })(${JSON.stringify(hostname)})`;
  return evaluate<number | null>(client, expression);
}

// ---------------------------------------------------------------------------
// 8. getCachedRequests
// ---------------------------------------------------------------------------

export interface CachedRequest {
  url: string;
  type: string;
}

/**
 * Return resource entries served from cache.
 * A cache hit is identified by `transferSize === 0 && decodedBodySize > 0`:
 * the browser delivered bytes from its cache without a network transfer.
 */
export async function getCachedRequests(
  client: CdpClient,
): Promise<CachedRequest[]> {
  const expression = `(function() {
    return performance.getEntriesByType('resource')
      .filter(function(e) {
        return e.transferSize === 0 && e.decodedBodySize > 0;
      })
      .map(function(e) {
        return { url: e.name, type: e.initiatorType };
      });
  })()`;
  return evaluate<CachedRequest[]>(client, expression);
}
