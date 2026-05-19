// src/cdp/font2.ts
// Font, typography, and text rendering inspection functions.
//
// Naming notes:
//   getFontFaces2 — getFontFaces already exported from font.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getFontFaces2 — Get all @font-face rules from stylesheets:
 * family, src_preview, style, weight (max 20).
 * (Renamed from getFontFaces to avoid collision with font.ts export.)
 */
export async function getFontFaces2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var faces = [];
  Array.from(document.styleSheets).forEach(function(ss) {
    try {
      Array.from(ss.cssRules).forEach(function(r) {
        if (r.constructor.name === 'CSSFontFaceRule') {
          faces.push({ family: r.style.fontFamily, src: (r.style.src||'').slice(0,80), style: r.style.fontStyle, weight: r.style.fontWeight });
        }
      });
    } catch(e) {}
  });
  return JSON.stringify(faces.slice(0,20));
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
 * getUsedFontFamilies — Find unique font-family values in use across all
 * elements (sampled): { families, count } (max 20 unique).
 */
export async function getUsedFontFamilies(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var families = new Set();
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < Math.min(all.length, 200); i++) {
    var f = getComputedStyle(all[i]).fontFamily;
    if (f) families.add(f.split(',')[0].replace(/['"]/g,'').trim());
  }
  var arr = Array.from(families).slice(0,20);
  return JSON.stringify({ families: arr, count: arr.length });
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
 * getWebFontLinks — Find <link> tags loading fonts from Google Fonts, Typekit,
 * or font CDNs: href (max 10).
 */
export async function getWebFontLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('link[href*="fonts.googleapis"],link[href*="fonts.gstatic"],link[href*="use.typekit"],link[href*="fast.fonts"],link[href*=".woff"]')).slice(0,10).map(function(l) { return { href: l.getAttribute('href').slice(0,120) }; }));
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
 * getFontSizeDistribution — Sample computed font-size values across body
 * elements: { sizes: [{size, count}] } (top 10 most common).
 */
export async function getFontSizeDistribution(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var sizeMap = {};
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < Math.min(all.length, 300); i++) {
    var s = getComputedStyle(all[i]).fontSize;
    if (s) sizeMap[s] = (sizeMap[s] || 0) + 1;
  }
  var sorted = Object.keys(sizeMap).map(function(k) { return { size: k, count: sizeMap[k] }; }).sort(function(a,b) { return b.count - a.count; });
  return JSON.stringify({ sizes: sorted.slice(0,10) });
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
 * getTextRenderingMode — Find elements with explicit text-rendering or
 * font-smooth: tag, id, textRendering, fontSmoothing (max 20).
 */
export async function getTextRenderingMode(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.textRendering && s.textRendering !== 'auto') result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, textRendering: s.textRendering });
  }
  return JSON.stringify(result);
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
 * getLineHeightDistribution — Sample computed line-height values:
 * { lineHeights: [{value, count}] } (top 10).
 */
export async function getLineHeightDistribution(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var lhMap = {};
  var all = document.querySelectorAll('p,h1,h2,h3,h4,li,span,div');
  for (var i = 0; i < Math.min(all.length, 200); i++) {
    var lh = getComputedStyle(all[i]).lineHeight;
    if (lh && lh !== 'normal') lhMap[lh] = (lhMap[lh] || 0) + 1;
  }
  var sorted = Object.keys(lhMap).map(function(k) { return { value: k, count: lhMap[k] }; }).sort(function(a,b) { return b.count - a.count; });
  return JSON.stringify({ lineHeights: sorted.slice(0,10) });
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
 * getFontWeightDistribution — Sample computed font-weight values:
 * { weights: [{weight, count}] } (top 10).
 */
export async function getFontWeightDistribution(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var wMap = {};
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < Math.min(all.length, 300); i++) {
    var w = getComputedStyle(all[i]).fontWeight;
    if (w) wMap[w] = (wMap[w] || 0) + 1;
  }
  var sorted = Object.keys(wMap).map(function(k) { return { weight: k, count: wMap[k] }; }).sort(function(a,b) { return b.count - a.count; });
  return JSON.stringify({ weights: sorted.slice(0,10) });
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
 * getDocumentFontAPI — Check document.fonts API:
 * { size, status, loadingCount } (FontFaceSet).
 */
export async function getDocumentFontAPI(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!document.fonts) return JSON.stringify({ supported: false });
  var loading = 0;
  document.fonts.forEach(function(f) { if (f.status === 'loading') loading++; });
  return JSON.stringify({ supported: true, size: document.fonts.size, status: document.fonts.status, loadingCount: loading });
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

// ---- New functions (cdp: any pattern) ----
// Note: getLoadedFonts renamed to getLoadedFonts2 — getLoadedFonts is already
// exported from fonts.ts and registered in server.ts as browser_get_loaded_fonts.

/**
 * Detect fonts loaded on page via document.fonts API.
 * Returns [{family, status, style, weight}] (max 20).
 */
export async function getLoadedFonts3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var fonts = [];
    var iter = document.fonts.values();
    var entry = iter.next();
    while (!entry.done && fonts.length < 20) {
      var f = entry.value;
      fonts.push({ family: f.family, status: f.status, style: f.style, weight: f.weight });
      entry = iter.next();
    }
    return fonts;
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Parse @font-face rules from stylesheets.
 * Returns [{family, src_preview, weight, style}] (max 20).
 */
export async function getFontFaceRules(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var faces = [];
    for (var i = 0; i < document.styleSheets.length && faces.length < 20; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules; } catch(e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length && faces.length < 20; j++) {
        if (rules[j].type === 5) {
          var s = rules[j].style;
          faces.push({
            family: (s.getPropertyValue('font-family') || '').replace(/['"]/g, '').trim(),
            src_preview: (s.getPropertyValue('src') || '').slice(0, 80),
            weight: s.getPropertyValue('font-weight') || 'normal',
            style: s.getPropertyValue('font-style') || 'normal'
          });
        }
      }
    }
    return faces;
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get fonts referenced in computed font-family for first 5 element types.
 * Returns [{element_tag, fontFamily}] (max 20).
 */
export async function getSystemFonts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var tags = ['body', 'p', 'h1', 'h2', 'span'];
    var results = [];
    for (var i = 0; i < tags.length && results.length < 20; i++) {
      var el = document.querySelector(tags[i]);
      if (!el) continue;
      results.push({ element_tag: tags[i], fontFamily: getComputedStyle(el).fontFamily });
    }
    return results;
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get unique computed font-size values in use.
 * Returns [{size, count}] sorted desc (max 20).
 */
export async function getFontSizes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var map = {};
    var els = document.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var sz = getComputedStyle(els[i]).fontSize;
      if (sz) map[sz] = (map[sz] || 0) + 1;
    }
    var arr = Object.keys(map).map(function(k) { return { size: k, count: map[k] }; });
    arr.sort(function(a, b) { return b.count - a.count; });
    return arr.slice(0, 20);
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get unique computed font-weight values in use.
 * Returns [{weight, count}] (max 10).
 */
export async function getFontWeights(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var map = {};
    var els = document.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var w = getComputedStyle(els[i]).fontWeight;
      if (w) map[w] = (map[w] || 0) + 1;
    }
    var arr = Object.keys(map).map(function(k) { return { weight: k, count: map[k] }; });
    arr.sort(function(a, b) { return b.count - a.count; });
    return arr.slice(0, 10);
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get unique computed line-height values in use.
 * Returns [{lineHeight, count}] (max 10).
 */
export async function getLineHeights(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var map = {};
    var els = document.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var lh = getComputedStyle(els[i]).lineHeight;
      if (lh) map[lh] = (map[lh] || 0) + 1;
    }
    var arr = Object.keys(map).map(function(k) { return { lineHeight: k, count: map[k] }; });
    arr.sort(function(a, b) { return b.count - a.count; });
    return arr.slice(0, 10);
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get visible text-containing elements with tag, id, and text preview.
 * Returns [{tag, id, text_preview}] (max 20).
 */
export async function getTextElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var results = [];
    var els = document.querySelectorAll('p,h1,h2,h3,h4,h5,h6,span,a,li,td,th,label,button');
    for (var i = 0; i < els.length && results.length < 20; i++) {
      var el = els[i];
      var text = (el.textContent || '').trim();
      if (!text) continue;
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      results.push({ tag: el.tagName.toLowerCase(), id: el.id || null, text_preview: text.slice(0, 60) });
    }
    return results;
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Get document.fonts status and ready promise state.
 * Returns {status, size, ready}.
 */
export async function getFontLoadStatus(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  try {
    return {
      status: document.fonts.status,
      size: document.fonts.size,
      ready: typeof document.fonts.ready === 'object' ? 'promise' : String(document.fonts.ready)
    };
  } catch(e) {
    return { error: String(e) };
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
