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

/**
 * getPrintMediaRules — @media print rules from stylesheets: [{selector, property, value}] (max 30).
 * Iterates all stylesheets, finds CSSMediaRule where conditionText includes "print",
 * then collects inner style rules.
 */
export async function getPrintMediaRules(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var rules = [];
  var sheets = Array.from(document.styleSheets);
  for (var si = 0; si < sheets.length && rules.length < 30; si++) {
    var sheet = sheets[si];
    var cssRules;
    try { cssRules = sheet.cssRules; } catch(e) { continue; }
    if (!cssRules) continue;
    for (var ri = 0; ri < cssRules.length && rules.length < 30; ri++) {
      var rule = cssRules[ri];
      if (rule.type === 4 && rule.conditionText && rule.conditionText.indexOf('print') !== -1) {
        var innerRules = rule.cssRules;
        if (!innerRules) continue;
        for (var ii = 0; ii < innerRules.length && rules.length < 30; ii++) {
          var inner = innerRules[ii];
          if (inner.type === 1 && inner.style) {
            var selector = inner.selectorText || '';
            for (var pi = 0; pi < inner.style.length; pi++) {
              var prop = inner.style[pi];
              rules.push({ selector: selector.slice(0, 80), property: prop, value: (inner.style.getPropertyValue(prop) || '').slice(0, 80) });
              if (rules.length >= 30) break;
            }
          }
        }
      }
    }
  }
  return JSON.stringify(rules);
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
 * getPageBreakElements — Elements with page-break or break-before/after CSS: (max 20)
 * [{tag, id, pageBreakBefore, pageBreakAfter, breakBefore, breakAfter}]
 * Checks computed styles for non-auto page-break values.
 */
export async function getPageBreakElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var els = Array.from(document.querySelectorAll('*'));
  for (var i = 0; i < els.length && results.length < 20; i++) {
    var el = els[i];
    var cs = window.getComputedStyle(el);
    var pbb = cs.pageBreakBefore;
    var pba = cs.pageBreakAfter;
    var bb = cs.breakBefore;
    var ba = cs.breakAfter;
    if (pbb !== 'auto' || pba !== 'auto' || (bb && bb !== 'auto') || (ba && ba !== 'auto')) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: (el.id || '').slice(0, 40),
        pageBreakBefore: pbb,
        pageBreakAfter: pba,
        breakBefore: bb || '',
        breakAfter: ba || ''
      });
    }
  }
  return JSON.stringify(results);
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
 * getPrintHiddenElements — Elements with @media print display:none (heuristic): (max 20)
 * [{tag, id, class_preview}]
 * Looks for class patterns: no-print, hide-print, print-hidden, screen-only.
 */
export async function getPrintHiddenElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var sel = '[class*="no-print"], [class*="hide-print"], [class*="print-hidden"], [class*="screen-only"]';
  var els = Array.from(document.querySelectorAll(sel)).slice(0, 20);
  return JSON.stringify(els.map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: (el.id || '').slice(0, 40),
      class_preview: (el.className || '').toString().slice(0, 80)
    };
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
 * getPrintVisibleElements — Elements visible only in print: (max 20)
 * [{tag, id, class_preview}]
 * Looks for class patterns: print-only, print-visible, show-print.
 */
export async function getPrintVisibleElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var sel = '[class*="print-only"], [class*="print-visible"], [class*="show-print"]';
  var els = Array.from(document.querySelectorAll(sel)).slice(0, 20);
  return JSON.stringify(els.map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: (el.id || '').slice(0, 40),
      class_preview: (el.className || '').toString().slice(0, 80)
    };
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
 * getPrintStylesheets — Stylesheets with media="print": [{href_preview, media}] (max 10).
 * Queries link[rel="stylesheet"] elements with media containing "print".
 */
export async function getPrintStylesheets(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = Array.from(document.querySelectorAll('link[rel="stylesheet"][media="print"], link[rel="stylesheet"][media*="print"]')).slice(0, 10);
  return JSON.stringify(els.map(function(el) {
    return {
      href_preview: (el.getAttribute('href') || '').slice(0, 80),
      media: el.getAttribute('media') || ''
    };
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
 * getPaperSizeHints — @page rules from stylesheets: [{size, margin, orientation}] (max 5).
 * Looks for CSSPageRule in all accessible stylesheets.
 */
export async function getPaperSizeHints(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var sheets = Array.from(document.styleSheets);
  for (var si = 0; si < sheets.length && results.length < 5; si++) {
    var sheet = sheets[si];
    var cssRules;
    try { cssRules = sheet.cssRules; } catch(e) { continue; }
    if (!cssRules) continue;
    for (var ri = 0; ri < cssRules.length && results.length < 5; ri++) {
      var rule = cssRules[ri];
      if (rule.type === 6 && rule.style) {
        var size = rule.style.getPropertyValue('size') || rule.style.size || '';
        var margin = rule.style.getPropertyValue('margin') || rule.style.margin || '';
        var orientation = size.indexOf('landscape') !== -1 ? 'landscape' : size.indexOf('portrait') !== -1 ? 'portrait' : '';
        results.push({ size: size.slice(0, 80), margin: margin.slice(0, 80), orientation: orientation });
      }
    }
  }
  return JSON.stringify(results);
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
 * getPrintFontSizes — Elements with font-size < 12px (print small-font heuristic):
 * [{tag, id, fontSize}] (max 20).
 */
export async function getPrintFontSizes(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var els = Array.from(document.querySelectorAll('*'));
  for (var i = 0; i < els.length && results.length < 20; i++) {
    var el = els[i];
    var fs = window.getComputedStyle(el).fontSize;
    if (fs) {
      var px = parseFloat(fs);
      if (!isNaN(px) && px < 12) {
        results.push({
          tag: el.tagName.toLowerCase(),
          id: (el.id || '').slice(0, 40),
          fontSize: fs
        });
      }
    }
  }
  return JSON.stringify(results);
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
 * getOrphanWidowSettings — Elements with non-default orphans/widows CSS: (max 20)
 * [{tag, id, orphans, widows}]
 * Filters elements where orphans or widows differ from browser default of '2'.
 */
export async function getOrphanWidowSettings(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var results = [];
  var els = Array.from(document.querySelectorAll('*'));
  for (var i = 0; i < els.length && results.length < 20; i++) {
    var el = els[i];
    var cs = window.getComputedStyle(el);
    var orphans = cs.orphans;
    var widows = cs.widows;
    if (orphans !== '2' || widows !== '2') {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: (el.id || '').slice(0, 40),
        orphans: orphans || '',
        widows: widows || ''
      });
    }
  }
  return JSON.stringify(results);
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
