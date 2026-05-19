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
 * getPageLanguage4 — page language from html[lang] and meta[http-equiv=content-language].
 * Returns { lang, htmlLang, metaLanguage, navigatorLanguage }.
 */
export async function getPageLanguage4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var htmlEl = document.documentElement;
  var htmlLang = htmlEl ? (htmlEl.getAttribute('lang') || '') : '';
  var metaEl = document.querySelector('meta[http-equiv="content-language"]') ||
               document.querySelector('meta[name="language"]') ||
               document.querySelector('meta[name="content-language"]');
  var metaLanguage = metaEl ? (metaEl.getAttribute('content') || '') : '';
  var navLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : '';
  return JSON.stringify({
    lang: htmlLang || metaLanguage || navLang || null,
    htmlLang: htmlLang || null,
    metaLanguage: metaLanguage || null,
    navigatorLanguage: navLang || null
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
 * getTranslationElements — elements with data-i18n, data-translate, or t() patterns.
 * Returns [{ tag, id, key, attribute, text_preview }] (max 20).
 */
export async function getTranslationElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var ATTRS = ['data-i18n', 'data-translate', 'data-l10n-id', 'data-intl', 'data-locale-key', 'data-trans', 'data-key', 'i18n-key', 'v-t'];
  var seen = new Set();
  var found = [];
  for (var a = 0; a < ATTRS.length; a++) {
    var els = document.querySelectorAll('[' + ATTRS[a] + ']');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var text = (el.textContent || '').trim();
      found.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        key: el.getAttribute(ATTRS[a]) || '',
        attribute: ATTRS[a],
        text_preview: text.length > 80 ? text.slice(0, 80) + '...' : text
      });
      if (found.length >= 20) break;
    }
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
 * getLocaleState — locale summary: { lang, dir, isRtl, hasI18n, detectedLocale }.
 */
export async function getLocaleState(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var htmlEl = document.documentElement;
  var lang = (htmlEl && htmlEl.getAttribute('lang')) || (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  var dir = (htmlEl && htmlEl.getAttribute('dir')) || '';
  var isRtl = dir === 'rtl' || (typeof window !== 'undefined' && window.getComputedStyle && window.getComputedStyle(htmlEl).direction === 'rtl');
  var hasI18n = document.querySelector('[data-i18n],[data-translate],[data-l10n-id],[data-intl]') !== null;
  var detectedLocale = null;
  try {
    detectedLocale = Intl.DateTimeFormat().resolvedOptions().locale || null;
  } catch(e) {}
  return JSON.stringify({ lang: lang || null, dir: dir || null, isRtl: !!isRtl, hasI18n: hasI18n, detectedLocale: detectedLocale });
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
 * getRtlElements4 — elements with dir=rtl attribute or RTL text direction (computed).
 * Returns [{ tag, id, class_preview, source }] (max 20).
 */
export async function getRtlElements4(
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
      class_preview: cls.length > 60 ? cls.slice(0, 60) + '...' : cls,
      source: source
    });
  }
  var explicit = document.querySelectorAll('[dir="rtl"]');
  for (var i = 0; i < explicit.length; i++) {
    addEl(explicit[i], 'attr-rtl');
    if (found.length >= 20) break;
  }
  if (found.length < 20 && document.body) {
    var all = document.body.querySelectorAll('*');
    var limit = Math.min(all.length, 100);
    for (var j = 0; j < limit; j++) {
      if (seen.has(all[j])) continue;
      try {
        if (window.getComputedStyle(all[j]).direction === 'rtl') {
          addEl(all[j], 'computed-rtl');
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

/**
 * getI18nAttributes — elements carrying i18n-related data attributes.
 * Returns [{ tag, id, attributes: {name: value}, text_preview }] (max 20).
 */
export async function getI18nAttributes(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var PATTERNS = ['data-i18n', 'data-translate', 'data-l10n', 'data-intl', 'data-locale', 'data-lang', 'data-trans', 'i18n-key', 'v-t', 'data-key'];
  var selector = PATTERNS.map(function(p) { return '[' + p + ']'; }).join(',');
  var all = document.querySelectorAll(selector);
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var attrs = {};
    for (var p = 0; p < PATTERNS.length; p++) {
      var val = el.getAttribute(PATTERNS[p]);
      if (val !== null) attrs[PATTERNS[p]] = val;
    }
    var text = (el.textContent || '').trim();
    found.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      attributes: attrs,
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
 * getLanguageSwitcher — language selector dropdowns or links.
 * Looks for <select> with lang options, links with hreflang, and
 * elements with common lang-switcher class patterns.
 * Returns [{ type, tag, id, options_or_href, class_preview }] (max 20).
 */
export async function getLanguageSwitcher(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var found = [];

  // <select> elements that contain option[value] matching lang codes (2-5 char lang-like)
  var selects = document.querySelectorAll('select');
  for (var i = 0; i < selects.length; i++) {
    var sel = selects[i];
    var opts = sel.querySelectorAll('option');
    var langOpts = [];
    for (var o = 0; o < opts.length; o++) {
      var val = opts[o].value || '';
      if (/^[a-z]{2,5}(-[A-Z]{2,4})?$/.test(val)) langOpts.push(val);
    }
    if (langOpts.length >= 2) {
      var cls = (sel.className && typeof sel.className === 'string') ? sel.className : '';
      found.push({ type: 'select', tag: 'select', id: sel.id || '', options_or_href: langOpts.slice(0, 10), class_preview: cls.slice(0, 60) });
      if (found.length >= 20) break;
    }
  }

  // links with hreflang attribute
  var hreflangs = document.querySelectorAll('a[hreflang]');
  for (var h = 0; h < hreflangs.length; h++) {
    var el = hreflangs[h];
    var href = el.getAttribute('href') || '';
    var cls2 = (el.className && typeof el.className === 'string') ? el.className : '';
    found.push({ type: 'hreflang-link', tag: 'a', id: el.id || '', options_or_href: href.slice(0, 80), class_preview: cls2.slice(0, 60) });
    if (found.length >= 20) break;
  }

  // elements with class names suggesting language switcher
  if (found.length < 20) {
    var SWITCHER_CLASSES = ['lang-switch', 'language-switch', 'lang-selector', 'language-selector', 'locale-switch', 'locale-selector'];
    for (var c = 0; c < SWITCHER_CLASSES.length; c++) {
      var els = document.querySelectorAll('[class*="' + SWITCHER_CLASSES[c] + '"]');
      for (var e = 0; e < els.length; e++) {
        var elem = els[e];
        var ecls = (elem.className && typeof elem.className === 'string') ? elem.className : '';
        found.push({ type: 'class-match', tag: elem.tagName.toLowerCase(), id: elem.id || '', options_or_href: '', class_preview: ecls.slice(0, 80) });
        if (found.length >= 20) break;
      }
      if (found.length >= 20) break;
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

/**
 * getNumberFormats — detect locale-specific number/currency/date formatting in visible text.
 * Samples leaf text nodes and checks for patterns like 1.000,00 vs 1,000.00,
 * currency symbols, and date separators.
 * Returns { numberSamples, currencySamples, dateSamples, possibleLocale }.
 */
export async function getNumberFormats(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  // Gather text from leaf elements
  var leafTags = ['p', 'span', 'td', 'th', 'li', 'label', 'strong', 'em', 'b', 'div'];
  var allText = [];
  for (var t = 0; t < leafTags.length; t++) {
    var els = document.querySelectorAll(leafTags[t]);
    for (var i = 0; i < els.length; i++) {
      if (els[i].children.length === 0) {
        var txt = (els[i].textContent || '').trim();
        if (txt.length > 2 && txt.length < 200) allText.push(txt);
      }
      if (allText.length >= 300) break;
    }
    if (allText.length >= 300) break;
  }

  // Number format detection
  var euStyle = []; // 1.000,00 pattern
  var usStyle = []; // 1,000.00 pattern
  for (var n = 0; n < allText.length; n++) {
    var s = allText[n];
    if (/\d{1,3}(\.\d{3})+(,\d+)?/.test(s) && euStyle.length < 5) euStyle.push(s.slice(0, 40));
    if (/\d{1,3}(,\d{3})+(\.\d+)?/.test(s) && usStyle.length < 5) usStyle.push(s.slice(0, 40));
  }

  // Currency samples
  var CURR_RE = /[\$\u20ac\u00a3\u00a5\u20b9\u20a6\u20b5]\s*[\d,.]+|[\d,.]+\s*[\$\u20ac\u00a3\u00a5\u20b9\u20a6\u20b5]/;
  var currSamples = [];
  for (var c = 0; c < allText.length; c++) {
    if (CURR_RE.test(allText[c]) && currSamples.length < 5) currSamples.push(allText[c].slice(0, 40));
  }

  // Date samples (common separators)
  var DATE_RE = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/;
  var dateSamples = [];
  for (var d = 0; d < allText.length; d++) {
    if (DATE_RE.test(allText[d]) && dateSamples.length < 5) dateSamples.push(allText[d].slice(0, 40));
  }

  var possibleLocale = null;
  if (euStyle.length > usStyle.length) possibleLocale = 'european (comma-decimal)';
  else if (usStyle.length > 0) possibleLocale = 'us-style (period-decimal)';

  return JSON.stringify({
    numberSamples: { euStyle: euStyle, usStyle: usStyle },
    currencySamples: currSamples,
    dateSamples: dateSamples,
    possibleLocale: possibleLocale
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
 * getI18nApiUsage — detected i18n libraries: { hasI18next, hasIntl, hasFormatJs, hasVueI18n, hasReactIntl }.
 */
export async function getI18nApiUsage(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var w = window;
  var hasI18next = !!(w.i18next || w.I18next || (w.__i18nStore) || document.querySelector('[data-i18next]'));
  var hasIntl = typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function';
  // FormatJS / react-intl injects __intlData or uses specific DOM markers
  var hasFormatJs = !!(w.__intlData || w.ReactIntl || document.querySelector('[data-intl]') || document.querySelector('[data-react-intl]'));
  // Vue-i18n registers $i18n or uses v-t directive markers
  var hasVueI18n = !!(w.VueI18n || document.querySelector('[v-t]') || (w.__VUE_I18N__));
  // React-intl via FormattedMessage injects data-react-intl or uses window.ReactIntl
  var hasReactIntl = !!(w.ReactIntl || document.querySelector('[data-react-intl]') || document.querySelector('[data-intl-message]'));
  // Additional: angular-translate, lingui, polyglot
  var hasAngularTranslate = !!(w.angular && w.angular.injector) || document.querySelector('[translate]') !== null;
  var hasLingui = !!(w.__lingui || document.querySelector('[data-lingui]'));
  return JSON.stringify({
    hasI18next: hasI18next,
    hasIntl: hasIntl,
    hasFormatJs: hasFormatJs,
    hasVueI18n: hasVueI18n,
    hasReactIntl: hasReactIntl,
    hasAngularTranslate: hasAngularTranslate,
    hasLingui: hasLingui
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
 * getRtlElements — elements with dir=rtl attribute or RTL text direction (computed).
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
