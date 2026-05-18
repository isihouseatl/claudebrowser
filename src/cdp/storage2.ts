// src/cdp/storage2.ts
import { CdpClient } from './client';

// Return the number of keys and total byte size of localStorage
export async function getLocalStorageSize(client: CdpClient): Promise<{ keys: number; bytes: number }> {
  const expression = `(() => {
    const serialized = JSON.stringify(localStorage);
    return { keys: localStorage.length, bytes: new TextEncoder().encode(serialized).length };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getLocalStorageSize: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { keys: number; bytes: number };
}

// Search localStorage entries where key or value contains the query string (case-insensitive)
export async function searchLocalStorage(
  client: CdpClient,
  query: string,
): Promise<Array<{ key: string; value: string }>> {
  const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const expression = `(() => {
    const q = '${escapedQuery}'.toLowerCase();
    const matches = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (key.toLowerCase().includes(q) || (value !== null && value.toLowerCase().includes(q))) {
        matches.push({ key, value: value ?? '' });
      }
    }
    return matches;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in searchLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as Array<{ key: string; value: string }>;
}

// Return the number of keys and total byte size of sessionStorage
export async function getSessionStorageSize(client: CdpClient): Promise<{ keys: number; bytes: number }> {
  const expression = `(() => {
    const serialized = JSON.stringify(sessionStorage);
    return { keys: sessionStorage.length, bytes: new TextEncoder().encode(serialized).length };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getSessionStorageSize: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { keys: number; bytes: number };
}

// Return both localStorage and sessionStorage as plain objects
export async function dumpAllStorage(
  client: CdpClient,
): Promise<{ localStorage: Record<string, string>; sessionStorage: Record<string, string> }> {
  const expression = `(() => ({
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
  }))()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in dumpAllStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? { localStorage: {}, sessionStorage: {} }) as {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
}

// Count cookies accessible via document.cookie
export async function getCookieCount(client: CdpClient): Promise<number> {
  const expression = `document.cookie.split(';').filter(Boolean).length`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getCookieCount: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? 0) as number;
}

// Return the unique list of domains from all cookies in the browser via Network.getAllCookies
export async function getCookieDomains(client: CdpClient): Promise<string[]> {
  const response = await (client.raw.Network as any).getAllCookies();
  if (!response || !Array.isArray(response.cookies)) {
    throw new Error('Network.getAllCookies returned an unexpected response');
  }
  const domains = new Set<string>();
  for (const cookie of response.cookies) {
    if (cookie.domain) {
      domains.add(cookie.domain as string);
    }
  }
  return Array.from(domains).sort();
}

// Return the Storage API estimate: quota, usage, and usagePercent
export async function getStorageEstimate(
  client: CdpClient,
): Promise<{ quota: number; usage: number; usagePercent: number }> {
  const expression = `navigator.storage.estimate()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getStorageEstimate: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const estimate = result.value as { quota?: number; usage?: number };
  const quota = estimate?.quota ?? 0;
  const usage = estimate?.usage ?? 0;
  const usagePercent = quota > 0 ? Math.round((usage / quota) * 100 * 10) / 10 : 0;
  return { quota, usage, usagePercent };
}

// Clear all storage types for the current page's origin via Storage.clearDataForOrigin
export async function clearOriginStorage(client: CdpClient): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.origin',
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error getting origin in clearOriginStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const origin = result.value as string;
  await (client.raw.Storage as any).clearDataForOrigin({ origin, storageTypes: 'all' });
}
