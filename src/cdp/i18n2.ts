// src/cdp/i18n2.ts
// Internationalization / localization / language inspection functions.

/**
 * getDocumentLanguage — document language info.
 * Returns { htmlLang, navigatorLanguage, navigatorLanguages[] }.
 */
export async function getDocumentLanguage(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({
    htmlLang: document.documentElement.lang || '',
    navigatorLanguage: navigator.language || '',
    navigatorLanguages: Array.from(navigator.languages || [])
  });
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getLangAttributes — elements with lang attribute (excluding <html>).
 * Returns [{ tag, id, lang, text_preview }] (max 20).
 */
export async function getLangAttributes(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('[lang]');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el.tagName.toLowerCase() === 'html') continue;
    var text = (el.textContent || '').trim();
    found.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      lang: el.getAttribute('lang') || '',
      text_preview: text.length > 80 ? text.slice(0, 80) + '...' : text
    });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getDirAttributes — elements with dir attribute (RTL/LTR markers).
 * Returns [{ tag, id, dir, text_preview }] (max 20).
 */
export async function getDirAttributes(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('[dir]');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var text = (el.textContent || '').trim();
    found.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      dir: el.getAttribute('dir') || '',
      text_preview: text.length > 80 ? text.slice(0, 80) + '...' : text
    });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getHreflangLinks — <link rel="alternate" hreflang> elements.
 * Returns [{ hreflang, href_preview }] (max 20).
 */
export async function getHreflangLinks(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('link[rel="alternate"][hreflang]');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var href = el.getAttribute('href') || '';
    found.push({
      hreflang: el.getAttribute('hreflang') || '',
      href_preview: href.length > 80 ? href.slice(0, 80) + '...' : href
    });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getTranslationMeta — meta tags related to translation/localization.
 * Looks for meta[name="google"], meta[name="translation-made-by"],
 * meta[http-equiv="content-language"].
 * Returns [{ name, content_preview }] (max 10).
 */
export async function getTranslationMeta(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var selectors = [
    'meta[name="google"]',
    'meta[name="translation-made-by"]',
    'meta[http-equiv="content-language"]',
    'meta[name="content-language"]',
    'meta[name="language"]'
  ];
  var found = [];
  for (var s = 0; s < selectors.length; s++) {
    var els = document.querySelectorAll(selectors[s]);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var nameAttr = el.getAttribute('name') || el.getAttribute('http-equiv') || '';
      var content = el.getAttribute('content') || '';
      found.push({
        name: nameAttr,
        content_preview: content.length > 80 ? content.slice(0, 80) + '...' : content
      });
      if (found.length >= 10) break;
    }
    if (found.length >= 10) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getDateTimeElements — <time> elements with datetime attributes.
 * Returns [{ id, datetime, text_preview }] (max 20).
 */
export async function getDateTimeElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('time');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var text = (el.textContent || '').trim();
    found.push({
      id: el.id || '',
      datetime: el.getAttribute('datetime') || '',
      text_preview: text.length > 80 ? text.slice(0, 80) + '...' : text
    });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getCurrencySymbols — leaf elements (p, span, div with no children) containing
 * common currency symbols: $, €, £, ¥, ₹, ₦, ₵.
 * Returns [{ tag, id, symbol, text_preview }] (max 20).
 */
export async function getCurrencySymbols(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var SYMBOLS = ['$', '\u20ac', '\u00a3', '\u00a5', '\u20b9', '\u20a6', '\u20b5'];
  var LEAF_TAGS = { P: true, SPAN: true, DIV: true, TD: true, TH: true, LI: true, LABEL: true, STRONG: true, EM: true, B: true };
  var all = document.querySelectorAll('p, span, div, td, th, li, label, strong, em, b');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el.children.length > 0) continue;
    var text = (el.textContent || '').trim();
    if (!text) continue;
    var matchedSymbol = null;
    for (var s = 0; s < SYMBOLS.length; s++) {
      if (text.indexOf(SYMBOLS[s]) !== -1) {
        matchedSymbol = SYMBOLS[s];
        break;
      }
    }
    if (!matchedSymbol) continue;
    found.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      symbol: matchedSymbol,
      text_preview: text.length > 80 ? text.slice(0, 80) + '...' : text
    });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getRtlElements — elements with dir=rtl or computed direction: rtl.
 * Queries [dir="rtl"] explicitly, then samples up to 50 body elements
 * checking getComputedStyle(el).direction === 'rtl'.
 * Returns [{ tag, id, class_preview, dir }] (max 20, deduplicated).
 */
export async function getRtlElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var seen = new Set();
  var found = [];

  function addEl(el, source) {
    if (seen.has(el)) return;
    seen.add(el);
    var cls = (el.className && typeof el.className === 'string') ? el.className : '';
    found.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls.length > 80 ? cls.slice(0, 80) + '...' : cls,
      dir: source
    });
  }

  var explicit = document.querySelectorAll('[dir="rtl"]');
  for (var i = 0; i < explicit.length; i++) {
    addEl(explicit[i], 'rtl');
    if (found.length >= 20) break;
  }

  if (found.length < 20) {
    var all = document.body ? document.body.querySelectorAll('*') : [];
    var limit = Math.min(all.length, 50);
    for (var j = 0; j < limit; j++) {
      var el = all[j];
      if (seen.has(el)) continue;
      try {
        if (window.getComputedStyle(el).direction === 'rtl') {
          addEl(el, 'computed-rtl');
          if (found.length >= 20) break;
        }
      } catch(e) {}
    }
  }

  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text' as const, text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}
