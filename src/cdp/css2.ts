// src/cdp/css2.ts
import type { CdpClient } from './client';

// ---- Helpers ----

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ---- Existing Functions (preserved) ----

/**
 * Get computed color and background-color for an element matching selector.
 * Returns JSON string: {color, backgroundColor}.
 */
export async function getComputedColor(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var s = getComputedStyle(el);
  return {color: s.color, backgroundColor: s.backgroundColor};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Get all CSS custom properties (variables) defined on :root.
 * Returns JSON array of {name, value}.
 */
export async function getCssVariables(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() { var styles = getComputedStyle(document.documentElement); var vars = []; for (var i = 0; i < styles.length; i++) { var prop = styles[i]; if (prop.startsWith('--')) vars.push({name: prop, value: styles.getPropertyValue(prop).trim()}); } return vars; })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return ok(JSON.stringify([]));
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Set a CSS variable on :root (document.documentElement).
 * Returns "Variable set" on success.
 */
export async function setCssVariable(
  client: CdpClient,
  name: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  await client.raw.Runtime.evaluate({
    expression: `document.documentElement.style.setProperty(${JSON.stringify(name)}, ${JSON.stringify(value)})`,
    returnByValue: true,
    awaitPromise: false,
  });
  return ok('Variable set');
}

/**
 * Get the classList of an element as a JSON array of strings.
 */
export async function getElementClasses(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return Array.prototype.slice.call(el.classList);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Toggle a class on an element. Returns JSON {added: true/false}.
 */
export async function toggleClass(
  client: CdpClient,
  selector: string,
  className: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var added = el.classList.toggle(${JSON.stringify(className)});
  return {added: added};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Get any single computed CSS property for an element.
 * Returns JSON {property, value}.
 */
export async function getComputedProperty(
  client: CdpClient,
  selector: string,
  property: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var value = getComputedStyle(el).getPropertyValue(${JSON.stringify(property)});
  return {property: ${JSON.stringify(property)}, value: value};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Set an inline style property on an element.
 * Returns "Style set" on success.
 */
export async function setInlineStyle(
  client: CdpClient,
  selector: string,
  property: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.style.setProperty(${JSON.stringify(property)}, ${JSON.stringify(value)});
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok('Style set');
}

/**
 * Count loaded stylesheets and return metadata for up to 20.
 * Returns JSON {count, sheets: [{href, disabled}]}.
 */
export async function getStylesheetCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var count = document.styleSheets.length;
  var sheets = Array.prototype.slice.call(document.styleSheets, 0, 20).map(function(s) {
    return {href: s.href || '(inline)', disabled: s.disabled};
  });
  return {count: count, sheets: sheets};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return ok(JSON.stringify({ count: 0, sheets: [] }));
  }
  return ok(JSON.stringify(result.value));
}

// ---- New CSS Inspection Functions ----

/**
 * List all loaded stylesheets: href, type, disabled, media (max 20).
 * Renamed getStylesheets2 to avoid conflict with getStylesheets imported from css.ts.
 */
export async function getStylesheets2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var sheets = document.styleSheets;
  var out = [];
  var limit = Math.min(sheets.length, 20);
  for (var i = 0; i < limit; i++) {
    var s = sheets[i];
    var mediaList = [];
    if (s.media && s.media.length) {
      for (var m = 0; m < s.media.length; m++) {
        mediaList.push(s.media[m]);
      }
    }
    out.push({
      index: i,
      href: s.href || '(inline)',
      type: s.type || 'text/css',
      disabled: s.disabled,
      media: mediaList
    });
  }
  return { total: sheets.length, shown: out.length, sheets: out };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ total: 0, shown: 0, sheets: [] }));
  return ok(result.value);
}

/**
 * Get all inline style properties on an element matching selector.
 * Returns JSON {selector, count, properties: [{property, value}]}.
 */
export async function getInlineStyles(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var style = el.style;
  var props = [];
  for (var i = 0; i < style.length; i++) {
    var name = style[i];
    props.push({ property: name, value: style.getPropertyValue(name) });
  }
  return { selector: ${JSON.stringify(selector)}, count: props.length, properties: props };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return err('Element not found: ' + selector);
  return ok(result.value);
}

/**
 * Get ALL computed style properties for an element as a key-value object.
 * Returns JSON {selector, count, styles: {property: value, ...}}.
 */
export async function getComputedStyles(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var cs = getComputedStyle(el);
  var styles = {};
  for (var i = 0; i < cs.length; i++) {
    var prop = cs[i];
    styles[prop] = cs.getPropertyValue(prop);
  }
  return { selector: ${JSON.stringify(selector)}, count: cs.length, styles: styles };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return err('Element not found: ' + selector);
  return ok(result.value);
}

/**
 * Get all CSS custom properties (--var) defined on :root element.
 * Renamed getCssVariables2 to avoid conflict with getCssVariables imported from css.ts in server.ts.
 * Returns JSON {count, variables: [{name, value}]}.
 */
export async function getCssVariables2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var styles = getComputedStyle(document.documentElement);
  var vars = [];
  for (var i = 0; i < styles.length; i++) {
    var prop = styles[i];
    if (prop.indexOf('--') === 0) {
      vars.push({ name: prop, value: styles.getPropertyValue(prop).trim() });
    }
  }
  return { count: vars.length, variables: vars };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ count: 0, variables: [] }));
  return ok(result.value);
}

/**
 * List all @media rules from stylesheets: conditionText, rules count.
 * Returns JSON {count, mediaQueries: [{sheetIndex, sheetHref, conditionText, rulesCount}]}.
 */
export async function getMediaQueries(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var mediaQueries = [];
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var rules;
    try { rules = sheet.cssRules || sheet.rules; } catch(e) { continue; }
    if (!rules) continue;
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.type === 4) { // CSSMediaRule
        mediaQueries.push({
          sheetIndex: i,
          sheetHref: sheet.href || '(inline)',
          conditionText: rule.conditionText || rule.media.mediaText || '',
          rulesCount: rule.cssRules ? rule.cssRules.length : 0
        });
      }
    }
  }
  return { count: mediaQueries.length, mediaQueries: mediaQueries };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ count: 0, mediaQueries: [] }));
  return ok(result.value);
}

/**
 * Get all running/pending CSS animations on elements: name, duration, state, element tag.
 * Renamed getAnimations2 to avoid conflict with getAnimations imported from animations.ts.
 * Returns JSON {count, animations: [{tag, id, className, animationName, duration, playState, iterationCount}]}.
 */
export async function getAnimations2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var animations = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var animName = cs.animationName;
    var animDuration = cs.animationDuration;
    if (!animName || animName === 'none' || animDuration === '0s') continue;
    animations.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0,3).join(' '),
      animationName: animName,
      duration: animDuration,
      playState: cs.animationPlayState,
      iterationCount: cs.animationIterationCount
    });
  }
  return { count: animations.length, animations: animations };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ count: 0, animations: [] }));
  return ok(result.value);
}

/**
 * Get elements with non-zero CSS transition-duration.
 * Renamed getTransitions2 to avoid conflict with getTransitions imported from animation.ts.
 * Returns JSON {count, transitions: [{tag, id, className, transitionProperty, transitionDuration, transitionTimingFunction}]}.
 */
export async function getTransitions2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var all = document.querySelectorAll('*');
  var transitions = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var dur = cs.transitionDuration;
    if (!dur || dur === '0s' || dur === '') continue;
    var durations = dur.split(',').map(function(d) { return d.trim(); });
    var hasNonZero = durations.some(function(d) { return d !== '0s'; });
    if (!hasNonZero) continue;
    transitions.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0,3).join(' '),
      transitionProperty: cs.transitionProperty,
      transitionDuration: dur,
      transitionTimingFunction: cs.transitionTimingFunction
    });
  }
  return { count: transitions.length, transitions: transitions };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ count: 0, transitions: [] }));
  return ok(result.value);
}

/**
 * Count total CSS rules across all stylesheets: total, byType breakdown.
 * Rule types: 1=style, 4=media, 5=fontFace, 7=keyframes, 8=keyframe, 12=supports, other.
 * Returns JSON {total, byType: {styleRules, mediaRules, fontFaceRules, keyframesRules, supportsRules, otherRules}}.
 */
export async function countCssRules(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var counts = { styleRules: 0, mediaRules: 0, fontFaceRules: 0, keyframesRules: 0, supportsRules: 0, otherRules: 0 };
  var total = 0;
  function countRules(ruleList) {
    if (!ruleList) return;
    for (var i = 0; i < ruleList.length; i++) {
      var rule = ruleList[i];
      total++;
      if (rule.type === 1) counts.styleRules++;
      else if (rule.type === 4) { counts.mediaRules++; countRules(rule.cssRules); total--; }
      else if (rule.type === 5) counts.fontFaceRules++;
      else if (rule.type === 7) counts.keyframesRules++;
      else if (rule.type === 12) { counts.supportsRules++; countRules(rule.cssRules); total--; }
      else counts.otherRules++;
    }
  }
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    var rules;
    try { rules = sheets[i].cssRules || sheets[i].rules; } catch(e) { continue; }
    countRules(rules);
  }
  return { total: total, byType: counts };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  if (result.value === null || result.value === undefined) return ok(JSON.stringify({ total: 0, byType: {} }));
  return ok(result.value);
}
