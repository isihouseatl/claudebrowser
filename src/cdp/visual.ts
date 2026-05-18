// src/cdp/visual.ts
import { CdpClient } from './client';

// Get the visual stacking order (z-index) for the first element matching a selector.
// Returns the numeric z-index, or 'auto' if none is set.
export async function getZIndex(
  client: CdpClient,
  selector: string,
): Promise<number | 'auto'> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Not found: ' + ${JSON.stringify(selector)});
  const z = window.getComputedStyle(el).getPropertyValue('z-index');
  return z === 'auto' ? 'auto' : parseInt(z, 10);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number | 'auto';
}

// Element info returned by getElementsAtPoint
export interface ElementAtPoint {
  tag: string;
  id: string;
  className: string;
  zIndex: string;
  rect: { x: number; y: number; w: number; h: number };
}

// Find all elements that overlap at a given (x, y) coordinate.
// Returns elements from back to front (lowest z-index first).
export async function getElementsAtPoint(
  client: CdpClient,
  x: number,
  y: number,
): Promise<ElementAtPoint[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = document.elementsFromPoint(${x}, ${y});
  return elements.map(el => {
    const rect = el.getBoundingClientRect();
    const zIndex = window.getComputedStyle(el).getPropertyValue('z-index');
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: el.className || '',
      zIndex: zIndex,
      rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    };
  }).reverse();
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as ElementAtPoint[];
}

// Pixel color returned by getPixelColor
export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Get the color at (x, y) by querying the computed backgroundColor of the topmost
// element at that point. Parses rgb()/rgba() strings into {r, g, b, a}.
// Falls back to {r:0, g:0, b:0, a:0} if no element is found or color is transparent.
export async function getPixelColor(
  client: CdpClient,
  x: number,
  y: number,
): Promise<PixelColor> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.elementFromPoint(${x}, ${y});
  if (!el) return { r: 0, g: 0, b: 0, a: 0 };
  const style = window.getComputedStyle(el);
  const color = style.getPropertyValue('background-color') || style.getPropertyValue('color');
  if (!color) return { r: 0, g: 0, b: 0, a: 0 };
  const match = color.match(/rgba?\\(\\s*(\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)(?:[,\\s\\/]+([\\d.]+))?\\s*\\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 0 };
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? Math.round(parseFloat(match[4]) * 255) : 255;
  return { r, g, b, a };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as PixelColor;
}

// Color info returned for one element by getColors
export interface ElementColors {
  color: string;
  backgroundColor: string;
  borderColor: string;
}

// Get all computed colors used by elements matching a selector.
// Returns one entry per matched element.
export async function getColors(
  client: CdpClient,
  selector: string,
): Promise<ElementColors[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
  return elements.map(el => {
    const style = window.getComputedStyle(el);
    return {
      color: style.getPropertyValue('color'),
      backgroundColor: style.getPropertyValue('background-color'),
      borderColor: style.getPropertyValue('border-color'),
    };
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as ElementColors[];
}

// Highlight an element by selector by injecting a style tag with an outline.
// Returns a unique styleId string that can be passed to removeInjectedCss (from dom.ts)
// or to removeHighlight to undo the highlight.
export async function highlightElement(
  client: CdpClient,
  selector: string,
  color = '#ff3b30',
): Promise<string> {
  const styleId = `cb-hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const attrName = `data-${styleId}`;
  const css = `[${attrName}] { outline: 3px solid ${color} !important; outline-offset: 2px !important; }`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Not found: ' + ${JSON.stringify(selector)});
  el.setAttribute(${JSON.stringify(attrName)}, '');
  const style = document.createElement('style');
  style.id = ${JSON.stringify(styleId)};
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return styleId;
}

// Remove a highlight previously applied by highlightElement.
// styleId is the value returned by highlightElement.
export async function removeHighlight(client: CdpClient, styleId: string): Promise<void> {
  const attrName = `data-${styleId}`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const style = document.getElementById(${JSON.stringify(styleId)});
  if (style) style.remove();
  const el = document.querySelector(${JSON.stringify('[' + attrName + ']')});
  if (el) el.removeAttribute(${JSON.stringify(attrName)});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Check if two elements overlap visually (their bounding boxes intersect).
export async function doElementsOverlap(
  client: CdpClient,
  selector1: string,
  selector2: string,
): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const a = document.querySelector(${JSON.stringify(selector1)});
  const b = document.querySelector(${JSON.stringify(selector2)});
  if (!a) throw new Error('Not found: ' + ${JSON.stringify(selector1)});
  if (!b) throw new Error('Not found: ' + ${JSON.stringify(selector2)});
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  return !(
    ra.right < rb.left ||
    rb.right < ra.left ||
    ra.bottom < rb.top ||
    rb.bottom < ra.top
  );
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

// Font info returned by getFontInfo
export interface FontInfo {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
}

// Get the computed font information for the first element matching a selector.
export async function getFontInfo(client: CdpClient, selector: string): Promise<FontInfo> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Not found: ' + ${JSON.stringify(selector)});
  const style = window.getComputedStyle(el);
  return {
    fontFamily: style.getPropertyValue('font-family'),
    fontSize: style.getPropertyValue('font-size'),
    fontWeight: style.getPropertyValue('font-weight'),
    lineHeight: style.getPropertyValue('line-height'),
    letterSpacing: style.getPropertyValue('letter-spacing'),
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as FontInfo;
}
