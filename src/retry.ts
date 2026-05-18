// src/retry.ts

export interface RetryOptions {
  maxAttempts?: number;  // default 5
  intervalMs?: number;   // default 500 — wait between attempts
  timeoutMs?: number;    // default 10000 — total deadline
  errorMessage?: string; // custom error if all attempts fail
}

/**
 * Polls fn() until it returns a truthy value or throws a non-retryable error.
 * Retries on falsy returns and on errors.
 *
 * @example
 * await retry(() => clickSelector(cdp, '.submit-btn'));
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 5;
  const intervalMs = options?.intervalMs ?? 500;
  const timeoutMs = options?.timeoutMs ?? 10000;
  const errorMessage = options?.errorMessage;

  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxAttempts && Date.now() < deadline) {
    attempt++;
    try {
      const result = await fn();
      if (result !== null && result !== undefined && result !== false) {
        return result;
      }
      lastError = new Error(`fn() returned falsy value on attempt ${attempt}`);
    } catch (err) {
      lastError = err;
    }

    // Check deadline before sleeping so we don't wait unnecessarily
    if (attempt < maxAttempts && Date.now() + intervalMs < deadline) {
      await sleep(intervalMs);
    }
  }

  const reason = errorMessage
    ?? `retry failed after ${attempt} attempt${attempt === 1 ? '' : 's'}`;
  const cause = lastError instanceof Error ? `: ${lastError.message}` : '';
  throw new Error(`${reason}${cause}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
