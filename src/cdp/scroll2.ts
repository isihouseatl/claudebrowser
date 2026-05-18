// src/cdp/scroll2.ts
import { CdpClient } from './client';

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
