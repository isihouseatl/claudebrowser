// src/cdp/font.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

/**
 * Get computed font properties for the element matching selector.
 * Returns JSON: {fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing}.
 */
export async function getComputedFont(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var s = getComputedStyle(el);
  return {
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value);
}

/**
 * Get fonts from document.fonts (FontFaceSet).
 * Returns JSON array of {family, style, weight, status}. Limit 30.
 */
export async function getLoadedFonts(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var faces = [];
  document.fonts.forEach(function(f) {
    if (faces.length < 30) {
      faces.push({ family: f.family, style: f.style, weight: f.weight, status: f.status });
    }
  });
  return faces;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

/**
 * Find all @font-face declarations by scanning document.styleSheets.
 * Returns JSON array of {fontFamily, src}. Limit 20.
 */
export async function getFontFaces(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var faces = [];
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length && faces.length < 20; i++) {
    var rules;
    try { rules = sheets[i].cssRules; } catch (e) { continue; }
    if (!rules) continue;
    for (var j = 0; j < rules.length && faces.length < 20; j++) {
      var rule = rules[j];
      if (rule.type === 5) {
        faces.push({
          fontFamily: rule.style.getPropertyValue('font-family'),
          src: rule.style.getPropertyValue('src').slice(0, 100)
        });
      }
    }
  }
  return faces;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

/**
 * Get computed font-size in pixels for the element matching selector.
 * Returns JSON: {fontSize}.
 */
export async function getElementFontSize(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return { fontSize: getComputedStyle(el).fontSize };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value);
}

/**
 * Get computed font-family for the element matching selector.
 * Returns JSON: {fontFamily}.
 */
export async function getElementFontFamily(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return { fontFamily: getComputedStyle(el).fontFamily };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value);
}

/**
 * Get all text-related computed styles for the element matching selector.
 * Returns JSON: {fontFamily, fontSize, fontWeight, fontStyle, textDecoration,
 *                textTransform, textAlign, color}.
 */
export async function getTextStyles(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var s = getComputedStyle(el);
  return {
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    textDecoration: s.textDecoration,
    textTransform: s.textTransform,
    textAlign: s.textAlign,
    color: s.color
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value);
}

/**
 * Count distinct font families used on the page (scans up to 200 elements).
 * Returns JSON: {count, fonts: string[]}.
 */
export async function countDistinctFonts(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var elements = document.querySelectorAll('*');
  var seen = {};
  var limit = Math.min(elements.length, 200);
  for (var i = 0; i < limit; i++) {
    var family = getComputedStyle(elements[i]).fontFamily;
    if (family) seen[family] = true;
  }
  var fonts = Object.keys(seen);
  return { count: fonts.length, fonts: fonts };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { count: 0, fonts: [] });
}

/**
 * Check if a specific font family is loaded via document.fonts.check().
 * Returns JSON: {loaded: boolean, family: string}.
 */
export async function isFontLoaded(
  client: CdpClient,
  fontFamily: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var loaded = document.fonts.check('12px ' + ${JSON.stringify(fontFamily)});
  return { loaded: loaded, family: ${JSON.stringify(fontFamily)} };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { loaded: false, family: fontFamily });
}
