// src/cdp/cache.ts
import { CdpClient } from './client';

export interface CacheEntry {
  cacheName: string;
  url: string;
  status: number;
  contentType?: string;
}

export interface StorageQuota {
  usage: number;       // bytes used
  quota: number;       // bytes available
  usagePercent: number;
}

// List all Cache API cache names for the current origin
export async function listCacheNames(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `caches.keys()`,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in listCacheNames: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  if (!Array.isArray(result.value)) {
    return [];
  }

  return result.value as string[];
}

// Get all entries in a named cache
export async function getCacheEntries(client: CdpClient, cacheName: string): Promise<CacheEntry[]> {
  const nameExpr = JSON.stringify(cacheName);

  const expression = `(async () => {
  const cache = await caches.open(${nameExpr});
  const requests = await cache.keys();
  const entries = [];
  for (const req of requests) {
    const res = await cache.match(req);
    entries.push({
      cacheName: ${nameExpr},
      url: req.url,
      status: res ? res.status : 0,
      contentType: res ? (res.headers.get('content-type') || undefined) : undefined,
    });
  }
  return entries;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in getCacheEntries: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  if (!Array.isArray(result.value)) {
    return [];
  }

  return result.value as CacheEntry[];
}

// Delete a named cache. Returns true if the cache existed and was deleted.
export async function deleteCache(client: CdpClient, cacheName: string): Promise<boolean> {
  const nameExpr = JSON.stringify(cacheName);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `caches.delete(${nameExpr})`,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in deleteCache: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as boolean;
}

// Delete a specific URL from a named cache. Returns true if the entry was found and deleted.
export async function deleteCacheEntry(client: CdpClient, cacheName: string, url: string): Promise<boolean> {
  const nameExpr = JSON.stringify(cacheName);
  const urlExpr = JSON.stringify(url);

  const expression = `(async () => {
  const cache = await caches.open(${nameExpr});
  return cache.delete(${urlExpr});
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in deleteCacheEntry: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value as boolean;
}

// Clear all caches for the origin
export async function clearAllCaches(client: CdpClient): Promise<void> {
  const expression = `(async () => {
  const names = await caches.keys();
  await Promise.all(names.map(n => caches.delete(n)));
})()`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in clearAllCaches: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get storage quota estimate: how much storage this origin is using
export async function getStorageQuota(client: CdpClient): Promise<StorageQuota> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.storage.estimate().then(e => ({ usage: e.usage || 0, quota: e.quota || 0 }))`,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in getStorageQuota: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  const raw = result.value as { usage: number; quota: number };
  const usage = raw.usage ?? 0;
  const quota = raw.quota ?? 0;
  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

  return { usage, quota, usagePercent };
}

// Get sizes of different storage types: localStorage, sessionStorage, caches, indexedDB, serviceWorker
export async function getStorageBreakdown(client: CdpClient): Promise<{
  localStorage: number;
  sessionStorage: number;
  cacheStorage: number;
  indexedDB: number;
  serviceWorker: number;
}> {
  const expression = `navigator.storage.estimate().then(e => {
  const d = e.usageDetails || {};
  return {
    localStorage: d.localStorage || 0,
    sessionStorage: d.sessionStorage || 0,
    cacheStorage: d.caches || 0,
    indexedDB: d.indexedDB || 0,
    serviceWorker: d.serviceWorkerRegistrations || 0,
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error in getStorageBreakdown: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  const raw = result.value as Record<string, number>;

  return {
    localStorage: raw.localStorage ?? 0,
    sessionStorage: raw.sessionStorage ?? 0,
    cacheStorage: raw.cacheStorage ?? 0,
    indexedDB: raw.indexedDB ?? 0,
    serviceWorker: raw.serviceWorker ?? 0,
  };
}
