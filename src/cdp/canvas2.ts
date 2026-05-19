// src/cdp/canvas2.ts
import { CdpClient } from './client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// 1. Find all <canvas> elements with context info. Max 10.
export async function getCanvasElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var canvases = document.querySelectorAll('canvas');
  var out = [];
  var limit = Math.min(canvases.length, 10);
  for (var i = 0; i < limit; i++) {
    var el = canvases[i];
    var hasContext2d = false;
    var hasWebgl = false;
    try { hasContext2d = !!el.getContext('2d'); } catch(e) {}
    try { hasWebgl = !!(el.getContext('webgl') || el.getContext('webgl2')); } catch(e) {}
    out.push({
      id: el.id || null,
      class: el.className || null,
      width: el.width,
      height: el.height,
      hasContext2d: hasContext2d,
      hasWebgl: hasWebgl
    });
  }
  return out;
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. Get width/height/clientWidth/clientHeight of a specific canvas.
export async function getCanvasSize(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return { width: el.width, height: el.height, clientWidth: el.clientWidth, clientHeight: el.clientHeight };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. Check if canvas is blank (all pixels transparent via getImageData on 2d context).
export async function isCanvasBlank(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx = el.getContext('2d');
  if (!ctx) return 'no-ctx';
  var data = ctx.getImageData(0, 0, el.width, el.height).data;
  for (var i = 0; i < data.length; i++) {
    if (data[i] !== 0) return { isBlank: false };
  }
  return { isBlank: true };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    if (result.value === 'no-ctx') {
      return err('Could not get 2d context for canvas: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. Get WebGL renderer info via WEBGL_debug_renderer_info extension.
export async function getWebGLInfo(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var gl = el.getContext('webgl') || el.getContext('webgl2');
  if (!gl) return { supported: false };
  var ext = gl.getExtension('WEBGL_debug_renderer_info');
  var vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  var renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return {
    vendor: vendor,
    renderer: renderer,
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
  };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. Count all canvas elements and their context types.
export async function getCanvasCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var canvases = document.querySelectorAll('canvas');
  var total = canvases.length;
  var with2d = 0, withWebgl = 0, withWebgl2 = 0;
  for (var i = 0; i < total; i++) {
    var el = canvases[i];
    try { if (el.getContext('2d')) with2d++; } catch(e) {}
    try { if (el.getContext('webgl')) withWebgl++; } catch(e) {}
    try { if (el.getContext('webgl2')) withWebgl2++; } catch(e) {}
  }
  var offscreen = typeof OffscreenCanvas !== 'undefined' ? 'supported' : 'not-supported';
  return { total: total, with2d: with2d, withWebgl: withWebgl, withWebgl2: withWebgl2, offscreen: offscreen };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. Return dataUrl from canvas.toDataURL('image/png'), truncated to 200 chars.
export async function captureCanvasDataUrl(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var full = el.toDataURL('image/png');
  var dataUrl = full.length > 200 ? full.substring(0, 200) + '...' : full;
  return { dataUrl: dataUrl };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. Get current 2D context transform matrix via ctx.getTransform().
export async function getCanvasTransform(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx = el.getContext('2d');
  if (!ctx) return 'no-ctx';
  var m = ctx.getTransform();
  return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    if (result.value === 'no-ctx') {
      return err('Could not get 2d context for canvas: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. Find all <video> elements with metadata. Max 10.
export async function getVideoElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var videos = document.querySelectorAll('video');
  var out = [];
  var limit = Math.min(videos.length, 10);
  for (var i = 0; i < limit; i++) {
    var el = videos[i];
    out.push({
      id: el.id || null,
      class: el.className || null,
      src: el.src || el.currentSrc || null,
      currentTime: el.currentTime,
      duration: el.duration,
      paused: el.paused,
      width: el.width,
      height: el.height,
      readyState: el.readyState
    });
  }
  return out;
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// Legacy functions retained for server.ts compatibility

export async function clearCanvas(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx = el.getContext('2d');
  if (!ctx) return 'no-ctx';
  ctx.clearRect(0, 0, el.width, el.height);
  return 'ok';
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    if (result.value === 'no-ctx') {
      return err('Could not get 2d context for canvas: ' + selector);
    }
    return ok('Canvas cleared');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function getCanvasDataUrl(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var dataUrl = el.toDataURL('image/png');
  return JSON.stringify({ dataUrl: dataUrl.substring(0, 64) + '...', length: dataUrl.length });
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function drawRectOnCanvas(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx = el.getContext('2d');
  if (!ctx) return 'no-ctx';
  ctx.fillStyle = 'red';
  ctx.fillRect(${x}, ${y}, ${width}, ${height});
  return 'ok';
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    if (result.value === 'no-ctx') {
      return err('Could not get 2d context for canvas: ' + selector);
    }
    return ok('Rectangle drawn');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function getCanvasPixelColor(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx = el.getContext('2d');
  if (!ctx) return 'no-ctx';
  var data = ctx.getImageData(${x}, ${y}, 1, 1).data;
  return { r: data[0], g: data[1], b: data[2], a: data[3] };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    if (result.value === 'no-ctx') {
      return err('Could not get 2d context for canvas: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function isWebGLCanvas(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var ctx2 = el.getContext('webgl2');
  if (ctx2) return { webgl: true, version: 'webgl2' };
  var ctx1 = el.getContext('webgl');
  if (ctx1) return { webgl: true, version: 'webgl' };
  return { webgl: false, version: null };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
