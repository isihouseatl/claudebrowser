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

// ---------------------------------------------------------------------------
// Performance API / Resource Inspection block
// Functions 9–16: return { content: [{ type: 'text'; text: string }] }
// ---------------------------------------------------------------------------

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return {
    content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }],
  };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ---------------------------------------------------------------------------
// 9. getResourceTimings
// ---------------------------------------------------------------------------

/**
 * Return all PerformanceResourceTiming entries: name (URL), duration,
 * transferSize, and initiatorType. Capped at 30 entries.
 */
export async function getResourceTimings(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var entries = performance.getEntriesByType('resource').slice(0, 30);
    return entries.map(function(e) {
      return {
        name: e.name,
        duration: Math.round(e.duration * 100) / 100,
        transferSize: e.transferSize,
        initiatorType: e.initiatorType
      };
    });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 10. getResourcesByType
// ---------------------------------------------------------------------------

/**
 * Filter PerformanceResourceTiming entries by initiatorType.
 * Common values: 'script', 'img', 'css', 'fetch', 'xmlhttprequest', 'link'.
 */
export async function getResourcesByType(
  client: CdpClient,
  type: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function(type) {
    return performance.getEntriesByType('resource')
      .filter(function(e) { return e.initiatorType === type; })
      .map(function(e) {
        return {
          name: e.name,
          duration: Math.round(e.duration * 100) / 100,
          transferSize: e.transferSize,
          initiatorType: e.initiatorType
        };
      });
  })(${JSON.stringify(type)})`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 11. getLargestResources
// ---------------------------------------------------------------------------

/**
 * Return the top N resources by transferSize, sorted descending.
 * Default limit: 10.
 */
export async function getLargestResources(
  client: CdpClient,
  limit = 10,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function(limit) {
    var entries = performance.getEntriesByType('resource').slice();
    entries.sort(function(a, b) { return b.transferSize - a.transferSize; });
    return entries.slice(0, limit).map(function(e) {
      return {
        name: e.name,
        transferSize: e.transferSize,
        duration: Math.round(e.duration * 100) / 100,
        initiatorType: e.initiatorType
      };
    });
  })(${limit})`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 12. getCachedResources
// ---------------------------------------------------------------------------

/**
 * Return resources served from cache: transferSize === 0 but duration > 0.
 */
export async function getCachedResources(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    return performance.getEntriesByType('resource')
      .filter(function(e) { return e.transferSize === 0 && e.duration > 0; })
      .map(function(e) {
        return {
          name: e.name,
          duration: Math.round(e.duration * 100) / 100,
          initiatorType: e.initiatorType
        };
      });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 13. getTotalTransferSize
// ---------------------------------------------------------------------------

/**
 * Sum all resource transferSize values.
 * Returns { totalBytes, totalKb, count }.
 */
export async function getTotalTransferSize(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var entries = performance.getEntriesByType('resource');
    var total = 0;
    for (var i = 0; i < entries.length; i++) { total += entries[i].transferSize; }
    return {
      totalBytes: total,
      totalKb: Math.round((total / 1024) * 100) / 100,
      count: entries.length
    };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 14. getFailedResources
// ---------------------------------------------------------------------------

/**
 * Return resources with duration === 0 and transferSize === 0, likely failed.
 * Excludes data: URIs.
 */
export async function getFailedResources(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    return performance.getEntriesByType('resource')
      .filter(function(e) {
        return e.duration === 0 && e.transferSize === 0 && e.name.indexOf('data:') !== 0;
      })
      .map(function(e) {
        return { name: e.name, initiatorType: e.initiatorType };
      });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 15. clearResourceTimings
// ---------------------------------------------------------------------------

/**
 * Call performance.clearResourceTimings() in the page.
 */
export async function clearResourceTimings(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    performance.clearResourceTimings();
    return 'cleared';
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 16. getNavigationTimingBasic
// (Named getNavigationTimingBasic because getNavigationTiming already exists
// in performance.ts and is imported into server.ts under that name.)
// ---------------------------------------------------------------------------

/**
 * Return window.performance.timing values as relative milliseconds:
 * - domContentLoaded: domContentLoadedEventEnd - navigationStart
 * - loadEventEnd:     loadEventEnd - navigationStart
 * - navigationStart:  0 (anchor reference)
 */
export async function getNavigationTimingBasic(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var t = window.performance.timing;
    var nav = t.navigationStart;
    return {
      navigationStart: 0,
      domContentLoaded: t.domContentLoadedEventEnd - nav,
      loadEventEnd: t.loadEventEnd - nav
    };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 17. getScriptTags
// ---------------------------------------------------------------------------

/**
 * Return all <script> tags: src_preview (or 'inline'), type, async, defer,
 * nomodule. Capped at 20 entries.
 */
export async function getScriptTags(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script'), 0, 20);
    return scripts.map(function(s) {
      var src = s.src || '';
      var preview = src ? (src.length > 80 ? src.slice(0, 80) : src) : 'inline';
      return {
        src_preview: preview,
        type: s.type || null,
        async: s.async,
        defer: s.defer,
        nomodule: s.noModule
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 18. getStylesheetLinks
// ---------------------------------------------------------------------------

/**
 * Return all <link rel="stylesheet"> tags: href_preview, media, crossorigin.
 * Capped at 20 entries.
 */
export async function getStylesheetLinks(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'), 0, 20);
    return links.map(function(l) {
      var href = l.href || '';
      return {
        href_preview: href.length > 80 ? href.slice(0, 80) : href,
        media: l.media || null,
        crossorigin: l.crossOrigin || null
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 19. getImageSources
// ---------------------------------------------------------------------------

/**
 * Return all <img> elements: src_preview, alt_preview, width, height, loading.
 * Capped at 20 entries.
 */
export async function getImageSources(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'), 0, 20);
    return imgs.map(function(img) {
      var src = img.src || img.getAttribute('src') || '';
      var alt = img.alt || '';
      return {
        src_preview: src.length > 80 ? src.slice(0, 80) : src,
        alt_preview: alt.length > 80 ? alt.slice(0, 80) : alt,
        width: img.width || null,
        height: img.height || null,
        loading: img.loading || null
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 20. getPreloadLinks
// ---------------------------------------------------------------------------

/**
 * Return <link> tags with rel=preload|prefetch|preconnect|dns-prefetch:
 * [{rel, href_preview, as, type}]. Capped at 20 entries.
 */
export async function getPreloadLinks(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var rels = ['preload', 'prefetch', 'preconnect', 'dns-prefetch'];
    var selector = rels.map(function(r) { return 'link[rel="' + r + '"]'; }).join(',');
    var links = Array.prototype.slice.call(document.querySelectorAll(selector), 0, 20);
    return links.map(function(l) {
      var href = l.href || l.getAttribute('href') || '';
      return {
        rel: l.rel || null,
        href_preview: href.length > 80 ? href.slice(0, 80) : href,
        as: l.as || null,
        type: l.type || null
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 21. getResourceHints
// ---------------------------------------------------------------------------

/**
 * Return <link> tags with rel=preconnect or dns-prefetch:
 * [{rel, href_preview, crossorigin}]. Capped at 10 entries.
 */
export async function getResourceHints(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var selector = 'link[rel="preconnect"],link[rel="dns-prefetch"]';
    var links = Array.prototype.slice.call(document.querySelectorAll(selector), 0, 10);
    return links.map(function(l) {
      var href = l.href || l.getAttribute('href') || '';
      return {
        rel: l.rel || null,
        href_preview: href.length > 80 ? href.slice(0, 80) : href,
        crossorigin: l.crossOrigin || null
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 22. getMetaTags3
// (getMetaTags taken by page.ts; getMetaTags2 taken by print2.ts)
// ---------------------------------------------------------------------------

/**
 * Return all <meta> tags: [{name, property, httpEquiv, content_preview}].
 * Capped at 30 entries.
 */
export async function getMetaTags3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var metas = Array.prototype.slice.call(document.querySelectorAll('meta'), 0, 30);
    return metas.map(function(m) {
      var content = m.content || '';
      return {
        name: m.name || null,
        property: m.getAttribute('property') || null,
        httpEquiv: m.httpEquiv || null,
        content_preview: content.length > 80 ? content.slice(0, 80) : content
      };
    });
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 23. getDocumentCharset
// ---------------------------------------------------------------------------

/**
 * Return document encoding info:
 * {charset, contentType, doctype, compatMode}
 */
export async function getDocumentCharset(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    return {
      charset: document.characterSet,
      contentType: document.contentType,
      doctype: document.doctype ? document.doctype.name : null,
      compatMode: document.compatMode
    };
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 24. getPageTitle3
// (getPageTitle taken by history.ts; getPageTitle2 taken by print2.ts)
// ---------------------------------------------------------------------------

/**
 * Return title and heading info:
 * {title, h1_count, h1_first_preview, h2_count}
 */
export async function getPageTitle3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var h1s = document.querySelectorAll('h1');
    var h2s = document.querySelectorAll('h2');
    var firstH1 = h1s.length > 0 ? (h1s[0].textContent || '').trim() : null;
    return {
      title: document.title,
      h1_count: h1s.length,
      h1_first_preview: firstH1 && firstH1.length > 80 ? firstH1.slice(0, 80) : firstH1,
      h2_count: h2s.length
    };
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? JSON.stringify(exceptionDetails) }) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
