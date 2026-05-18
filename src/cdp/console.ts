// src/cdp/console.ts
import { CdpClient } from './client';

export interface ConsoleMessage {
  type: string;       // 'log' | 'warn' | 'error' | 'info' | 'debug' etc.
  text: string;       // joined args as string
  timestamp: number;  // Date.now() when received
}

export interface JsError {
  description: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
  timestamp: number;
}

// Per-client console message buffer
const consoleBuffers = new WeakMap<CdpClient, ConsoleMessage[]>();

// Per-client JS error buffer
const errorBuffers = new WeakMap<CdpClient, JsError[]>();

// Per-client cleanup functions (presence indicates monitoring is active)
const cleanupFns = new WeakMap<CdpClient, () => void>();

// Start monitoring console messages and JS errors for this client.
// Calling again on the same client is a no-op (already monitoring).
export async function startConsoleMonitor(client: CdpClient): Promise<void> {
  if (cleanupFns.has(client)) return;

  consoleBuffers.set(client, []);
  errorBuffers.set(client, []);

  await client.raw.Runtime.enable();

  const removeConsole = client.raw.Runtime.consoleAPICalled(({
    type,
    args,
  }: {
    type: string;
    args: Array<{ value?: unknown; description?: string }>;
    timestamp: number;
  }) => {
    const text = args
      .map(arg => String(arg.value ?? arg.description ?? ''))
      .join(' ');
    consoleBuffers.get(client)?.push({ type, text, timestamp: Date.now() });
  }) as unknown as () => void;

  const removeException = client.raw.Runtime.exceptionThrown(({
    exceptionDetails,
  }: {
    timestamp: number;
    exceptionDetails: {
      text: string;
      url?: string;
      lineNumber?: number;
      columnNumber?: number;
      exception?: { description?: string };
    };
  }) => {
    const description =
      exceptionDetails.exception?.description ?? exceptionDetails.text;
    errorBuffers.get(client)?.push({
      description,
      url: exceptionDetails.url ?? '',
      lineNumber: exceptionDetails.lineNumber ?? 0,
      columnNumber: exceptionDetails.columnNumber ?? 0,
      timestamp: Date.now(),
    });
  }) as unknown as () => void;

  cleanupFns.set(client, () => {
    removeConsole();
    removeException();
  });
}

// Return all captured console messages since startConsoleMonitor was called (or last clear).
export function getConsoleMessages(client: CdpClient): ConsoleMessage[] {
  return consoleBuffers.get(client) ?? [];
}

// Clear the console message buffer.
export function clearConsoleMessages(client: CdpClient): void {
  const buf = consoleBuffers.get(client);
  if (buf) buf.length = 0;
}

// Return all captured JS errors (Runtime.exceptionThrown events) since monitoring started.
export function getJsErrors(client: CdpClient): JsError[] {
  return errorBuffers.get(client) ?? [];
}

// Clear the JS error buffer.
export function clearJsErrors(client: CdpClient): void {
  const buf = errorBuffers.get(client);
  if (buf) buf.length = 0;
}

// Stop monitoring and clean up listeners.
export function stopConsoleMonitor(client: CdpClient): void {
  const cleanup = cleanupFns.get(client);
  if (!cleanup) return;
  cleanup();
  cleanupFns.delete(client);
  consoleBuffers.delete(client);
  errorBuffers.delete(client);
}
