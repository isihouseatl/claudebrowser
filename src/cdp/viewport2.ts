// src/cdp/viewport2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * Get current scroll position of the page.
 * Returns JSON { x, y }.
 */
export async function getScrollPosition(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ x: window.scrollX, y: window.scrollY })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

/**
 * Get viewport dimensions.
 * Returns JSON { width, height }.
 */
export async function getViewportSize(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ width: window.innerWidth, height: window.innerHeight })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

/**
 * Get full document size.
 * Returns JSON { width, height }.
 */
export async function getDocumentSize(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

/**
 * Scroll the page to absolute coordinates (x, y).
 */
export async function scrollTo(
  client: CdpClient,
  x: number,
  y: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo(${x}, ${y})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('Scrolled to ' + x + ',' + y);
}

/**
 * Scroll the page by a relative offset (x, y).
 */
export async function scrollBy(
  client: CdpClient,
  x: number,
  y: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollBy(${x}, ${y})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('Scrolled by ' + x + ',' + y);
}

/**
 * Scroll the element matching selector into view (smooth, centered).
 */
export async function scrollToElement(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === false) {
    return err('Element not found: ' + selector);
  }
  return ok('Scrolled to element: ' + selector);
}

/**
 * Get scroll position properties of the element matching selector.
 * Returns JSON { scrollTop, scrollLeft, scrollWidth, scrollHeight }.
 */
export async function getElementScrollPosition(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return null;
  return JSON.stringify({
    scrollTop: el.scrollTop,
    scrollLeft: el.scrollLeft,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value as string);
}

/**
 * Check whether the element matching selector is visible in the viewport.
 * Returns JSON { inViewport: boolean, ratio: number } where ratio is the
 * fraction (0-1) of the element currently within the viewport bounds.
 */
export async function isElementInViewport(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const elArea = rect.width * rect.height;
  let ratio = 0;
  if (elArea > 0) {
    const ixLeft = Math.max(rect.left, 0);
    const ixTop = Math.max(rect.top, 0);
    const ixRight = Math.min(rect.right, vw);
    const ixBottom = Math.min(rect.bottom, vh);
    const ixW = ixRight - ixLeft;
    const ixH = ixBottom - ixTop;
    if (ixW > 0 && ixH > 0) ratio = (ixW * ixH) / elArea;
  }
  return JSON.stringify({ inViewport: ratio > 0, ratio });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found: ' + selector);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// Legacy exports — used by server.ts via ok() wrapper. Preserved for compat.
// ---------------------------------------------------------------------------

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
 * Return what fraction (0-1) of the element is currently visible in the viewport.
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
 * Find elements that are fully outside the viewport.
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
      const classes = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
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
 * Find elements where scrollWidth > clientWidth or scrollHeight > clientHeight.
 * Returns top 10 with selector and scroll dimensions.
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
      const classes = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
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

// ---------------------------------------------------------------------------
// Viewport2 extended inspection functions (scroll, visibility, layout)
// Naming notes:
//   getScrollPositionFull — getScrollPosition already exported above (basic x/y only)
// ---------------------------------------------------------------------------

/**
 * getScrollPositionFull — Get current scroll position and max scroll extents.
 * Returns { scrollX, scrollY, maxScrollX, maxScrollY, scrollPercentX, scrollPercentY }.
 * (Renamed from getScrollPosition to avoid collision with the basic export above.)
 */
export async function getScrollPositionFull(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var maxX = Math.max(document.documentElement.scrollWidth - window.innerWidth, 0);
  var maxY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  return { scrollX: window.scrollX, scrollY: window.scrollY, maxScrollX: maxX, maxScrollY: maxY, scrollPercentX: maxX ? Math.round(window.scrollX/maxX*100) : 0, scrollPercentY: maxY ? Math.round(window.scrollY/maxY*100) : 0 };
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getViewportDimensions — Get viewport size vs document size and device pixel ratio.
 * Returns { viewportWidth, viewportHeight, documentWidth, documentHeight, devicePixelRatio }.
 */
export async function getViewportDimensions(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  return { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, devicePixelRatio: window.devicePixelRatio };
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getElementsInViewport — Find elements currently visible in viewport (max 30).
 * Returns { elements: [{ tag, id, class }], count }.
 */
export async function getElementsInViewport(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  var vw = window.innerWidth, vh = window.innerHeight;
  for (var i = 0; i < all.length && result.length < 30; i++) {
    var r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0) {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, class: (all[i].className||'').slice(0,30) });
    }
  }
  return { elements: result, count: result.length };
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getAboveTheFold — Find elements fully above the fold (max 20).
 * Returns array of { tag, id, text }.
 */
export async function getAboveTheFold(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('h1,h2,h3,p,button,a,img');
  var vh = window.innerHeight;
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var r = all[i].getBoundingClientRect();
    if (r.bottom < vh && r.height > 0) result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, text: all[i].textContent.trim().slice(0,60) });
  }
  return result;
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getOffscreenElements — Find elements positioned outside viewport bounds (max 20).
 * Returns array of { tag, id, top, left }.
 */
export async function getOffscreenElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  var vw = window.innerWidth, vh = window.innerHeight;
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh)) {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, top: Math.round(r.top), left: Math.round(r.left) });
    }
  }
  return result;
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getStickyElements — Find elements with position:sticky or position:fixed (max 20).
 * Returns array of { tag, id, class, position }.
 */
export async function getStickyElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var p = getComputedStyle(all[i]).position;
    if (p === 'sticky' || p === 'fixed') result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, class: (all[i].className||'').slice(0,30), position: p });
  }
  return result;
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getOverflowContainers — Find elements with overflow:scroll or overflow:auto
 * that have scrollable content (max 20).
 * Returns array of { tag, id, scrollHeight, clientHeight }.
 */
export async function getOverflowContainers(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    var ov = s.overflow + s.overflowY;
    if ((ov.includes('scroll') || ov.includes('auto')) && all[i].scrollHeight > all[i].clientHeight + 5) {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, scrollHeight: all[i].scrollHeight, clientHeight: all[i].clientHeight });
    }
  }
  return result;
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getZIndexStack — Find elements with explicit z-index set, sorted descending (max 20).
 * Returns array of { tag, id, zIndex }.
 */
export async function getZIndexStack(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length; i++) {
    var z = parseInt(getComputedStyle(all[i]).zIndex);
    if (!isNaN(z) && z !== 0) result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, zIndex: z });
  }
  result.sort(function(a,b) { return b.zIndex - a.zIndex; });
  return result.slice(0,20);
})()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
