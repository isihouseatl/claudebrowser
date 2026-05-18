// src/cdp/waiters.ts
import { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Internal polling primitive
// ---------------------------------------------------------------------------

async function poll<T>(
  fn: () => Promise<T | null | false | undefined>,
  timeoutMs: number,
  intervalMs: number = 200,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (result !== null && result !== undefined && result !== false) return result as T;
    await new Promise<void>(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// waitForAny
// ---------------------------------------------------------------------------

/**
 * Wait until ANY of the given selectors appears in the DOM.
 * Polls every 200ms. Returns the selector that matched first.
 */
export async function waitForAny(
  client: CdpClient,
  selectors: string[],
  timeoutMs: number = 15000,
): Promise<string> {
  const selectorsJson = JSON.stringify(selectors);
  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const selectors = ${selectorsJson};
  for (const sel of selectors) {
    if (document.querySelector(sel)) return sel;
  }
  return null;
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }
    return (result.value as string | null) ?? null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// waitForAll
// ---------------------------------------------------------------------------

/**
 * Wait until ALL given selectors exist in the DOM simultaneously.
 * Polls every 200ms.
 */
export async function waitForAll(
  client: CdpClient,
  selectors: string[],
  timeoutMs: number = 15000,
): Promise<void> {
  const selectorsJson = JSON.stringify(selectors);
  await poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const selectors = ${selectorsJson};
  return selectors.every(sel => !!document.querySelector(sel));
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }
    return (result.value as boolean) === true ? true : null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// waitForCondition
// ---------------------------------------------------------------------------

/**
 * Poll a JS expression every 200ms until it returns a truthy value.
 * Returns the truthy value. The expression runs inside the page context.
 */
export async function waitForCondition(
  client: CdpClient,
  expression: string,
  timeoutMs: number = 15000,
): Promise<unknown> {
  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }
    const val = result.value;
    // Return undefined/null/false/0/"" as null so poll keeps going
    if (val === null || val === undefined || val === false || val === 0 || val === '') return null;
    return val as unknown;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// waitForStable
// ---------------------------------------------------------------------------

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Wait until an element's bounding box stops changing (layout stable).
 * Polls getBoundingClientRect every 100ms.
 * Considers stable after stableMs (default 500ms) of no change.
 */
export async function waitForStable(
  client: CdpClient,
  selector: string,
  stableMs: number = 500,
  timeoutMs: number = 10000,
): Promise<void> {
  const selectorJson = JSON.stringify(selector);
  const start = Date.now();
  let lastBox: BoundingBox | null = null;
  let stableSince: number | null = null;

  while (Date.now() - start < timeoutMs) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    const box = result.value as BoundingBox | null;

    if (box === null) {
      // Element not yet in DOM — reset stability tracking
      lastBox = null;
      stableSince = null;
    } else {
      const changed =
        lastBox === null ||
        box.x !== lastBox.x ||
        box.y !== lastBox.y ||
        box.width !== lastBox.width ||
        box.height !== lastBox.height;

      if (changed) {
        lastBox = box;
        stableSince = Date.now();
      } else if (stableSince !== null && Date.now() - stableSince >= stableMs) {
        return;
      }
    }

    await new Promise<void>(r => setTimeout(r, 100));
  }

  throw new Error(`waitForStable timed out after ${timeoutMs}ms for selector: ${selector}`);
}

// ---------------------------------------------------------------------------
// waitForValueChange
// ---------------------------------------------------------------------------

/**
 * Wait until the value/textContent of an element changes from its current value.
 * Captures current value first, then polls until it differs.
 * Returns the new value.
 */
export async function waitForValueChange(
  client: CdpClient,
  selector: string,
  timeoutMs: number = 10000,
): Promise<string> {
  const selectorJson = JSON.stringify(selector);

  // Capture the current value
  const { result: initialResult, exceptionDetails: initEx } =
    await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) return null;
  return 'value' in el ? String(el.value) : el.textContent;
})()`,
      returnByValue: true,
    });

  if (initEx) {
    throw new Error(
      `JS error: ${initEx.exception?.description ?? initEx.text}`,
    );
  }

  const initialValue = initialResult.value as string | null;

  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selectorJson});
  if (!el) return null;
  return 'value' in el ? String(el.value) : el.textContent;
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    const current = result.value as string | null;
    if (current === null) return null;
    if (current !== initialValue) return current;
    return null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// waitForCountChange
// ---------------------------------------------------------------------------

/**
 * Wait until the count of elements matching selector changes.
 * Optionally require it to increase, decrease, or change in any direction.
 * Returns the new count.
 */
export async function waitForCountChange(
  client: CdpClient,
  selector: string,
  direction: 'increase' | 'decrease' | 'any' = 'any',
  timeoutMs: number = 10000,
): Promise<number> {
  const selectorJson = JSON.stringify(selector);

  // Capture initial count
  const { result: initialResult, exceptionDetails: initEx } =
    await client.raw.Runtime.evaluate({
      expression: `document.querySelectorAll(${selectorJson}).length`,
      returnByValue: true,
    });

  if (initEx) {
    throw new Error(
      `JS error: ${initEx.exception?.description ?? initEx.text}`,
    );
  }

  const initialCount = initialResult.value as number;

  return poll(async () => {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.querySelectorAll(${selectorJson}).length`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }

    const count = result.value as number;

    if (direction === 'increase' && count > initialCount) return count;
    if (direction === 'decrease' && count < initialCount) return count;
    if (direction === 'any' && count !== initialCount) return count;

    return null;
  }, timeoutMs);
}

// ---------------------------------------------------------------------------
// retryUntilSuccess
// ---------------------------------------------------------------------------

/**
 * Retry a JS expression up to maxAttempts times with delayMs between attempts.
 * Succeeds if expression returns truthy without throwing.
 * Throws the last error if all attempts fail.
 */
export async function retryUntilSuccess(
  client: CdpClient,
  expression: string,
  maxAttempts: number = 5,
  delayMs: number = 1000,
): Promise<unknown> {
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise<void>(r => setTimeout(r, delayMs));
    }

    try {
      const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
        expression,
        returnByValue: true,
        awaitPromise: true,
      });

      if (exceptionDetails) {
        lastError = new Error(
          `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
        );
        continue;
      }

      const val = result.value;
      if (val !== null && val !== undefined && val !== false && val !== 0 && val !== '') {
        return val;
      }

      lastError = new Error(`Expression returned falsy value on attempt ${attempt + 1}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError;
}
