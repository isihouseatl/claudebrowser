// src/cdp/canvas2.ts
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

export async function getCanvasElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var canvases = document.querySelectorAll('canvas');
  var out = [];
  for (var i = 0; i < canvases.length; i++) {
    var el = canvases[i];
    var id = el.id || null;
    var hasContext2d = !!el.getContext('2d');
    out.push({ id: id, width: el.width, height: el.height, hasContext2d: hasContext2d });
  }
  return JSON.stringify(out);
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function getCanvasSize(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({ width: el.width, height: el.height, clientWidth: el.clientWidth, clientHeight: el.clientHeight });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

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
      awaitPromise: false,
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
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value as string);
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
      awaitPromise: false,
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
  return JSON.stringify({ r: data[0], g: data[1], b: data[2], a: data[3] });
})()`,
      returnByValue: true,
      awaitPromise: false,
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
    return ok(result.value as string);
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
  if (ctx2) return JSON.stringify({ webgl: true, version: 'webgl2' });
  var ctx1 = el.getContext('webgl');
  if (ctx1) return JSON.stringify({ webgl: true, version: 'webgl' });
  return JSON.stringify({ webgl: false, version: null });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('Canvas not found: ' + selector);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export async function getCanvasCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var count = document.querySelectorAll('canvas').length;
  return JSON.stringify({ count: count });
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    if (result.value === null || result.value === undefined) {
      return err('No value returned from page');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
