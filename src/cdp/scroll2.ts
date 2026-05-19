// src/cdp/scroll2.ts
import type { CdpClient } from './client';

export interface ScrollState {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
  atBottom: boolean;
  atTop: boolean;
  atRight: boolean;
  atLeft: boolean;
}

/**
 * Scroll down the page until the element matching selector comes into the viewport.
 * Returns true if element became visible, false if maxScrolls exceeded.
 */
export async function scrollUntilVisible(
  client: CdpClient,
  selector: string,
  maxScrolls = 20,
  scrollAmount = 300,
): Promise<boolean> {
  const selLiteral = JSON.stringify(selector);

  for (let i = 0; i < maxScrolls; i++) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }

    if (result.value === true) {
      return true;
    }

    await client.raw.Runtime.evaluate({
      expression: `window.scrollBy(0, ${scrollAmount})`,
      returnByValue: true,
    });
  }

  return false;
}

/**
 * Scroll down until any element's textContent contains the given text.
 * Returns true if text found, false if maxScrolls exceeded.
 */
export async function scrollUntilText(
  client: CdpClient,
  text: string,
  maxScrolls = 30,
): Promise<boolean> {
  const textLiteral = JSON.stringify(text);

  for (let i = 0; i < maxScrolls; i++) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.body.innerText.includes(${textLiteral})`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }

    if (result.value === true) {
      return true;
    }

    await client.raw.Runtime.evaluate({
      expression: `window.scrollBy(0, 300)`,
      returnByValue: true,
    });
  }

  return false;
}

/**
 * Scroll an overflow container element (not the page) by amount pixels in the given direction.
 */
export async function scrollContainer(
  client: CdpClient,
  containerSelector: string,
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number,
): Promise<void> {
  const selLiteral = JSON.stringify(containerSelector);

  let scrollExpr: string;
  if (direction === 'down') {
    scrollExpr = `el.scrollTop += ${amount}`;
  } else if (direction === 'up') {
    scrollExpr = `el.scrollTop -= ${amount}`;
  } else if (direction === 'right') {
    scrollExpr = `el.scrollLeft += ${amount}`;
  } else {
    scrollExpr = `el.scrollLeft -= ${amount}`;
  }

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Container not found: ' + ${selLiteral});
  ${scrollExpr};
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

/**
 * Scroll a container element all the way to an edge.
 */
export async function scrollContainerToEnd(
  client: CdpClient,
  containerSelector: string,
  direction: 'bottom' | 'top' | 'right' | 'left',
): Promise<void> {
  const selLiteral = JSON.stringify(containerSelector);

  let scrollExpr: string;
  if (direction === 'bottom') {
    scrollExpr = `el.scrollTop = el.scrollHeight`;
  } else if (direction === 'top') {
    scrollExpr = `el.scrollTop = 0`;
  } else if (direction === 'right') {
    scrollExpr = `el.scrollLeft = el.scrollWidth`;
  } else {
    scrollExpr = `el.scrollLeft = 0`;
  }

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Container not found: ' + ${selLiteral});
  ${scrollExpr};
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

/**
 * Get the scroll state of an overflow container element.
 */
export async function getContainerScrollState(
  client: CdpClient,
  containerSelector: string,
): Promise<ScrollState> {
  const selLiteral = JSON.stringify(containerSelector);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Container not found: ' + ${selLiteral});
  const scrollTop = el.scrollTop;
  const scrollLeft = el.scrollLeft;
  const scrollHeight = el.scrollHeight;
  const scrollWidth = el.scrollWidth;
  const clientHeight = el.clientHeight;
  const clientWidth = el.clientWidth;
  return {
    scrollTop,
    scrollLeft,
    scrollHeight,
    scrollWidth,
    clientHeight,
    clientWidth,
    atBottom: Math.abs(scrollTop + clientHeight - scrollHeight) <= 1,
    atTop: scrollTop === 0,
    atRight: Math.abs(scrollLeft + clientWidth - scrollWidth) <= 1,
    atLeft: scrollLeft === 0,
  };
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as ScrollState;
}

/**
 * Keep clicking a "Load More" / infinite scroll trigger until a stop condition JS expression
 * becomes true. Returns true if stop condition met, false if maxClicks exceeded.
 */
export async function infiniteScrollUntil(
  client: CdpClient,
  triggerSelector: string,
  stopCondition: string,
  maxClicks = 10,
): Promise<boolean> {
  const selLiteral = JSON.stringify(triggerSelector);

  for (let i = 0; i < maxClicks; i++) {
    // Check stop condition before clicking
    const { result: condResult, exceptionDetails: condErr } = await client.raw.Runtime.evaluate({
      expression: `!!(${stopCondition})`,
      returnByValue: true,
    });

    if (condErr) {
      throw new Error(`JS error in stopCondition: ${condErr.exception?.description ?? condErr.text}`);
    }

    if (condResult.value === true) {
      return true;
    }

    // Click the trigger
    const { exceptionDetails: clickErr } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Trigger not found: ' + ${selLiteral});
  el.click();
})()`,
      returnByValue: true,
    });

    if (clickErr) {
      throw new Error(`JS error clicking trigger: ${clickErr.exception?.description ?? clickErr.text}`);
    }

    // Wait 1000ms for content to load
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
  }

  // Final check after last click
  const { result: finalResult, exceptionDetails: finalErr } = await client.raw.Runtime.evaluate({
    expression: `!!(${stopCondition})`,
    returnByValue: true,
  });

  if (finalErr) {
    throw new Error(`JS error in stopCondition: ${finalErr.exception?.description ?? finalErr.text}`);
  }

  return finalResult.value === true;
}

/**
 * Smoothly scroll the page to absolute coordinates over durationMs (default 500ms).
 */
export async function smoothScrollTo(
  client: CdpClient,
  x: number,
  y: number,
  durationMs = 500,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo({ left: ${x}, top: ${y}, behavior: 'smooth' })`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  await new Promise<void>(resolve => setTimeout(resolve, durationMs));
}

// ---------------------------------------------------------------------------
// Advanced scroll and position tools (scroll2 extension)
// ---------------------------------------------------------------------------

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * Get scroll depth as percentage: scrolled %, total scrollable px, current px.
 * Named getScrollDepth2 to avoid conflict with scroll3.ts getScrollDepth.
 */
export async function getScrollDepth2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const scrollY = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight;
  const innerHeight = window.innerHeight;
  const totalScrollable = scrollHeight - innerHeight;
  const percent = totalScrollable <= 0 ? 0 : Math.min(100, Math.max(0, (scrollY / totalScrollable) * 100));
  return { scrolledPercent: Math.round(percent * 100) / 100, totalScrollablePx: totalScrollable, currentPx: scrollY };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getScrollDepth2 error');
  return ok(result.value);
}

/**
 * Check if page is scrolled to bottom (within 50px tolerance).
 */
export async function isAtBottom(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'isAtBottom error');
  return ok(result.value);
}

/**
 * Check if page is scrolled to top (scrollY <= 10).
 */
export async function isAtTop(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollY <= 10`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'isAtTop error');
  return ok(result.value);
}

/**
 * Scroll to absolute bottom of page.
 * Named scrollToBottom2 to avoid conflict with page.ts scrollToBottom.
 */
export async function scrollToBottom2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo(0, document.documentElement.scrollHeight)`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'scrollToBottom2 error');
  return ok('Scrolled to bottom');
}

/**
 * Scroll to top of page (0, 0).
 * Named scrollToTop2 to avoid conflict with page.ts scrollToTop.
 */
export async function scrollToTop2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo(0, 0)`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'scrollToTop2 error');
  return ok('Scrolled to top');
}

/**
 * Find all scrollable elements (overflow auto/scroll with scrollHeight > clientHeight), max 10.
 * Returns array of { tagName, id, className, scrollHeight, clientHeight, scrollWidth, clientWidth }.
 */
export async function getScrollableContainers(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const all = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of all) {
    if (results.length >= 10) break;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll');
    if (isScrollable && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
      results.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || null,
        className: el.className || null,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getScrollableContainers error');
  return ok(result.value);
}

/**
 * Set scrollLeft/scrollTop on a container element matching selector.
 */
export async function scrollContainerTo(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Element not found: ' + ${selLiteral});
  el.scrollLeft = ${x};
  el.scrollTop = ${y};
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'scrollContainerTo error');
  return ok('Scrolled container to (' + x + ', ' + y + ')');
}

/**
 * Get scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight of element.
 */
export async function getElementScrollInfo(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
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
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getElementScrollInfo error');
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// Scroll/viewport/position inspection functions (8 new exports)
// ---------------------------------------------------------------------------

/**
 * Current scroll position: scrollX, scrollY, maxScrollX, maxScrollY, scrollPercent.
 * Named getScrollPosition3 to avoid conflicts with page.ts and viewport2.ts versions.
 */
export async function getScrollPosition3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const maxScrollX = document.documentElement.scrollWidth - window.innerWidth;
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = maxScrollY <= 0 ? 0 : Math.round((scrollY / maxScrollY) * 100);
  return { scrollX, scrollY, maxScrollX, maxScrollY, scrollPercent };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getScrollPosition3 error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Elements that are scrollable (overflow scroll/auto with overflow content): max 20.
 * Named getScrollableContainers2 to avoid conflict with existing getScrollableContainers.
 */
export async function getScrollableContainers2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const all = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of all) {
    if (results.length >= 20) break;
    const style = window.getComputedStyle(el);
    const ox = style.overflowX;
    const oy = style.overflowY;
    const scrollable = (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll');
    if (scrollable && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null),
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getScrollableContainers2 error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Bounding rects for visible interactive elements: a, button, input, select, textarea. Max 20.
 */
export async function getElementBoundingBoxes(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('a, button, input, select, textarea'));
  const results = [];
  for (const el of els) {
    if (results.length >= 20) break;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getElementBoundingBoxes error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Elements whose top is within the initial viewport (top < innerHeight).
 * Checks headings, sections, articles, main. Max 20.
 * Named getAboveTheFold2 to avoid conflict with viewport2.ts version.
 */
export async function getAboveTheFold2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, section, article, main'));
  const results = [];
  for (const el of els) {
    if (results.length >= 20) break;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null),
        top: Math.round(rect.top),
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getAboveTheFold2 error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Elements with getBoundingClientRect outside viewport. Max 20.
 * Named getOffscreenElements2 to avoid conflict with viewport2.ts version.
 */
export async function getOffscreenElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('*'));
  const results = [];
  const iw = window.innerWidth;
  const ih = window.innerHeight;
  for (const el of els) {
    if (results.length >= 20) break;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.bottom < 0 || rect.top > ih || rect.right < 0 || rect.left > iw) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      });
    }
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getOffscreenElements2 error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Elements at top of page that appear sticky (position:sticky or position:fixed with small top). Max 10.
 */
export async function getStickyHeaders(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of els) {
    if (results.length >= 10) break;
    const style = window.getComputedStyle(el);
    const pos = style.position;
    if (pos !== 'sticky' && pos !== 'fixed') continue;
    const rect = el.getBoundingClientRect();
    if (rect.top > 100) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null),
      top: Math.round(rect.top),
      height: Math.round(rect.height),
    });
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getStickyHeaders error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Elements with scroll-snap-type or scroll-snap-align set. Max 20.
 */
export async function getScrollSnap(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of els) {
    if (results.length >= 20) break;
    const style = window.getComputedStyle(el);
    const snapType = style.scrollSnapType;
    const snapAlign = style.scrollSnapAlign;
    if ((!snapType || snapType === 'none') && (!snapAlign || snapAlign === 'none')) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null),
      snapType: snapType || null,
      snapAlign: snapAlign || null,
    });
  }
  return results;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getScrollSnap error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * Full document dimensions: documentWidth, documentHeight, viewportWidth, viewportHeight,
 * devicePixelRatio, scrollbarWidth.
 * Named getPageDimensions2 to avoid conflict with layout.ts version.
 */
export async function getPageDimensions2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
  return {
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getPageDimensions2 error');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
