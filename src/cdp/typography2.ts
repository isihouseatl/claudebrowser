// src/cdp/typography2.ts
// Typography / text rendering inspection functions.
// No DOM lib — all browser APIs live inside expression strings.

type TextContent = { content: [{ type: 'text'; text: string }] };

function ok(value: unknown): TextContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}
function err(msg: string): TextContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * Elements with text-overflow:ellipsis — [{tag, id, class_preview, text_preview}] (max 20)
 */
export async function getTextOverflow(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.textOverflow !== 'ellipsis') continue;
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      text_preview: text
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Elements with white-space:nowrap (prevents text wrapping) — [{tag, id, class_preview}] (max 20)
 */
export async function getWhitespace(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.whiteSpace !== 'nowrap') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Elements with non-normal letter-spacing — [{tag, id, letterSpacing}] (max 20)
 */
export async function getLetterSpacing(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.letterSpacing === 'normal') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      letterSpacing: cs.letterSpacing
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Elements with text-transform (excluding 'none') — [{tag, id, textTransform}] (max 20)
 */
export async function getTextTransform(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.textTransform === 'none' || cs.textTransform === '') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      textTransform: cs.textTransform
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Elements with text-decoration (underline, line-through, overline) — [{tag, id, textDecoration_preview}] (max 20)
 * Checks textDecorationLine, excludes 'none'.
 */
export async function getTextDecoration(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var line = cs.textDecorationLine;
    if (!line || line === 'none' || line === '') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    var preview = (cs.textDecoration || line).slice(0, 80);
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      textDecoration_preview: preview
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Elements with text-shadow — [{tag, id, textShadow_preview}] (max 20)
 */
export async function getTextShadow(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (!cs.textShadow || cs.textShadow === 'none' || cs.textShadow === '') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      textShadow_preview: cs.textShadow.slice(0, 80)
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}

/**
 * Unique text-align values across visible text elements (p, h1-h6, div, span, li, td, th).
 * Returns [{textAlign, count, example_tag}] (max 10 unique values).
 */
export async function getTextAlign(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var sel = 'p, h1, h2, h3, h4, h5, h6, div, span, li, td, th';
  var all = document.querySelectorAll(sel);
  var map = {};
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    var cs = getComputedStyle(el);
    var align = cs.textAlign;
    if (!align) continue;
    if (!map[align]) {
      map[align] = { textAlign: align, count: 0, example_tag: el.tagName.toLowerCase() };
    }
    map[align].count++;
  }
  var out = Object.keys(map).map(function(k) { return map[k]; });
  out.sort(function(a, b) { return b.count - a.count; });
  return { unique: out.length, distribution: out.slice(0, 10) };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ unique: 0, distribution: [] });
  return ok(result.value);
}

/**
 * Elements with vertical-align not equal to 'baseline' — [{tag, id, class_preview, verticalAlign}] (max 20)
 */
export async function getVerticalAlign(cdp: any): Promise<TextContent> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var va = cs.verticalAlign;
    if (!va || va === 'baseline' || va === '') continue;
    var cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 3).join(' ');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: cls,
      verticalAlign: va
    });
  }
  return { count: out.length, elements: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok({ count: 0, elements: [] });
  return ok(result.value);
}
