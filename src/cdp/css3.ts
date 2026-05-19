// src/cdp/css3.ts
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

/**
 * Get elements with a non-empty style attribute (inline styles set directly on element).
 * Returns up to 20 elements: tag, id, style.
 * Renamed getInlineStyles2 — getInlineStyles already exists in css2.ts (different signature).
 */
export async function getInlineStyles2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('[style]');
  var out = [];
  var limit = Math.min(all.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = all[i];
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      style: el.getAttribute('style') || ''
    });
  }
  return JSON.stringify({ total: all.length, shown: out.length, elements: out });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get CSS custom properties (--*) declared on :root.
 * Returns up to 30 variables: name, value.
 * Renamed getCssVariables3 — getCssVariables exists in css.ts and getCssVariables2 exists in css2.ts.
 */
export async function getCssVariables3(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var styles = getComputedStyle(document.documentElement);
  var vars = [];
  for (var i = 0; i < styles.length; i++) {
    var prop = styles[i];
    if (prop.indexOf('--') === 0) {
      vars.push({ name: prop, value: styles.getPropertyValue(prop).trim() });
      if (vars.length >= 30) break;
    }
  }
  return JSON.stringify({ count: vars.length, variables: vars });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get @media rules from all stylesheets: conditionText (up to 20 unique).
 * Renamed getMediaQueries2 — getMediaQueries already exists in css2.ts.
 */
export async function getMediaQueries2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var seen = {};
  var out = [];
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    var rules;
    try { rules = sheets[i].cssRules || sheets[i].rules; } catch(e) { continue; }
    if (!rules) continue;
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.type === 4) {
        var cond = rule.conditionText || (rule.media && rule.media.mediaText) || '';
        if (!seen[cond]) {
          seen[cond] = true;
          out.push(cond);
          if (out.length >= 20) break;
        }
      }
    }
    if (out.length >= 20) break;
  }
  return JSON.stringify({ count: out.length, mediaQueries: out });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get elements with animation-name set (not "none"): tag, id, animationName (up to 20).
 * Renamed getCssAnimations2 — getCssAnimations already exists in animation2.ts.
 */
export async function getCssAnimations2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var animName = cs.animationName;
    if (!animName || animName === 'none') continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      animationName: animName
    });
    if (out.length >= 20) break;
  }
  return JSON.stringify({ count: out.length, elements: out });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get elements with transition set (not "none" or "all 0s"): tag, id, transition (up to 20).
 * Renamed getCssTransitions2 — getCssTransitions already exists in animation2.ts.
 */
export async function getCssTransitions2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    var trans = cs.transition;
    if (!trans || trans === 'none' || trans === 'all 0s ease 0s') continue;
    var dur = cs.transitionDuration;
    if (!dur) continue;
    var durations = dur.split(',').map(function(d) { return d.trim(); });
    var hasNonZero = durations.some(function(d) { return d !== '0s'; });
    if (!hasNonZero) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      transition: trans
    });
    if (out.length >= 20) break;
  }
  return JSON.stringify({ count: out.length, elements: out });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get top 10 computed style properties for an element matching selector.
 * Returns { property: value } map for the 10 most visually significant properties.
 * Renamed getComputedStyles2 — getComputedStyles already exists in css2.ts.
 */
export async function getComputedStyles2(client: CdpClient, selector: string) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var cs = getComputedStyle(el);
  var top10 = [
    'display', 'position', 'color', 'background-color',
    'font-size', 'font-family', 'margin', 'padding',
    'width', 'height'
  ];
  var out = {};
  for (var i = 0; i < top10.length; i++) {
    out[top10[i]] = cs.getPropertyValue(top10[i]);
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    if (result.value === null || result.value === undefined) return err('Element not found: ' + selector);
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Get all unique class names in use across all elements.
 * Returns { classes: string[], count: number } (up to 50 unique classes).
 */
export async function getCssClasses(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('[class]');
  var seen = {};
  var classes = [];
  for (var i = 0; i < all.length; i++) {
    var cl = all[i].classList;
    for (var j = 0; j < cl.length; j++) {
      var name = cl[j];
      if (!seen[name]) {
        seen[name] = true;
        classes.push(name);
        if (classes.length >= 50) break;
      }
    }
    if (classes.length >= 50) break;
  }
  return JSON.stringify({ count: classes.length, classes: classes });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * Count style rules across all stylesheets: total, external, inline, keyframes.
 * Returns { total, external, inline, keyframes }.
 */
export async function getStyleRules(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var total = 0, external = 0, inline = 0, keyframes = 0;
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var isExternal = !!sheet.href;
    var rules;
    try { rules = sheet.cssRules || sheet.rules; } catch(e) { continue; }
    if (!rules) continue;
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.type === 1) { // CSSStyleRule
        total++;
        if (isExternal) external++; else inline++;
      } else if (rule.type === 7) { // CSSKeyframesRule
        keyframes++;
      }
    }
  }
  return JSON.stringify({ total: total, external: external, inline: inline, keyframes: keyframes });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
