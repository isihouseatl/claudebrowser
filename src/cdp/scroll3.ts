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
