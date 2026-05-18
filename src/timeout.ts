// src/timeout.ts

export const DEFAULT_TOOL_TIMEOUT_MS = 30000; // 30 seconds

export class TimeoutError extends Error {
  constructor(toolName: string, ms: number) {
    super(`Tool '${toolName}' timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Runs fn() with a hard timeout. Throws TimeoutError if it exceeds ms.
 *
 * @example
 * const result = await withTimeout('clickSelector', 5000, () => clickSelector(cdp, '.btn'));
 */
export async function withTimeout<T>(
  toolName: string,
  ms: number,
  fn: () => Promise<T>,
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const timer = new Promise<never>((_resolve, reject) => {
    timerId = setTimeout(() => {
      reject(new TimeoutError(toolName, ms));
    }, ms);
  });

  try {
    return await Promise.race([fn(), timer]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}
