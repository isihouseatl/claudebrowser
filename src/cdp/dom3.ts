// src/cdp/dom3.ts
// DOM structure inspection and analysis functions.
//
// Naming notes:
//   getDeepestElement2  — getDeepestElement already exported from mutation2.ts
//   getHiddenElements2  — getHiddenElements already exported from mutation2.ts
//   getDataAttributes2  — getDataAttributes already exported from json2.ts
//   getAriaHidden2      — getAriaHidden already exported from a11y2.ts
//   getTabOrder3        — getTabOrder exported from a11y2.ts, getTabOrder2 exported from clipboard3.ts

/**
 * getDeepestElement2 — find the element with the deepest nesting depth in the DOM.
 * Returns { tag, id, depth, path }.
 */
export async function getDeepestElement2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var deepest = null;
  var maxDepth = 0;
  function walk(el, depth, pathArr) {
    if (depth > maxDepth) {
      maxDepth = depth;
      deepest = { el: el, path: pathArr.slice() };
    }
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var segment = child.tagName.toLowerCase() + (child.id ? '#' + child.id : '');
      pathArr.push(segment);
      walk(child, depth + 1, pathArr);
      pathArr.pop();
    }
  }
  var root = document.documentElement;
  walk(root, 0, ['html']);
  if (!deepest) return JSON.stringify({ tag: 'html', id: '', depth: 0, path: 'html' });
  var el = deepest.el;
  return JSON.stringify({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    depth: maxDepth,
    path: deepest.path.join(' > ')
  });
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getDuplicateIds — find id attributes that appear more than once.
 * Returns [{ id, count, tags[] }] (max 20).
 */
export async function getDuplicateIds(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('[id]');
  var map = {};
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var id = el.id;
    if (!id) continue;
    if (!map[id]) map[id] = [];
    map[id].push(el.tagName.toLowerCase());
  }
  var dupes = [];
  for (var key in map) {
    if (map[key].length > 1) {
      dupes.push({ id: key, count: map[key].length, tags: map[key] });
    }
  }
  dupes.sort(function(a, b) { return b.count - a.count; });
  return JSON.stringify(dupes.slice(0, 20));
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getEmptyElements — elements with no text content and no children.
 * Returns [{ tag, id, class }] (max 20).
 */
export async function getEmptyElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.body ? document.body.querySelectorAll('*') : [];
  var empty = [];
  var SKIP = { SCRIPT: true, STYLE: true, META: true, LINK: true, BR: true, HR: true, INPUT: true, IMG: true, IFRAME: true };
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (SKIP[el.tagName]) continue;
    if (el.children.length === 0 && (el.textContent || '').trim() === '') {
      empty.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class: el.className || '' });
      if (empty.length >= 20) break;
    }
  }
  return JSON.stringify(empty);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getHiddenElements2 — elements with visibility:hidden or opacity:0.
 * Returns [{ tag, id, class }] (max 20).
 */
export async function getHiddenElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.body ? document.body.querySelectorAll('*') : [];
  var hidden = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.opacity === '0') {
      hidden.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class: el.className || '' });
      if (hidden.length >= 20) break;
    }
  }
  return JSON.stringify(hidden);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getDetachedElements — elements with display:none (proxy for detached/removed from flow).
 * Returns [{ tag, id, class }] (max 20).
 */
export async function getDetachedElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.body ? document.body.querySelectorAll('*') : [];
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var style = window.getComputedStyle(el);
    if (style.display === 'none') {
      found.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class: el.className || '' });
      if (found.length >= 20) break;
    }
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getDataAttributes2 — elements with data-* attributes.
 * Returns [{ tag, id, dataAttrs: [{ name, value_preview }] }] (max 20).
 */
export async function getDataAttributes2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var attrs = el.attributes;
    var dataAttrs = [];
    for (var j = 0; j < attrs.length; j++) {
      var attr = attrs[j];
      if (attr.name.indexOf('data-') === 0) {
        var val = attr.value;
        dataAttrs.push({ name: attr.name, value_preview: val.length > 80 ? val.slice(0, 80) + '...' : val });
      }
    }
    if (dataAttrs.length > 0) {
      found.push({ tag: el.tagName.toLowerCase(), id: el.id || '', dataAttrs: dataAttrs });
      if (found.length >= 20) break;
    }
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getAriaHidden2 — elements with aria-hidden="true".
 * Returns [{ tag, id, class, text_preview }] (max 20).
 */
export async function getAriaHidden2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('[aria-hidden="true"]');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var text = (el.textContent || '').trim().slice(0, 60);
    found.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class: el.className || '', text_preview: text });
    if (found.length >= 20) break;
  }
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}

/**
 * getTabOrder3 — focusable elements in tab order (tabindex >= 0 or natural).
 * Returns [{ tag, id, tabIndex, text_preview }] sorted by tabIndex (max 30).
 * Includes buttons, inputs, links, [tabindex].
 */
export async function getTabOrder3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var NATURAL = { A: true, BUTTON: true, INPUT: true, SELECT: true, TEXTAREA: true, DETAILS: true };
  var all = document.querySelectorAll('a[href], button, input, select, textarea, details, [tabindex]');
  var found = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var ti = el.tabIndex;
    if (ti < 0) continue;
    var text = (el.textContent || el.value || el.placeholder || el.getAttribute('aria-label') || '').trim().slice(0, 60);
    found.push({ tag: el.tagName.toLowerCase(), id: el.id || '', tabIndex: ti, text_preview: text });
    if (found.length >= 30) break;
  }
  found.sort(function(a, b) {
    var aPos = a.tabIndex === 0 ? 999999 : a.tabIndex;
    var bPos = b.tabIndex === 0 ? 999999 : b.tabIndex;
    return aPos - bPos;
  });
  return JSON.stringify(found);
})()
`.trim(),
      returnByValue: true,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text', text: 'Error: ' + (exceptionDetails.text ?? JSON.stringify(exceptionDetails)) }] };
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: 'Error: ' + (e?.message ?? String(e)) }] };
  }
}
