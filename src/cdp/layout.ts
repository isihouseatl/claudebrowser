// src/cdp/layout.ts
import { CdpClient } from './client';

export interface ViewportElement {
  tagName: string;
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
}

export interface RelativePosition {
  direction: 'above' | 'below' | 'left' | 'right' | 'overlapping';
  distancePx: number;
}

export interface PageDimensions {
  scrollWidth: number;
  scrollHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

// Get all elements currently visible in the viewport (max 50 results).
// Filters to elements with width > 10 and height > 10 that intersect the viewport.
// Returns tagName, a best-effort CSS selector, position, size, and short innerText.
export async function getViewportElements(client: CdpClient): Promise<ViewportElement[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const all = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of all) {
    if (results.length >= 50) break;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 10 || rect.height <= 10) continue;
    // Check intersection with viewport
    if (rect.right < 0 || rect.bottom < 0 || rect.left > vw || rect.top > vh) continue;
    // Build a best-effort selector
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const first = el.className.trim().split(/\\s+/)[0];
      selector = el.tagName.toLowerCase() + '.' + first;
    }
    const rawText = el.innerText;
    const text = (rawText && rawText.trim().length > 0 && rawText.trim().length < 100)
      ? rawText.trim()
      : undefined;
    const entry = {
      tagName: el.tagName.toLowerCase(),
      selector,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    if (text !== undefined) entry.text = text;
    results.push(entry);
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as ViewportElement[];
}

// Check if an element is fully within the current viewport.
export async function isInViewport(client: CdpClient, selector: string): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as boolean;
}

// Return the center coordinates of an element (viewport-relative).
export async function getElementCenter(client: CdpClient, selector: string): Promise<{ x: number; y: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as { x: number; y: number };
}

// Return the position of selector1 relative to selector2.
// direction is from selector1's perspective (e.g. 'above' means selector1 is above selector2).
// distancePx is the gap between bounding boxes; 0 when overlapping.
export async function getRelativePosition(
  client: CdpClient,
  selector1: string,
  selector2: string,
): Promise<RelativePosition> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el1 = document.querySelector(${JSON.stringify(selector1)});
  const el2 = document.querySelector(${JSON.stringify(selector2)});
  if (!el1) return { error: 'not-found-1' };
  if (!el2) return { error: 'not-found-2' };
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();

  // Check overlap
  const overlapX = r1.left < r2.right && r1.right > r2.left;
  const overlapY = r1.top < r2.bottom && r1.bottom > r2.top;
  if (overlapX && overlapY) {
    return { direction: 'overlapping', distancePx: 0 };
  }

  // Compute per-axis gaps
  const gapBelow = r2.top - r1.bottom;   // positive when r1 is above r2
  const gapAbove = r1.top - r2.bottom;   // positive when r1 is below r2
  const gapRight = r2.left - r1.right;   // positive when r1 is left of r2
  const gapLeft  = r1.left - r2.right;   // positive when r1 is right of r2

  // Primary axis: whichever axis has the larger positive gap wins
  const vertGap = Math.max(gapBelow, gapAbove, 0);
  const horizGap = Math.max(gapRight, gapLeft, 0);

  if (vertGap >= horizGap) {
    if (gapBelow > gapAbove) {
      return { direction: 'above', distancePx: Math.round(gapBelow) };
    } else {
      return { direction: 'below', distancePx: Math.round(gapAbove) };
    }
  } else {
    if (gapRight > gapLeft) {
      return { direction: 'left', distancePx: Math.round(gapRight) };
    } else {
      return { direction: 'right', distancePx: Math.round(gapLeft) };
    }
  }
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as { direction?: string; distancePx?: number; error?: string };
  if (val.error === 'not-found-1') throw new Error(`Element not found: ${selector1}`);
  if (val.error === 'not-found-2') throw new Error(`Element not found: ${selector2}`);
  return val as RelativePosition;
}

// Find all elements whose bounding box intersects a given rectangular region (max 20 results).
export async function getElementsInRegion(
  client: CdpClient,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<ViewportElement[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const rx = ${x}, ry = ${y}, rw = ${width}, rh = ${height};
  const all = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of all) {
    if (results.length >= 20) break;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    // Check intersection
    if (rect.right < rx || rect.bottom < ry || rect.left > rx + rw || rect.top > ry + rh) continue;
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const first = el.className.trim().split(/\\s+/)[0];
      selector = el.tagName.toLowerCase() + '.' + first;
    }
    const rawText = el.innerText;
    const text = (rawText && rawText.trim().length > 0 && rawText.trim().length < 100)
      ? rawText.trim()
      : undefined;
    const entry = {
      tagName: el.tagName.toLowerCase(),
      selector,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    if (text !== undefined) entry.text = text;
    results.push(entry);
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as ViewportElement[];
}

// Return full page and viewport dimensions plus device pixel ratio.
export async function getPageDimensions(client: CdpClient): Promise<PageDimensions> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `({
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as PageDimensions;
}

// Return the cumulative layout shift (CLS) score.
// Sums entry.value for all layout-shift entries where hadRecentInput is false.
export async function getLayoutShift(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const entries = performance.getEntriesByType('layout-shift');
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((sum, entry) => {
    return entry.hadRecentInput ? sum : sum + entry.value;
  }, 0);
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as number) ?? 0;
}

// Return element position relative to the document (accounts for scroll offset).
export async function getAbsolutePosition(
  client: CdpClient,
  selector: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as { x: number; y: number; width: number; height: number };
}
