// src/cdp/url2.ts
import { CdpClient } from './client';

export async function getUrlParts(client: CdpClient): Promise<{
  href: string;
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
}> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({href:location.href,protocol:location.protocol,host:location.host,pathname:location.pathname,search:location.search,hash:location.hash,origin:location.origin})',
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

export async function getQueryParams(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Object.fromEntries(new URLSearchParams(location.search).entries()))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

export async function setQueryParam(client: CdpClient, key: string, value: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const u = new URL(location.href);
  u.searchParams.set(${JSON.stringify(key)}, ${JSON.stringify(value)});
  history.replaceState(null, '', u.toString());
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function removeQueryParam(client: CdpClient, key: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const u = new URL(location.href);
  u.searchParams.delete(${JSON.stringify(key)});
  history.replaceState(null, '', u.toString());
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function getHashFragment(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.hash',
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

export async function setHashFragment(client: CdpClient, hash: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.hash = ${JSON.stringify(hash)}`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function navigateToHash(client: CdpClient, elementId: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.getElementById(${JSON.stringify(elementId)});
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  location.hash = ${JSON.stringify('#' + elementId)};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function getNavigationHistory(
  client: CdpClient,
): Promise<{ currentIndex: number; entries: Array<{ url: string; title: string }> }> {
  const { currentIndex, entries } = await (client.raw.Page as any).getNavigationHistory();
  return {
    currentIndex,
    entries: (entries as Array<{ id: number; url: string; userTypedURL: string; title: string; transitionType: string }>).map(
      ({ url, title }) => ({ url, title }),
    ),
  };
}

// --- ok/err helpers for tool-style functions below ---
function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. parseCurrentUrl — parse window.location into parts
export async function parseCurrentUrl(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({href:window.location.href,protocol:window.location.protocol,host:window.location.host,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash,port:window.location.port})',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 2. getQueryParams2 — parse URL query string into key-value pairs (getQueryParams conflicts with existing export)
export async function getQueryParams2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify(Object.fromEntries(new URLSearchParams(window.location.search).entries()))',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 3. getUrlFragment — get window.location.hash value
export async function getUrlFragment(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.hash',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as string);
}

// 4. setUrlFragment — set window.location.hash = fragment
export async function setUrlFragment(
  client: CdpClient,
  fragment: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.hash = ${JSON.stringify(fragment)}`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok('Fragment set');
}

// 5. getOrigin — get window.location.origin
export async function getOrigin(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.origin',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as string);
}

// 6. isHttps — check if current URL uses https protocol
export async function isHttps(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.protocol === "https:"',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as boolean);
}

// 7. getPathSegments — split pathname by "/" and return non-empty segments
export async function getPathSegments(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify(window.location.pathname.split("/").filter(function(s){return s.length>0;}))',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 8. navigateTo — set window.location.href = url (triggers navigation)
export async function navigateTo(
  client: CdpClient,
  url: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.href = ${JSON.stringify(url)}`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok('Navigating to ' + url);
}

// --- New functions: URL inspection, history state, and navigation ---

/**
 * getCurrentUrl2 — Get full current URL breakdown:
 * { href, protocol, hostname, pathname, search, hash, port, origin }
 * (Renamed from getCurrentUrl to avoid collision with history.ts export.)
 */
export async function getCurrentUrl2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({
    href: location.href,
    protocol: location.protocol,
    hostname: location.hostname,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    port: location.port,
    origin: location.origin
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
 * getQueryParams3 — Parse URL query string into key-value pairs:
 * { params: [{key, value}], count }
 * (Renamed from getQueryParams to avoid collision with url.ts, and from
 *  getQueryParams2 to avoid collision with existing export above.)
 */
export async function getQueryParams3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var params = new URLSearchParams(location.search);
  var result = [];
  params.forEach(function(value, key) { result.push({ key: key, value: value.slice(0, 100) }); });
  return JSON.stringify({ params: result, count: result.length });
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
 * getHashContent — Get URL hash without #, and whether it matches an element ID:
 * { hash, hasTarget, targetTag }
 */
export async function getHashContent(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var hash = location.hash.replace(/^#/, '');
  var target = hash ? document.getElementById(hash) : null;
  return JSON.stringify({ hash: hash, hasTarget: !!target, targetTag: target ? target.tagName.toLowerCase() : null });
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
 * getHistoryLength2 — Get window.history.length and current state preview:
 * { length, state }
 * (Renamed from getHistoryLength to avoid collision with history.ts export.)
 */
export async function getHistoryLength2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ length: history.length, state: history.state ? JSON.stringify(history.state).slice(0, 100) : null });
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
 * getInternalLinks2 — Find all <a> links that go to the same origin:
 * href, text (max 30).
 * (Renamed from getInternalLinks to avoid collision with link.ts export.)
 */
export async function getInternalLinks2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var origin = location.origin;
  var links = Array.from(document.querySelectorAll('a[href]')).filter(function(a) {
    var href = a.href;
    return href && (href.startsWith(origin) || href.startsWith('/') || href.startsWith('#') || !href.includes('://'));
  });
  return JSON.stringify(links.slice(0, 30).map(function(a) {
    return { href: a.getAttribute('href').slice(0, 80), text: a.textContent.trim().slice(0, 50) };
  }));
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
 * getExternalLinks2 — Find all <a> links that go to a different origin:
 * href, text, domain (max 30).
 * (Renamed from getExternalLinks to avoid collision with link.ts and pageinfo.ts exports.)
 */
export async function getExternalLinks2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var origin = location.origin;
  var links = Array.from(document.querySelectorAll('a[href]')).filter(function(a) {
    return a.href && a.href.includes('://') && !a.href.startsWith(origin);
  });
  return JSON.stringify(links.slice(0, 30).map(function(a) {
    try {
      var u = new URL(a.href);
      return { href: a.href.slice(0, 80), text: a.textContent.trim().slice(0, 40), domain: u.hostname };
    } catch(e) {
      return { href: a.href.slice(0, 80), text: '', domain: '' };
    }
  }));
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
 * getAnchors — Find all <a name="..."> anchor targets and elements with [id]
 * that can be deep-linked: { anchors: [{id, tag, text}], count } (max 30).
 */
export async function getAnchors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var named = Array.from(document.querySelectorAll('a[name],[id]')).filter(function(el) {
    return el.id || el.getAttribute('name');
  });
  return JSON.stringify({
    anchors: named.slice(0, 30).map(function(el) {
      return {
        id: el.id || el.getAttribute('name'),
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 50)
      };
    }),
    count: named.length
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
 * getRedirectMeta — Check for <meta http-equiv="refresh"> redirect:
 * { hasRefresh, delay, targetUrl }
 */
export async function getRedirectMeta(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var meta = document.querySelector('meta[http-equiv="refresh"]');
  if (!meta) return JSON.stringify({ hasRefresh: false });
  var content = meta.getAttribute('content') || '';
  var parts = content.split(';');
  var delay = parseInt(parts[0]) || 0;
  var url = parts[1] ? parts[1].replace(/^\s*url=/i, '').trim() : null;
  return JSON.stringify({ hasRefresh: true, delay: delay, targetUrl: url });
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

// ============================================================
// New batch: 8 URL inspection functions (added 2026-05-19)
// ============================================================

/**
 * getCurrentUrl3 — window.location full URL and parsed parts.
 * Returns: { href, protocol, hostname, pathname, search, hash, port }
 * (Named getCurrentUrl3: getCurrentUrl conflicts with history.ts,
 *  getCurrentUrl2 already exists in this file.)
 */
export async function getCurrentUrl3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){return JSON.stringify({href:window.location.href,protocol:window.location.protocol,hostname:window.location.hostname,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash,port:window.location.port});})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getUrlHistory — window.history length and state.
 * Returns: { length, state, scrollRestoration }
 */
export async function getUrlHistory(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var s=window.history.state;return JSON.stringify({length:window.history.length,state:s===null?null:(typeof s==='object'?JSON.stringify(s).slice(0,200):String(s).slice(0,200)),scrollRestoration:window.history.scrollRestoration});})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getAnchorsById — all <a id="..."> elements (max 20).
 * Returns: [{ id, href, text_preview }]
 */
export async function getAnchorsById(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var els=Array.from(document.querySelectorAll('a[id]')).slice(0,20);return JSON.stringify(els.map(function(a){return{id:a.id,href:(a.getAttribute('href')||'').slice(0,120),text_preview:a.textContent.trim().slice(0,60)};}));})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getHashLinks — all links with href starting with '#' (max 20).
 * Returns: [{ href, text_preview }]
 */
export async function getHashLinks(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var els=Array.from(document.querySelectorAll('a[href^="#"]')).slice(0,20);return JSON.stringify(els.map(function(a){return{href:a.getAttribute('href').slice(0,120),text_preview:a.textContent.trim().slice(0,60)};}));})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getQueryParams4 — parse window.location.search into [{key, value}] (max 20).
 * (Named getQueryParams4: getQueryParams conflicts with existing export in this file,
 *  getQueryParams2 and getQueryParams3 are also already taken.)
 */
export async function getQueryParams4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var p=new URLSearchParams(window.location.search);var out=[];p.forEach(function(v,k){out.push({key:k,value:v.slice(0,200)});});return JSON.stringify(out.slice(0,20));})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getOpenGraphMeta — meta tags with property starting with 'og:' (max 20).
 * Returns: [{ property, content_preview }]
 */
export async function getOpenGraphMeta(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var metas=Array.from(document.querySelectorAll('meta[property]')).filter(function(m){return(m.getAttribute('property')||'').indexOf('og:')===0;}).slice(0,20);return JSON.stringify(metas.map(function(m){return{property:m.getAttribute('property'),content_preview:(m.getAttribute('content')||'').slice(0,200)};}));})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTwitterCardMeta — meta tags with name starting with 'twitter:' (max 20).
 * Returns: [{ name, content_preview }]
 */
export async function getTwitterCardMeta(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var metas=Array.from(document.querySelectorAll('meta[name]')).filter(function(m){return(m.getAttribute('name')||'').indexOf('twitter:')===0;}).slice(0,20);return JSON.stringify(metas.map(function(m){return{name:m.getAttribute('name'),content_preview:(m.getAttribute('content')||'').slice(0,200)};}));})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getCanonicalUrl4 — link[rel=canonical] href.
 * Returns: { canonical, exists }
 * (Named getCanonicalUrl4: getCanonicalUrl conflicts with pageinfo.ts,
 *  getCanonicalUrl2 conflicts with meta2.ts, getCanonicalUrl3 conflicts with print2.ts.)
 */
export async function getCanonicalUrl4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function(){var el=document.querySelector('link[rel="canonical"]');return JSON.stringify({canonical:el?el.getAttribute('href'):null,exists:!!el});})()`,
      returnByValue: true,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
