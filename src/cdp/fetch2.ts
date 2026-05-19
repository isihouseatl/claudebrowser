// src/cdp/fetch2.ts
// Fetch/XHR network activity interception and inspection functions.

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * injectFetchMonitor — Patch window.fetch to record requests to
 * window.__fetchLog (circular 50): { injected: true }
 */
export async function injectFetchMonitor(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!window.__fetchPatched) {
    window.__fetchLog = [];
    var origFetch = window.fetch;
    window.fetch = function(url, opts) {
      var method = (opts && opts.method) || 'GET';
      window.__fetchLog.push({ url: String(url).slice(0,100), method: method, ts: Date.now() });
      if (window.__fetchLog.length > 50) window.__fetchLog.shift();
      return origFetch.apply(this, arguments);
    };
    window.__fetchPatched = true;
  }
  return JSON.stringify({ injected: true });
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
 * getFetchLog — Get recorded fetch request log: { requests: [{url, method, ts}], count }
 */
export async function getFetchLog(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ requests: (window.__fetchLog || []), count: (window.__fetchLog || []).length });
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
 * clearFetchLog — Clear window.__fetchLog: { cleared: true }
 */
export async function clearFetchLog(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  window.__fetchLog = []; return JSON.stringify({ cleared: true });
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
 * injectXhrMonitor — Patch XMLHttpRequest.open to record XHR requests to
 * window.__xhrLog (circular 50): { injected: true }
 */
export async function injectXhrMonitor(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!window.__xhrPatched) {
    window.__xhrLog = [];
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      window.__xhrLog.push({ method: method, url: String(url).slice(0,100), ts: Date.now() });
      if (window.__xhrLog.length > 50) window.__xhrLog.shift();
      return origOpen.apply(this, arguments);
    };
    window.__xhrPatched = true;
  }
  return JSON.stringify({ injected: true });
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
 * getXhrLog — Get recorded XHR request log: { requests: [{method, url, ts}], count }
 */
export async function getXhrLog(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ requests: (window.__xhrLog || []), count: (window.__xhrLog || []).length });
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
 * clearXhrLog — Clear window.__xhrLog: { cleared: true }
 */
export async function clearXhrLog(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  window.__xhrLog = []; return JSON.stringify({ cleared: true });
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
 * getNetworkLinks — Find all link/script/img/video/audio src or href values
 * as inferred network requests: tag, src (max 30).
 */
export async function getNetworkLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var items = [];
  ['img','script','link','video','audio','source','iframe'].forEach(function(tag) {
    document.querySelectorAll(tag).forEach(function(el) {
      var src = el.src || el.href || el.getAttribute('data-src') || '';
      if (src && src.startsWith('http')) items.push({ tag: tag, src: src.slice(0,100) });
    });
  });
  return JSON.stringify(items.slice(0,30));
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
 * getApiEndpoints — Find URLs in script text that look like API endpoints
 * (contain /api/, /v1/, /v2/, graphql): { endpoints, count } (max 20, unique).
 */
export async function getApiEndpoints(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var text = document.documentElement.outerHTML;
  var matches = text.match(/["'\`](\/api\/[^"'\`\\s<>]{2,80}|\/v[12]\/[^"'\`\\s<>]{2,80}|[^"'\`\\s<>]*graphql[^"'\`\\s<>]{0,40})["'\`]/gi) || [];
  var unique = [...new Set(matches.map(function(m) { return m.slice(1, -1); }))];
  return JSON.stringify({ endpoints: unique.slice(0,20), count: unique.length });
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
