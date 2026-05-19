// src/cdp/json2.ts
// CDP module for JSON and structured data inspection on a page.
// NOTE: getOpenGraphTags and getTwitterCardTags conflict with pageinfo.ts imports
// in server.ts — they are exported here as getOpenGraphTags2 / getTwitterCardTags2.
import { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpContent {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// 1. Find all <script type="application/ld+json"> elements.
// Returns { type, data_preview }[] where data_preview is first 200 chars of the JSON. Max 10.
export async function getJsonLdScripts(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).slice(0, 10);
  return JSON.stringify(scripts.map(function(el) {
    var raw = (el.textContent || '').trim();
    var type = 'unknown';
    try {
      var parsed = JSON.parse(raw);
      type = (parsed && parsed['@type']) ? String(parsed['@type']) : 'unknown';
    } catch(e) {
      type = 'parse_error';
    }
    return {
      type: type,
      data_preview: raw.length > 200 ? raw.slice(0, 200) : raw
    };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 2. Get all <meta property="og:*"> tags.
// Returns { property, content }[].
// Named getOpenGraphTags2 to avoid conflict with getOpenGraphTags imported from pageinfo in server.ts.
export async function getOpenGraphTags2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var metas = Array.from(document.querySelectorAll('meta[property]'));
  var og = metas.filter(function(el) {
    var prop = el.getAttribute('property') || '';
    return prop.indexOf('og:') === 0;
  });
  return JSON.stringify(og.map(function(el) {
    return {
      property: el.getAttribute('property') || '',
      content: el.getAttribute('content') || ''
    };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 3. Get all <meta name="twitter:*"> tags.
// Returns { name, content }[].
// Named getTwitterCardTags2 to avoid conflict with getTwitterCardTags imported from pageinfo in server.ts.
export async function getTwitterCardTags2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var metas = Array.from(document.querySelectorAll('meta[name]'));
  var tw = metas.filter(function(el) {
    var name = el.getAttribute('name') || '';
    return name.indexOf('twitter:') === 0;
  });
  return JSON.stringify(tw.map(function(el) {
    return {
      name: el.getAttribute('name') || '',
      content: el.getAttribute('content') || ''
    };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 4. Find itemscope attributes on the page (Schema.org microdata).
// Returns { tag, id, itemtype, itemid }[]. Max 20.
export async function getSchemaOrg(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var els = Array.from(document.querySelectorAll('[itemscope]')).slice(0, 20);
  return JSON.stringify(els.map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      itemtype: el.getAttribute('itemtype') || null,
      itemid: el.getAttribute('itemid') || null
    };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 5. Find any <script type="application/json"> or <script id="*-data"> elements with JSON content.
// Returns { id, type, keys, preview }[] (top-level keys + first 100 chars). Max 10.
export async function getPageJsonData(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var byType = Array.from(document.querySelectorAll('script[type="application/json"]'));
  var byId = Array.from(document.querySelectorAll('script[id]')).filter(function(el) {
    return (el.id || '').indexOf('-data') !== -1;
  });
  var seen = new Set();
  var all = byType.concat(byId).filter(function(el) {
    if (seen.has(el)) return false;
    seen.add(el);
    return true;
  }).slice(0, 10);
  return JSON.stringify(all.map(function(el) {
    var raw = (el.textContent || '').trim();
    var keys = [];
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        keys = Object.keys(parsed);
      } else if (Array.isArray(parsed)) {
        keys = ['[array length=' + parsed.length + ']'];
      }
    } catch(e) {
      keys = ['[parse_error]'];
    }
    return {
      id: el.id || null,
      type: el.getAttribute('type') || null,
      keys: keys,
      preview: raw.length > 100 ? raw.slice(0, 100) : raw
    };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 6. Find window.* properties that contain plain objects or arrays (not functions/DOM).
// Returns { key, type, preview }[] (first 100 chars of JSON). Max 20.
// Skips internals starting with _ or __.
export async function getWindowJsonGlobals(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var keys = Object.keys(window);
  for (var i = 0; i < keys.length && results.length < 20; i++) {
    var key = keys[i];
    if (key.charAt(0) === '_') continue;
    var val;
    try { val = window[key]; } catch(e) { continue; }
    if (val === null || val === undefined) continue;
    if (typeof val === 'function') continue;
    if (typeof val !== 'object') continue;
    if (val instanceof Node || val instanceof Window) continue;
    if (val instanceof HTMLCollection || val instanceof NodeList) continue;
    var type = Array.isArray(val) ? 'array' : 'object';
    var preview = '';
    try {
      var str = JSON.stringify(val);
      if (!str) continue;
      preview = str.length > 100 ? str.slice(0, 100) : str;
    } catch(e) {
      continue;
    }
    results.push({ key: key, type: type, preview: preview });
  }
  return JSON.stringify(results);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 7. Get all data-* attributes on elements matching selector.
// Returns { selector, attributes: [{name, value}] }[]. Max 20 elements.
export async function getDataAttributes(client: CdpClient, selector: string): Promise<McpContent> {
  const escapedSelector = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var els;
  try {
    els = Array.from(document.querySelectorAll('${escapedSelector}')).slice(0, 20);
  } catch(e) {
    return JSON.stringify({ error: 'Invalid selector: ' + e.message });
  }
  return JSON.stringify(els.map(function(el) {
    var attrs = [];
    var attrNodes = el.attributes;
    for (var i = 0; i < attrNodes.length; i++) {
      var attr = attrNodes[i];
      if (attr.name.indexOf('data-') === 0) {
        attrs.push({ name: attr.name, value: attr.value });
      }
    }
    var selectorStr = el.tagName.toLowerCase();
    if (el.id) selectorStr += '#' + el.id;
    else if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\\s+/)[0];
      if (cls) selectorStr += '.' + cls;
    }
    return { selector: selectorStr, attributes: attrs };
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    const parsed = JSON.parse(result.value as string);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      return err(parsed.error as string);
    }
    return ok(parsed);
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}

// 8. Sample up to 20 elements across the page that have at least one data-* attribute.
// Returns { tag, id, dataset: {key: value} }[].
export async function getPageDatasets(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var all = Array.from(document.querySelectorAll('*'));
  var withData = [];
  for (var i = 0; i < all.length && withData.length < 20; i++) {
    var el = all[i];
    var attrs = el.attributes;
    var hasData = false;
    for (var j = 0; j < attrs.length; j++) {
      if (attrs[j].name.indexOf('data-') === 0) { hasData = true; break; }
    }
    if (!hasData) continue;
    var dataset = {};
    for (var j = 0; j < attrs.length; j++) {
      if (attrs[j].name.indexOf('data-') === 0) {
        dataset[attrs[j].name.slice(5)] = attrs[j].value;
      }
    }
    withData.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      dataset: dataset
    });
  }
  return JSON.stringify(withData);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err('Failed to parse result: ' + String(e));
  }
}
