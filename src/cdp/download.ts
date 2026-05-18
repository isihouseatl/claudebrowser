// src/cdp/download.ts
import { CdpClient } from './client';

export interface DownloadEvent {
  guid: string;
  url: string;
  suggestedFilename: string;
  state: 'inProgress' | 'completed' | 'canceled';
  receivedBytes?: number;
  totalBytes?: number;
  filePath?: string; // set when completed
}

// Per-client download buffer
const downloadBuffers = new WeakMap<CdpClient, Map<string, DownloadEvent>>();

// Per-client cleanup functions (presence indicates monitoring is active)
const cleanupFns = new WeakMap<CdpClient, () => void>();

// Start monitoring downloads. Sets download behavior to 'allow' at downloadPath (default /tmp).
// Calling again on the same client is a no-op (already monitoring).
export async function startDownloadMonitor(
  client: CdpClient,
  downloadPath = '/tmp',
): Promise<void> {
  if (cleanupFns.has(client)) return;

  downloadBuffers.set(client, new Map());

  await client.raw.Page.enable();

  await (client.raw.Page as any).setDownloadBehavior({
    behavior: 'allow',
    downloadPath,
  });

  const removeWillBegin = (client.raw.Page as any).downloadWillBegin(({
    guid,
    url,
    suggestedFilename,
  }: {
    guid: string;
    url: string;
    suggestedFilename: string;
  }) => {
    const buffer = downloadBuffers.get(client);
    if (!buffer) return;
    buffer.set(guid, {
      guid,
      url,
      suggestedFilename,
      state: 'inProgress',
    });
  }) as unknown as () => void;

  const removeProgress = (client.raw.Page as any).downloadProgress(({
    guid,
    receivedBytes,
    totalBytes,
    state,
  }: {
    guid: string;
    receivedBytes: number;
    totalBytes: number;
    state: 'inProgress' | 'completed' | 'canceled';
  }) => {
    const buffer = downloadBuffers.get(client);
    if (!buffer) return;
    const existing = buffer.get(guid);
    if (!existing) return;
    const updated: DownloadEvent = {
      ...existing,
      receivedBytes,
      totalBytes,
      state,
    };
    if (state === 'completed') {
      // Chrome sets the final path implicitly — we record it from the download dir + filename
      updated.filePath = existing.suggestedFilename
        ? `${downloadPath}/${existing.suggestedFilename}`
        : undefined;
    }
    buffer.set(guid, updated);
  }) as unknown as () => void;

  cleanupFns.set(client, () => {
    removeWillBegin();
    removeProgress();
  });
}

// Get all download events captured so far (as an array snapshot).
export function getDownloads(client: CdpClient): DownloadEvent[] {
  const buffer = downloadBuffers.get(client);
  if (!buffer) return [];
  return Array.from(buffer.values());
}

// Clear the download buffer.
export function clearDownloads(client: CdpClient): void {
  const buffer = downloadBuffers.get(client);
  if (buffer) buffer.clear();
}

// Stop monitoring. Returns final downloads.
export async function stopDownloadMonitor(client: CdpClient): Promise<DownloadEvent[]> {
  const downloads = getDownloads(client);
  const cleanup = cleanupFns.get(client);
  if (cleanup) {
    cleanup();
    cleanupFns.delete(client);
  }
  downloadBuffers.delete(client);
  return downloads;
}

// Wait for a download to complete. Resolves with the DownloadEvent when done.
// urlPattern: optional substring match on the download URL.
// Polls the buffer every 200ms.
// Rejects after timeoutMs (default 30000).
export async function waitForDownload(
  client: CdpClient,
  urlPattern?: string,
  timeoutMs = 30000,
): Promise<DownloadEvent> {
  const deadline = Date.now() + timeoutMs;

  return new Promise<DownloadEvent>((resolve, reject) => {
    const poll = () => {
      if (Date.now() >= deadline) {
        reject(
          new Error(
            `waitForDownload: no completed download${urlPattern ? ` matching "${urlPattern}"` : ''} within ${timeoutMs}ms`,
          ),
        );
        return;
      }

      const buffer = downloadBuffers.get(client);
      if (buffer) {
        for (const event of buffer.values()) {
          if (event.state === 'completed') {
            if (!urlPattern || event.url.includes(urlPattern)) {
              resolve(event);
              return;
            }
          }
        }
      }

      setTimeout(poll, 200);
    };

    poll();
  });
}
