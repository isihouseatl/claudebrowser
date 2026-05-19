// src/cdp/scroll3.ts
import { CdpClient } from './client';

/**
 * Return how far the page is scrolled.
 * pixels = window.scrollY
 * percent = scrollY / (scrollHeight - innerHeight) * 100, clamped to 0-100.
 */
export async function getScrollDepth(
  client: CdpClient,
): Promise<{ pixels: number; percent: number }> {
  const expression = `(() => {
  const scrollY = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight;
  const innerHeight = window.innerHeight;
  const range = scrollHeight - innerHeight;
  const percent = range <= 0 ? 0 : Math.min(100, Math.max(0, (scrollY / range) * 100));
  return { pixels: scrollY, percent };
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `getScrollDepth: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value as { pixels: number; percent: number };
}

/**
 * Return true if the page is scrolled to the bottom (within 2px tolerance).
 */
export async function isScrolledToBottom(client: CdpClient): Promise<boolean> {
  const expression = `(() => {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `isScrolledToBottom: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value as boolean;
}

/**
 * Return true if the page is scrolled to the top (within 2px tolerance).
 */
export async function isScrolledToTop(client: CdpClient): Promise<boolean> {
  const expression = `window.scrollY <= 2`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `isScrolledToTop: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value as boolean;
}

/**
 * Walk up the DOM from the element matching selector to find the nearest ancestor
 * with CSS overflow scroll or auto. Returns a CSS selector string for that ancestor,
 * or null if none is found before reaching the document root.
 *
 * The returned selector is built as: tagName + nth-of-type index, which is unique
 * enough for programmatic use within the same page context.
 */
export async function getScrollableParent(
  client: CdpClient,
  selector: string,
): Promise<string | null> {
  const selLiteral = JSON.stringify(selector);

  const expression = `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return null;
  let node = el.parentElement;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    if (overflowY === 'scroll' || overflowY === 'auto' ||
        overflowX === 'scroll' || overflowX === 'auto') {
      const tag = node.tagName.toLowerCase();
      const siblings = Array.from(node.parentElement
        ? node.parentElement.querySelectorAll(':scope > ' + tag)
        : document.querySelectorAll(tag));
      const idx = siblings.indexOf(node) + 1;
      return tag + ':nth-of-type(' + idx + ')';
    }
    node = node.parentElement;
  }
  return null;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `getScrollableParent: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value as string | null;
}

/**
 * Scroll the page by (x, y) pixels relative to the current scroll position.
 */
export async function scrollByAmount(
  client: CdpClient,
  x: number,
  y: number,
): Promise<void> {
  const expression = `window.scrollBy(${x}, ${y})`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `scrollByAmount: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

/**
 * Scroll the element matching selector by (x, y) pixels using element.scrollBy().
 * Throws if the element is not found.
 */
export async function scrollElementBy(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);

  const expression = `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Element not found: ' + ${selLiteral});
  el.scrollBy(${x}, ${y});
})()`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `scrollElementBy: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

/**
 * Measure the width of the browser scrollbar by comparing window.innerWidth
 * against document.documentElement.clientWidth. Returns 0 if no scrollbar
 * is visible (e.g. overlay scrollbars on macOS).
 */
export async function getScrollbarWidth(client: CdpClient): Promise<number> {
  const expression = `window.innerWidth - document.documentElement.clientWidth`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `getScrollbarWidth: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value as number;
}

/**
 * Scroll to a percentage of the total scrollable page height.
 * percent=0 scrolls to the top, percent=100 scrolls to the bottom.
 * Values are clamped to [0, 100].
 */
export async function scrollToPercent(
  client: CdpClient,
  percent: number,
): Promise<void> {
  const clamped = Math.min(100, Math.max(0, percent));

  const expression = `(() => {
  const scrollHeight = document.documentElement.scrollHeight;
  const innerHeight = window.innerHeight;
  const range = scrollHeight - innerHeight;
  const target = range <= 0 ? 0 : range * ${clamped} / 100;
  window.scrollTo(0, target);
})()`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    throw new Error(
      `scrollToPercent: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Scroll behavior and position detection (8 functions — cdp: any pattern)
// Names with numeric suffixes reflect conflicts found in server.ts imports.
// getScrollPosition5 (1-4 taken), getScrollableElements3 (1-2 taken),
// getScrollDepth3 (1-2 taken). All others are suffix-free.
// ---------------------------------------------------------------------------

/**
 * Current scroll position of the window and up to 20 scrollable containers.
 * (suffix 5: getScrollPosition through getScrollPosition4 already imported)
 */
export async function getScrollPosition5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var win = {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight
  };
  var containers = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && containers.length < 20; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    var ox = st.overflowX, oy = st.overflowY;
    if ((ox === 'scroll' || ox === 'auto' || oy === 'scroll' || oy === 'auto') &&
        (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
      containers.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,3).join(' ') : null,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight
      });
    }
  }
  return { window: win, containers: containers };
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Elements that are scrollable (overflow scroll/auto) — up to 20 results.
 * (suffix 3: getScrollableElements and getScrollableElements2 already imported)
 */
export async function getScrollableElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    var ox = st.overflowX, oy = st.overflowY;
    if (ox === 'scroll' || ox === 'auto' || oy === 'scroll' || oy === 'auto') {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,3).join(' ') : null,
        overflowX: ox,
        overflowY: oy,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        hasScroll: el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Elements with scroll-behavior CSS or inline scroll event listeners detected
 * via attribute inspection. Returns up to 20 results.
 */
export async function getScrollBehavior(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    var behavior = st.scrollBehavior;
    var hasInlineHandler = typeof el.onscroll === 'function';
    var hasAttr = el.hasAttribute('onscroll');
    if (behavior === 'smooth' || hasInlineHandler || hasAttr) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,3).join(' ') : null,
        scrollBehavior: behavior,
        hasInlineScrollHandler: hasInlineHandler,
        hasOnScrollAttribute: hasAttr
      });
    }
  }
  var htmlBehavior = window.getComputedStyle(document.documentElement).scrollBehavior;
  return { elements: results, htmlScrollBehavior: htmlBehavior };
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Containers with scroll-snap-type set — up to 20 results.
 */
export async function getScrollSnapContainers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    var snapType = st.scrollSnapType;
    if (snapType && snapType !== 'none') {
      var children = Array.from(el.children).slice(0, 5).map(function(c) {
        var cs = window.getComputedStyle(c);
        return {
          tag: c.tagName.toLowerCase(),
          snapAlign: cs.scrollSnapAlign,
          snapStop: cs.scrollSnapStop
        };
      });
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,3).join(' ') : null,
        scrollSnapType: snapType,
        scrollPaddingTop: st.scrollPaddingTop,
        scrollPaddingBottom: st.scrollPaddingBottom,
        childCount: el.children.length,
        sampleChildren: children
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Custom scrollbar elements or elements with scrollbar-width CSS set.
 * Also detects common custom scrollbar class patterns. Up to 20 results.
 */
export async function getScrollbarElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var scrollbarPatterns = /scrollbar|scroll-bar|custom-scroll|ps-scrollbar|simplebar|perfect-scroll|os-scrollbar/i;
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var cn = (el.className && typeof el.className === 'string') ? el.className : '';
    var id = el.id || '';
    var st = window.getComputedStyle(el);
    var sbWidth = st.scrollbarWidth;
    var hasCustomClass = scrollbarPatterns.test(cn) || scrollbarPatterns.test(id);
    var hasScrollbarWidth = sbWidth && sbWidth !== 'auto';
    if (hasCustomClass || hasScrollbarWidth) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: id || null,
        className: cn.trim().split(/\s+/).slice(0,5).join(' ') || null,
        scrollbarWidth: sbWidth || null,
        scrollbarColor: st.scrollbarColor || null,
        isCustomClass: hasCustomClass
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Elements likely used as infinite scroll sentinels — small elements near the
 * bottom of scrollable containers, or elements with sentinel/observer-related
 * class/id names. Up to 20 results.
 */
export async function getInfiniteScrollTriggers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var results = [];
  var sentinelPattern = /sentinel|infinite|load-more|waypoint|observer|trigger|bottom-marker|scroll-trigger|end-of/i;
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && results.length < 20; i++) {
    var el = all[i];
    var cn = (el.className && typeof el.className === 'string') ? el.className : '';
    var id = el.id || '';
    var dataAttrs = Array.from(el.attributes)
      .filter(function(a) { return a.name.startsWith('data-'); })
      .map(function(a) { return a.name; });
    var nameMatch = sentinelPattern.test(cn) || sentinelPattern.test(id) ||
      dataAttrs.some(function(a) { return sentinelPattern.test(a); });
    var rect = el.getBoundingClientRect();
    var isSmallAndLow = rect.height <= 4 && rect.width > 0 &&
      (rect.top + window.scrollY) > (document.documentElement.scrollHeight * 0.7);
    if (nameMatch || isSmallAndLow) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: id || null,
        className: cn.trim().split(/\s+/).slice(0,5).join(' ') || null,
        dataAttributes: dataAttrs.slice(0,5),
        rect: { top: Math.round(rect.top), height: Math.round(rect.height), width: Math.round(rect.width) },
        matchReason: nameMatch ? 'name-pattern' : 'small-low-element'
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Estimated scroll depth percentage for the window and up to 10 scrollable containers.
 * (suffix 3: getScrollDepth and getScrollDepth2 already imported)
 */
export async function getScrollDepth3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var winRange = document.documentElement.scrollHeight - window.innerHeight;
  var winDepth = winRange <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / winRange) * 100));
  var containers = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length && containers.length < 10; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    var oy = st.overflowY;
    if ((oy === 'scroll' || oy === 'auto') && el.scrollHeight > el.clientHeight) {
      var range = el.scrollHeight - el.clientHeight;
      var pct = range <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / range) * 100));
      containers.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,3).join(' ') : null,
        scrollDepthPercent: pct,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      });
    }
  }
  return {
    windowScrollDepthPercent: winDepth,
    windowScrollY: window.scrollY,
    windowScrollHeight: document.documentElement.scrollHeight,
    windowInnerHeight: window.innerHeight,
    containers: containers
  };
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

/**
 * Detected scroll patterns on the page: hasScrollSnap, hasInfiniteScroll,
 * hasSmoothScroll, hasVirtualScroll.
 */
export async function getScrollApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var hasScrollSnap = false;
  var hasSmoothScroll = false;
  var hasVirtualScroll = false;
  var infinitePatterns = /sentinel|infinite|load-more|waypoint|observer|scroll-trigger/i;
  var virtualPatterns = /virtual-list|virtual-scroll|cdk-virtual|react-window|react-virtual|RecyclerView/i;
  var hasInfiniteScroll = false;
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var st = window.getComputedStyle(el);
    if (!hasScrollSnap && st.scrollSnapType && st.scrollSnapType !== 'none') hasScrollSnap = true;
    if (!hasSmoothScroll && st.scrollBehavior === 'smooth') hasSmoothScroll = true;
    var cn = (el.className && typeof el.className === 'string') ? el.className : '';
    var id = el.id || '';
    if (!hasInfiniteScroll && (infinitePatterns.test(cn) || infinitePatterns.test(id))) hasInfiniteScroll = true;
    if (!hasVirtualScroll && (virtualPatterns.test(cn) || virtualPatterns.test(id))) hasVirtualScroll = true;
    if (hasScrollSnap && hasSmoothScroll && hasInfiniteScroll && hasVirtualScroll) break;
  }
  var htmlST = window.getComputedStyle(document.documentElement);
  if (!hasSmoothScroll && htmlST.scrollBehavior === 'smooth') hasSmoothScroll = true;
  var scrollYAvailable = typeof window.scrollY !== 'undefined';
  var scrollToAvailable = typeof window.scrollTo === 'function';
  var scrollByAvailable = typeof window.scrollBy === 'function';
  var smoothScrollToAvailable = false;
  try { window.scrollTo({ top: window.scrollY, behavior: 'smooth' }); smoothScrollToAvailable = true; } catch(e) {}
  return {
    hasScrollSnap: hasScrollSnap,
    hasInfiniteScroll: hasInfiniteScroll,
    hasSmoothScroll: hasSmoothScroll,
    hasVirtualScroll: hasVirtualScroll,
    scrollYAvailable: scrollYAvailable,
    scrollToAvailable: scrollToAvailable,
    scrollByAvailable: scrollByAvailable,
    smoothScrollToAvailable: smoothScrollToAvailable
  };
})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
