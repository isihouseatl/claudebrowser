// src/cdp/netlog.ts
import { CdpClient } from './client';

export interface NetworkRequest {
  requestId: string;
  method: string;
  url: string;
  status: number | null;           // null until response received
  mimeType: string | null;         // null until response received
  requestTimestamp: number;        // Date.now() when request fired
  responseTimestamp: number | null; // Date.now() when response received
  resourceType: string;            // 'XHR' | 'Fetch' | 'Document' | 'Script' etc.
}

// Per-client log buffer: requestId -> NetworkRequest
const logBuffers = new WeakMap<CdpClient, Map<string, NetworkRequest>>();

// Per-client cleanup functions (stop both event subscriptions)
const cleanupFns = new WeakMap<CdpClient, () => void>();

function getLogBuffer(client: CdpClient): Map<string, NetworkRequest> {
  let buf = logBuffers.get(client);
  if (!buf) {
    buf = new Map();
    logBuffers.set(client, buf);
  }
  return buf;
}

// Start capturing all network requests/responses.
// Calling again on the same client is a no-op.
export async function startNetworkLog(client: CdpClient): Promise<void> {
  if (cleanupFns.has(client)) return;

  // Ensure a clean buffer exists before subscribing
  logBuffers.set(client, new Map());

  await client.raw.Network.enable({});

  const buf = getLogBuffer(client);

  const removeRequestListener = client.raw.Network.requestWillBeSent(({
    requestId,
    request,
    timestamp,
    type,
  }: {
    requestId: string;
    request: { method: string; url: string };
    timestamp: number;
    type?: string;
  }) => {
    buf.set(requestId, {
      requestId,
      method: request.method,
      url: request.url,
      status: null,
      mimeType: null,
      requestTimestamp: Date.now(),
      responseTimestamp: null,
      resourceType: type ?? 'Other',
    });
  }) as unknown as () => void;

  const removeResponseListener = client.raw.Network.responseReceived(({
    requestId,
    response,
  }: {
    requestId: string;
    response: { status: number; mimeType: string };
    timestamp: number;
  }) => {
    const entry = buf.get(requestId);
    if (entry) {
      entry.status = response.status;
      entry.mimeType = response.mimeType;
      entry.responseTimestamp = Date.now();
    }
  }) as unknown as () => void;

  cleanupFns.set(client, () => {
    removeRequestListener();
    removeResponseListener();
  });
}

// Return all captured requests so far.
// Returns an empty array if startNetworkLog has not been called.
export function getNetworkLog(client: CdpClient): NetworkRequest[] {
  const buf = logBuffers.get(client);
  if (!buf) return [];
  return Array.from(buf.values());
}

// Clear the request buffer without stopping capture.
export function clearNetworkLog(client: CdpClient): void {
  const buf = logBuffers.get(client);
  if (buf) buf.clear();
}

// Stop capturing and clean up. Returns the final log.
// Returns an empty array if startNetworkLog was never called.
export async function stopNetworkLog(client: CdpClient): Promise<NetworkRequest[]> {
  const cleanup = cleanupFns.get(client);
  if (!cleanup) return [];

  cleanup();

  const log = getNetworkLog(client);

  cleanupFns.delete(client);
  logBuffers.delete(client);

  await client.raw.Network.disable();

  return log;
}
