// src/cdp/canvas.ts
import { CdpClient } from './client';

export interface CanvasInfo {
  selector: string;
  width: number;
  height: number;
  contextType: '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer' | 'unknown';
}

export async function getCanvasElements(client: CdpClient): Promise<CanvasInfo[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const canvases = [...document.querySelectorAll('canvas')];
  return canvases.map((c, i) => {
    let contextType = 'unknown';
    const existing = c.__cb_contextType;
    if (existing) {
      contextType = existing;
    } else {
      if (c.__cb_ctx2d !== undefined || c.getContext('2d') !== null) {
        contextType = '2d';
        c.__cb_contextType = '2d';
      } else if (c.getContext('webgl2') !== null) {
        contextType = 'webgl2';
        c.__cb_contextType = 'webgl2';
      } else if (c.getContext('webgl') !== null) {
        contextType = 'webgl';
        c.__cb_contextType = 'webgl';
      } else if (c.getContext('bitmaprenderer') !== null) {
        contextType = 'bitmaprenderer';
        c.__cb_contextType = 'bitmaprenderer';
      }
    }
    let selector = '';
    if (c.id) {
      selector = '#' + c.id;
    } else if (c.className) {
      selector = 'canvas.' + c.className.trim().split(/\\s+/).join('.');
    } else {
      selector = 'canvas:nth-of-type(' + (i + 1) + ')';
    }
    return { selector, width: c.width, height: c.height, contextType };
  });
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as CanvasInfo[];
}

export async function canvasToDataUrl(client: CdpClient, selector: string): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  return c.toDataURL('image/png');
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

export async function getCanvasDimensions(
  client: CdpClient,
  selector: string,
): Promise<{ width: number; height: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  return JSON.stringify({ width: c.width, height: c.height });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as { width: number; height: number };
}

export async function getCanvasPixelColor(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
): Promise<{ r: number; g: number; b: number; a: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for canvas: ' + ${JSON.stringify(selector)});
  const data = ctx.getImageData(${x}, ${y}, 1, 1).data;
  return JSON.stringify({ r: data[0], g: data[1], b: data[2], a: data[3] });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as { r: number; g: number; b: number; a: number };
}

export async function clearCanvas(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for canvas: ' + ${JSON.stringify(selector)});
  ctx.clearRect(0, 0, c.width, c.height);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function drawTextOnCanvas(
  client: CdpClient,
  selector: string,
  text: string,
  x: number,
  y: number,
  font?: string,
  color?: string,
): Promise<void> {
  const fontExpr = font ? JSON.stringify(font) : '"16px sans-serif"';
  const colorExpr = color ? JSON.stringify(color) : '"#000000"';
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for canvas: ' + ${JSON.stringify(selector)});
  ctx.font = ${fontExpr};
  ctx.fillStyle = ${colorExpr};
  ctx.fillText(${JSON.stringify(text)}, ${x}, ${y});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function drawRectOnCanvas(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: string,
  fill?: boolean,
): Promise<void> {
  const colorExpr = color ? JSON.stringify(color) : '"#000000"';
  const isFill = fill !== false;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c = document.querySelector(${JSON.stringify(selector)});
  if (!c) throw new Error('Canvas not found: ' + ${JSON.stringify(selector)});
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for canvas: ' + ${JSON.stringify(selector)});
  if (${isFill}) {
    ctx.fillStyle = ${colorExpr};
    ctx.fillRect(${x}, ${y}, ${width}, ${height});
  } else {
    ctx.strokeStyle = ${colorExpr};
    ctx.strokeRect(${x}, ${y}, ${width}, ${height});
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function canvasEquals(
  client: CdpClient,
  selector1: string,
  selector2: string,
): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const c1 = document.querySelector(${JSON.stringify(selector1)});
  if (!c1) throw new Error('Canvas not found: ' + ${JSON.stringify(selector1)});
  const c2 = document.querySelector(${JSON.stringify(selector2)});
  if (!c2) throw new Error('Canvas not found: ' + ${JSON.stringify(selector2)});
  return c1.toDataURL('image/png') === c2.toDataURL('image/png');
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}
