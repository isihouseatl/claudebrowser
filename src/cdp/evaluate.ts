// src/cdp/evaluate.ts
import { CdpClient } from './client';

export async function evaluate(client: CdpClient, script: string): Promise<unknown> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: script,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number | null;
  resourceType: string;
  timestamp: number;
}

const requestLog: Map<string, Partial<NetworkRequest>> = new Map();
const MAX_LOG_SIZE = 500;
const EVICT_COUNT = 100;
let monitorStarted = false;

export function startNetworkMonitor(client: CdpClient): void {
  if (monitorStarted) return;
  monitorStarted = true;

  client.raw.Network.requestWillBeSent(({ requestId, request, type, timestamp }) => {
    if (requestLog.size >= MAX_LOG_SIZE) {
      const keys = requestLog.keys();
      for (let i = 0; i < EVICT_COUNT; i++) requestLog.delete(keys.next().value!);
    }
    requestLog.set(requestId, { url: request.url, method: request.method, resourceType: type ?? 'Other', timestamp, status: null });
  });
  client.raw.Network.responseReceived(({ requestId, response }) => {
    const existing = requestLog.get(requestId);
    if (existing) requestLog.set(requestId, { ...existing, status: response.status });
  });
}

export function resetNetworkMonitor(): void {
  monitorStarted = false;
  requestLog.clear();
}

export function getNetworkRequests(filter?: string): NetworkRequest[] {
  const all = Array.from(requestLog.values()) as NetworkRequest[];
  const filtered = filter ? all.filter(r => r.url?.includes(filter)) : all;
  return filtered.slice(-50);
}

export function clearNetworkLog(): void {
  requestLog.clear();
}
