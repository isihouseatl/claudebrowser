// src/cdp/storage.ts
import { CdpClient } from './client';

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;   // Unix timestamp, -1 = session cookie
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
}

// Get all cookies for the current page URL
export async function getCookies(client: CdpClient): Promise<Cookie[]> {
  const result = await client.raw.Network.getCookies({});
  if (!result || !Array.isArray(result.cookies)) {
    throw new Error('Network.getCookies returned an unexpected response');
  }
  return result.cookies.map((c: any) => ({
    name: c.name as string,
    value: c.value as string,
    domain: c.domain as string,
    path: c.path as string,
    expires: typeof c.expires === 'number' ? c.expires : -1,
    httpOnly: c.httpOnly as boolean,
    secure: c.secure as boolean,
    sameSite: c.sameSite as string | undefined,
  }));
}

// Set a cookie on the current page
export async function setCookie(
  client: CdpClient,
  name: string,
  value: string,
  options?: { domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean },
): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'location.href',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error getting current URL: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const url = result.value as string;

  const params: Record<string, unknown> = { name, value, url };
  if (options?.domain !== undefined) params.domain = options.domain;
  if (options?.path !== undefined) params.path = options.path;
  if (options?.expires !== undefined) params.expires = options.expires;
  if (options?.httpOnly !== undefined) params.httpOnly = options.httpOnly;
  if (options?.secure !== undefined) params.secure = options.secure;

  const setCookieResult = await client.raw.Network.setCookie(params as any);
  if (!setCookieResult?.success) {
    throw new Error(`Network.setCookie failed for cookie "${name}"`);
  }
}

// Delete cookies matching name (and optionally domain/path)
export async function deleteCookies(
  client: CdpClient,
  name: string,
  options?: { domain?: string; url?: string },
): Promise<void> {
  const params: Record<string, unknown> = { name };
  if (options?.domain !== undefined) params.domain = options.domain;
  if (options?.url !== undefined) params.url = options.url;
  await client.raw.Network.deleteCookies(params as any);
}

// Clear all cookies for the current page
export async function clearAllCookies(client: CdpClient): Promise<void> {
  await client.raw.Network.clearBrowserCookies();
}

// Read a localStorage key. Returns null if not set.
export async function getLocalStorage(client: CdpClient, key: string): Promise<string | null> {
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `localStorage.getItem('${escaped}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === undefined || result.value === null) {
    return null;
  }
  return result.value as string;
}

// Set a localStorage key
export async function setLocalStorage(client: CdpClient, key: string, value: string): Promise<void> {
  const escapedKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `localStorage.setItem('${escapedKey}', '${escapedValue}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in setLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove a localStorage key
export async function removeLocalStorage(client: CdpClient, key: string): Promise<void> {
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `localStorage.removeItem('${escaped}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in removeLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get all localStorage entries as key-value object
export async function getAllLocalStorage(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'Object.fromEntries(Object.entries(localStorage))',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getAllLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? {}) as Record<string, string>;
}

// Clear all localStorage for the current page
export async function clearLocalStorage(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'localStorage.clear()',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in clearLocalStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Read a sessionStorage key. Returns null if not set.
export async function getSessionStorage(client: CdpClient, key: string): Promise<string | null> {
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `sessionStorage.getItem('${escaped}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getSessionStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === undefined || result.value === null) return null;
  return result.value as string;
}

// Set a sessionStorage key
export async function setSessionStorage(client: CdpClient, key: string, value: string): Promise<void> {
  const escapedKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `sessionStorage.setItem('${escapedKey}', '${escapedValue}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in setSessionStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove a sessionStorage key
export async function removeSessionStorage(client: CdpClient, key: string): Promise<void> {
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `sessionStorage.removeItem('${escaped}')`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in removeSessionStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get all sessionStorage entries as key-value object
export async function getAllSessionStorage(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'Object.fromEntries(Object.entries(sessionStorage))',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getAllSessionStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? {}) as Record<string, string>;
}

// Clear all sessionStorage for the current page
export async function clearSessionStorage(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'sessionStorage.clear()',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in clearSessionStorage: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
