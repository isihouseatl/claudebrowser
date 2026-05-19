// src/cdp/print2.ts
// Page metadata, SEO, and print/share inspection functions.
//
// Naming notes:
//   getMetaTags2      — getMetaTags already exported from page.ts
//   getPageTitle2     — getPageTitle already exported from history.ts
//   getCanonicalUrl3  — getCanonicalUrl exported from pageinfo.ts, getCanonicalUrl2 from meta2.ts
//   getHreflangTags2  — getHreflangTags already exported from meta2.ts
//   getPageLanguage2  — getPageLanguage already exported from pageinfo.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getMetaTags2 — Get all <meta> name+content pairs: { name, content }[] (max 30).
 * (Renamed from getMetaTags to avoid collision with page.ts export.)
 */
export async function getMetaTags2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('meta[name]')).slice(0,30).map(function(m) { return { name: m.getAttribute('name'), content: (m.getAttribute('content')||'').slice(0,100) }; }));
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
 * getPageTitle2 — Get document.title: { title, length }.
 * (Renamed from getPageTitle to avoid collision with history.ts export.)
 */
export async function getPageTitle2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ title: document.title, length: document.title.length });
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
 * getCanonicalUrl3 — Get <link rel="canonical"> href: { canonical } or { canonical: null }.
 * (Renamed from getCanonicalUrl: taken in pageinfo.ts; getCanonicalUrl2: taken in meta2.ts.)
 */
export async function getCanonicalUrl3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var el = document.querySelector('link[rel="canonical"]');
  return JSON.stringify({ canonical: el ? el.getAttribute('href') : null });
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
 * getRobotsDirectives — Get meta robots directives: { content, noindex, nofollow }.
 */
export async function getRobotsDirectives(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var robots = document.querySelector('meta[name="robots"]');
  var content = robots ? robots.getAttribute('content') : '';
  return JSON.stringify({ content: content, noindex: content.includes('noindex'), nofollow: content.includes('nofollow') });
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
 * getLinkRelTags — Get all <link> rel tags (except stylesheet/icon): rel, href (max 20).
 */
export async function getLinkRelTags(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('link[rel]')).filter(function(l) { var r = l.getAttribute('rel'); return r !== 'stylesheet' && r !== 'icon' && r !== 'shortcut icon'; }).slice(0,20).map(function(l) { return { rel: l.getAttribute('rel'), href: (l.getAttribute('href')||'').slice(0,100) }; }));
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
 * getHreflangTags2 — Get <link rel="alternate" hreflang="..."> tags for internationalization:
 * hreflang, href (max 20).
 * (Renamed from getHreflangTags to avoid collision with meta2.ts export.)
 */
export async function getHreflangTags2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('link[hreflang]')).slice(0,20).map(function(l) { return { hreflang: l.getAttribute('hreflang'), href: (l.getAttribute('href')||'').slice(0,100) }; }));
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
 * getPageLanguage2 — Get page language from <html lang>, <meta http-equiv="Content-Language">,
 * and document.documentElement.lang: { htmlLang, metaLang, documentLang }.
 * (Renamed from getPageLanguage to avoid collision with pageinfo.ts export.)
 */
export async function getPageLanguage2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var htmlEl = document.documentElement;
  var metaLang = document.querySelector('meta[http-equiv="Content-Language"]');
  return JSON.stringify({ htmlLang: htmlEl.getAttribute('lang'), documentLang: htmlEl.lang, metaLang: metaLang ? metaLang.getAttribute('content') : null });
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
 * getStructuredDataCount — Count structured data elements by type:
 * { jsonLd, microdata, rdfa, total }.
 */
export async function getStructuredDataCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
  var microdata = document.querySelectorAll('[itemscope]').length;
  var rdfa = document.querySelectorAll('[typeof],[property]').length;
  return JSON.stringify({ jsonLd: jsonLd, microdata: microdata, rdfa: rdfa, total: jsonLd + microdata + rdfa });
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
