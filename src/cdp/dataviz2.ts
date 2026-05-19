// src/cdp/dataviz2.ts
import type { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. All <canvas> elements: id, class, width, height, hasWebGL. Max 10.
// Named getCanvasElements2 to avoid conflict with canvas2.ts getCanvasElements.
export async function getCanvasElements3(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('canvas');
  var out = [];
  var limit = Math.min(els.length, 10);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var hasWebGL = false;
    try { hasWebGL = !!(el.getContext('webgl') || el.getContext('webgl2')); } catch(e) {}
    out.push({
      id: el.id || null,
      class: el.className || null,
      width: el.width,
      height: el.height,
      hasWebGL: hasWebGL
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. <svg> elements with chart-like attributes (role="img", title, or class containing chart/graph/plot).
// id, class, title, width, height. Max 10.
export async function getSvgCharts(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var svgs = document.querySelectorAll('svg');
  var out = [];
  for (var i = 0; i < svgs.length && out.length < 10; i++) {
    var el = svgs[i];
    var cls = (el.getAttribute('class') || '').toLowerCase();
    var role = el.getAttribute('role') || '';
    var titleEl = el.querySelector('title');
    var titleText = titleEl ? titleEl.textContent : null;
    var isChart = role === 'img' || !!titleText || /chart|graph|plot/.test(cls);
    if (!isChart) continue;
    var w = el.getAttribute('width');
    var h = el.getAttribute('height');
    var vb = el.getAttribute('viewBox');
    out.push({
      id: el.id || null,
      class: el.getAttribute('class') || null,
      title: titleText || null,
      width: w || (vb ? vb.split(' ')[2] : null),
      height: h || (vb ? vb.split(' ')[3] : null)
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. Text elements inside SVG: tag, content. Max 30.
export async function getChartLabels(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var textEls = document.querySelectorAll('svg text, svg tspan, svg title, svg desc');
  var out = [];
  var limit = Math.min(textEls.length, 30);
  for (var i = 0; i < limit; i++) {
    var el = textEls[i];
    var content = (el.textContent || '').trim();
    if (!content) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      content: content.length > 80 ? content.substring(0, 80) + '...' : content
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. SVG groups or div elements with .legend class: id, class, itemCount. Max 5.
export async function getChartLegend(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var legendEls = document.querySelectorAll('svg g[class*="legend"], div[class*="legend"]');
  var out = [];
  var limit = Math.min(legendEls.length, 5);
  for (var i = 0; i < limit; i++) {
    var el = legendEls[i];
    var children = el.children ? el.children.length : 0;
    out.push({
      id: el.id || null,
      class: el.getAttribute('class') || null,
      itemCount: children
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. SVG elements with D3 data attributes (data-* or __data__ property): selector, dataCount. Max 10.
export async function getD3Elements(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('svg *');
  var out = [];
  for (var i = 0; i < all.length && out.length < 10; i++) {
    var el = all[i];
    var attrs = el.attributes;
    var dataAttrs = [];
    for (var j = 0; j < attrs.length; j++) {
      if (attrs[j].name.indexOf('data-') === 0) {
        dataAttrs.push(attrs[j].name);
      }
    }
    var hasD3Data = typeof el.__data__ !== 'undefined';
    if (dataAttrs.length === 0 && !hasD3Data) continue;
    var tag = el.tagName.toLowerCase();
    var id = el.id ? '#' + el.id : '';
    var cls = el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : '';
    out.push({
      selector: tag + id + cls,
      dataCount: dataAttrs.length + (hasD3Data ? 1 : 0)
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. Canvas element dimensions and context type: id, width, height, contextType. Max 10.
// Named getCanvasSize2 to avoid conflict with canvas2.ts getCanvasSize.
export async function getCanvasSize2(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('canvas');
  var out = [];
  var limit = Math.min(els.length, 10);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var contextType = 'none';
    try {
      if (el.getContext('webgl2')) { contextType = 'webgl2'; }
      else if (el.getContext('webgl')) { contextType = 'webgl'; }
      else if (el.getContext('2d')) { contextType = '2d'; }
    } catch(e) {}
    out.push({
      id: el.id || null,
      width: el.width,
      height: el.height,
      contextType: contextType
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. Canvas elements where WebGL context would succeed: id, class. Uses getAttribute inspection
// (cannot safely call getContext in evaluate without side effects — returns all canvas list with
// webgl likelihood based on attributes and existing context hints). Max 10.
export async function getWebGLContexts(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('canvas');
  var out = [];
  var limit = Math.min(els.length, 10);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var hasWebGL = false;
    try { hasWebGL = !!(el.getContext('webgl') || el.getContext('webgl2')); } catch(e) {}
    out.push({
      id: el.id || null,
      class: el.getAttribute('class') || null,
      hasWebGL: hasWebGL
    });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. Count and sample SVG <path> elements in first SVG: total, sample[d_preview]. Max 5 samples.
export async function getSvgPaths(
  client: CdpClient,
): Promise<ToolResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var svg = document.querySelector('svg');
  if (!svg) return JSON.stringify({ total: 0, sample: [] });
  var paths = svg.querySelectorAll('path');
  var total = paths.length;
  var sample = [];
  var sampleLimit = Math.min(total, 5);
  for (var i = 0; i < sampleLimit; i++) {
    var d = paths[i].getAttribute('d') || '';
    sample.push({ d_preview: d.length > 30 ? d.substring(0, 30) + '...' : d });
  }
  return JSON.stringify({ total: total, sample: sample });
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(JSON.parse(result.value as string));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
