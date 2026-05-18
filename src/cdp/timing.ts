// src/cdp/timing.ts
import { CdpClient } from './client';

/**
 * sleep — pause execution on the Node.js/MCP server side.
 * The client param is included for API consistency but is not used.
 */
export async function sleep(_client: CdpClient, ms: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * measureDuration — evaluate a CDP expression and return its result plus
 * the wall-clock milliseconds elapsed on the server side.
 */
export async function measureDuration(
  client: CdpClient,
  expression: string,
): Promise<{ result: unknown; durationMs: number }> {
  const t0 = Date.now();
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  const durationMs = Date.now() - t0;

  if (exceptionDetails) {
    throw new Error(
      `measureDuration: expression threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
    );
  }

  return { result: result.value, durationMs };
}

/**
 * waitUntilIdle — poll the browser every 100 ms until document.readyState is
 * 'complete'. Throws if timeoutMs elapses before the condition is met.
 *
 * @param idleMs   unused structurally but kept for a future network-idle check;
 *                 default 500
 * @param timeoutMs  maximum wait; default 10 000
 */
export async function waitUntilIdle(
  client: CdpClient,
  idleMs = 500,
  timeoutMs = 10_000,
): Promise<void> {
  void idleMs; // reserved for future network-idle extension
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: 'document.readyState',
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `waitUntilIdle: evaluate threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
      );
    }

    if (result.value === 'complete') return;

    await new Promise<void>(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`waitUntilIdle: timed out after ${timeoutMs} ms`);
}

/**
 * waitForExpressionTrue — poll every pollingMs until the given browser
 * expression evaluates to a truthy value. Throws on timeout.
 *
 * @param pollingMs   interval between polls; default 200
 * @param timeoutMs   maximum wait; default 10 000
 */
export async function waitForExpressionTrue(
  client: CdpClient,
  expression: string,
  pollingMs = 200,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `waitForExpressionTrue: expression threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
      );
    }

    if (result.value) return;

    await new Promise<void>(resolve => setTimeout(resolve, pollingMs));
  }

  throw new Error(
    `waitForExpressionTrue: timed out after ${timeoutMs} ms — expression never became truthy: ${expression}`,
  );
}

/**
 * debounceEvaluate — wait waitMs on the server side (letting the page settle),
 * then evaluate the expression. Returns the result value.
 */
export async function debounceEvaluate(
  client: CdpClient,
  expression: string,
  waitMs: number,
): Promise<unknown> {
  await new Promise<void>(resolve => setTimeout(resolve, waitMs));

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `debounceEvaluate: expression threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
    );
  }

  return result.value;
}

/**
 * retryEvaluate — evaluate the expression up to maxRetries times. On any
 * exception or exceptionDetails, wait retryDelayMs then try again. Throws the
 * last error when all retries are exhausted.
 *
 * @param retryDelayMs  wait between attempts; default 500
 */
export async function retryEvaluate(
  client: CdpClient,
  expression: string,
  maxRetries: number,
  retryDelayMs = 500,
): Promise<unknown> {
  let lastError: Error = new Error('retryEvaluate: no attempts made');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
        expression,
        returnByValue: true,
      });

      if (exceptionDetails) {
        lastError = new Error(
          `retryEvaluate: expression threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
        );
        await new Promise<void>(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      return result.value;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise<void>(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError;
}

/**
 * getHighResolutionTime — return the browser's current performance.now() value
 * in milliseconds.
 */
export async function getHighResolutionTime(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'performance.now()',
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `getHighResolutionTime: evaluate threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
    );
  }

  return result.value as number;
}

/**
 * measureExpressionTime — run the expression `runs` times inside a single
 * browser-side loop, measuring each iteration with performance.now(). Returns
 * aggregate stats. Uses awaitPromise so async expressions are supported.
 *
 * @param runs  number of iterations; default 5
 */
export async function measureExpressionTime(
  client: CdpClient,
  expression: string,
  runs = 5,
): Promise<{ avg: number; min: number; max: number; runs: number }> {
  const safeRuns = JSON.stringify(runs);
  const loopExpression = `
(async () => {
  const times = [];
  for (let i = 0; i < ${safeRuns}; i++) {
    const t0 = performance.now();
    ${expression};
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { avg, min: Math.min(...times), max: Math.max(...times), runs: times.length };
})()
`.trim();

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: loopExpression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `measureExpressionTime: expression threw — ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`,
    );
  }

  return result.value as { avg: number; min: number; max: number; runs: number };
}
