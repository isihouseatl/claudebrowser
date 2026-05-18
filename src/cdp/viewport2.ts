// src/cdp/viewport2.ts
import { CdpClient } from './client';

/**
 * Return document root and window dimensions.
 */
export async function getFullPageDimensions(
  client: CdpClient,
): Promise<{
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  innerWidth: number;
  innerHeight: number;
}> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  clientWidth: document.documentElement.clientWidth,
  clientHeight: document.documentElement.clientHeight,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
}))()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as {
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
    innerWidth: number;
    innerHeight: number;
  };
}

/**
 * Return the currently visible area of the page as an absolute rect.
 */
export async function getVisibleRect(
  client: CdpClient,
): Promise<{
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => ({
  left: window.scrollX,
  top: window.scrollY,
  right: window.scrollX + window.innerWidth,
  bottom: window.scrollY + window.innerHeight,
  width: window.innerWidth,
  height: window.innerHeight,
}))()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
}

/**
 * Check that all 4 corners of the element's bounding rect are within the viewport.
 */
export async function isElementFullyVisible(
  client: CdpClient,
  selector: string,
): Promise<boolean> {
  const selLiteral = JSON.stringify(selector);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as boolean;
}

/**
 * Return what fraction (0–1) of the element is currently visible in the viewport.
 * Computes intersection area of element rect and viewport rect divided by element area.
 */
export async function getElementVisibilityRatio(
  client: CdpClient,
  selector: string,
): Promise<number> {
  const selLiteral = JSON.stringify(selector);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const elArea = rect.width * rect.height;
  if (elArea === 0) return 0;
  const ixLeft = Math.max(rect.left, 0);
  const ixTop = Math.max(rect.top, 0);
  const ixRight = Math.min(rect.right, window.innerWidth);
  const ixBottom = Math.min(rect.bottom, window.innerHeight);
  const ixWidth = ixRight - ixLeft;
  const ixHeight = ixBottom - ixTop;
  if (ixWidth <= 0 || ixHeight <= 0) return 0;
  return (ixWidth * ixHeight) / elArea;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as number;
}

/**
 * Find elements (excluding html/body/script/style/meta) that are fully outside the viewport.
 * Returns up to 20 results with a CSS-like selector and direction.
 */
export async function getOffScreenElements(
  client: CdpClient,
): Promise<Array<{ selector: string; direction: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const excluded = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'META', 'HEAD', 'LINK', 'NOSCRIPT']);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const results = [];
  const all = document.querySelectorAll('*');
  for (let i = 0; i < all.length && results.length < 20; i++) {
    const el = all[i];
    if (excluded.has(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    let direction = null;
    if (rect.right <= 0) direction = 'left';
    else if (rect.left >= vw) direction = 'right';
    else if (rect.bottom <= 0) direction = 'above';
    else if (rect.top >= vh) direction = 'below';
    if (!direction) continue;
    let sel = el.tagName.toLowerCase();
    if (el.id) {
      sel = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      sel = el.tagName.toLowerCase() + '.' + classes;
    }
    results.push({ selector: sel, direction });
  }
  return results;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as Array<{ selector: string; direction: string }>;
}

/**
 * Scroll the page to absolute coordinates.
 */
export async function scrollPageTo(
  client: CdpClient,
  x: number,
  y: number,
  behavior: 'instant' | 'smooth' = 'instant',
): Promise<void> {
  const behaviorLiteral = JSON.stringify(behavior);

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo({ left: ${x}, top: ${y}, behavior: ${behaviorLiteral} })`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

/**
 * Find elements where scrollWidth > clientWidth or scrollHeight > clientHeight,
 * excluding html/body. Returns top 10 with selector and scroll dimensions.
 */
export async function getScrollableElements(
  client: CdpClient,
): Promise<Array<{ selector: string; scrollWidth: number; scrollHeight: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const excluded = new Set(['HTML', 'BODY']);
  const results = [];
  const all = document.querySelectorAll('*');
  for (let i = 0; i < all.length && results.length < 10; i++) {
    const el = all[i];
    if (excluded.has(el.tagName)) continue;
    const sw = el.scrollWidth;
    const sh = el.scrollHeight;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (sw <= cw && sh <= ch) continue;
    let sel = el.tagName.toLowerCase();
    if (el.id) {
      sel = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      sel = el.tagName.toLowerCase() + '.' + classes;
    }
    results.push({ selector: sel, scrollWidth: sw, scrollHeight: sh });
  }
  return results;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as Array<{ selector: string; scrollWidth: number; scrollHeight: number }>;
}

/**
 * Return the scroll state for a specific element identified by CSS selector.
 */
export async function getElementScrollPosition(
  client: CdpClient,
  selector: string,
): Promise<{
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
}> {
  const selLiteral = JSON.stringify(selector);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Element not found: ' + ${selLiteral});
  return {
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
  };
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
  };
}
