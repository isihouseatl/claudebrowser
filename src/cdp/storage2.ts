// src/cdp/storage2.ts
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---------------------------------------------------------------------------
// Legacy functions — used by server.ts, keep exact return types
// ---------------------------------------------------------------------------

// Return the number of keys and total byte size of localStorage
export async function getLocalStorageSize(client: CdpClient): Promise<{ keys: number; bytes: number }> {
  const expression = `(function() {
    var serialized = JSON.stringify(Object.fromEntries(Object.entries(localStorage)));
    return { keys: localStorage.length, bytes: new TextEncoder().encode(serialized).length };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error in getLocalStorageSize: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  return result.value as { keys: number; bytes: number };
}

// Search localStorage entries where key or value contains the query string (case-insensitive)
export async function searchLocalStorage(
  client: CdpClient,
  query: string,
): Promise<Array<{ key: string; value: string }>> {
  var escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const expression = `(function() {
    var q = '${escapedQuery}'.toLowerCase();
    var matches = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      var value = localStorage.getItem(key);
      if (key.toLowerCase().indexOf(q) !== -1 || (value !== null && value.toLowerCase().indexOf(q) !== -1)) {
        matches.push({ key: key, value: value !== null ? value : '' });
      }
    }
    return matches;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error in searchLocalStorage: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  return (result.value ?? []) as Array<{ key: string; value: string }>;
}

// Return the number of keys and total byte size of sessionStorage
export async function getSessionStorageSize(client: CdpClient): Promise<{ keys: number; bytes: number }> {
  const expression = `(function() {
    var serialized = JSON.stringify(Object.fromEntries(Object.entries(sessionStorage)));
    return { keys: sessionStorage.length, bytes: new TextEncoder().encode(serialized).length };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error in getSessionStorageSize: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  return result.value as { keys: number; bytes: number };
}

// Return both localStorage and sessionStorage as plain objects
export async function dumpAllStorage(
  client: CdpClient,
): Promise<{ localStorage: Record<string, string>; sessionStorage: Record<string, string> }> {
  const expression = `(function() {
    return {
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      sessionStorage: Object.fromEntries(Object.entries(sessionStorage))
    };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error in dumpAllStorage: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  return (result.value ?? { localStorage: {}, sessionStorage: {} }) as {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
}

// Count cookies accessible via document.cookie
export async function getCookieCount(client: CdpClient): Promise<number> {
  const expression = `(function() {
    return document.cookie.split(';').filter(function(s) { return s.trim().length > 0; }).length;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error in getCookieCount: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
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
    throw new Error('JS error in getStorageEstimate: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
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
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error('JS error getting origin in clearOriginStorage: ' + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  const origin = result.value as string;
  await (client.raw.Storage as any).clearDataForOrigin({ origin, storageTypes: 'all' });
}

// ---------------------------------------------------------------------------
// New tool-style functions — return { content: [{ type: 'text', text }] }
// ---------------------------------------------------------------------------

// Return JSON array of all localStorage keys
export async function getLocalStorageKeys(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var keys = []; for (var i = 0; i < localStorage.length; i++) { keys.push(localStorage.key(i)); } return JSON.stringify(keys); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('localStorage.keys returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Return JSON array of all sessionStorage keys
export async function getSessionStorageKeys(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var keys = []; for (var i = 0; i < sessionStorage.length; i++) { keys.push(sessionStorage.key(i)); } return JSON.stringify(keys); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('sessionStorage.keys returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Return JSON {count, estimatedBytes} — sum of (key.length + value.length) * 2 for all localStorage entries.
// Named getLocalStorageSizeInfo to avoid conflict with the legacy getLocalStorageSize above.
export async function getLocalStorageSizeInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var count = localStorage.length; var bytes = 0; for (var i = 0; i < count; i++) { var k = localStorage.key(i); var v = localStorage.getItem(k); bytes += (k.length + (v ? v.length : 0)) * 2; } return JSON.stringify({ count: count, estimatedBytes: bytes }); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('localStorage size check returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Clear localStorage and return "Cleared".
// Named wipeLocalStorage to avoid conflict with clearLocalStorage in storage.ts.
export async function wipeLocalStorage(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { localStorage.clear(); return "Cleared"; })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Cleared');
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Clear sessionStorage and return "Cleared".
// Named wipeSessionStorage to avoid conflict with clearSessionStorage in storage.ts.
export async function wipeSessionStorage(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { sessionStorage.clear(); return "Cleared"; })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Cleared');
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Return JSON array of {name, version} for all IndexedDB databases on the current origin
export async function getIndexedDBDatabases(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { return indexedDB.databases().then(function(dbs) { return JSON.stringify(dbs.map(function(d) { return { name: d.name, version: d.version }; })); }); })()',
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('indexedDB.databases() returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Return JSON {count} of cookies visible to the current page via document.cookie.
// Named getCookieCountInfo to avoid conflict with the legacy getCookieCount above.
export async function getCookieCountInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var count = document.cookie.split(";").filter(function(s) { return s.trim().length > 0; }).length; return JSON.stringify({ count: count }); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('getCookieCountInfo returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// Return JSON {usage, quota, usagePercent} from navigator.storage.estimate()
export async function getStorageQuota(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { return navigator.storage.estimate().then(function(est) { var pct = est.quota > 0 ? Math.round((est.usage / est.quota) * 10000) / 100 : 0; return JSON.stringify({ usage: est.usage, quota: est.quota, usagePercent: pct }); }); })()',
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('navigator.storage.estimate() returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// ---------------------------------------------------------------------------
// New storage inspection functions (storage2 batch)
// Names with suffix 2 avoid conflicts with existing exports in this file or
// storage.ts imports in server.ts.
// ---------------------------------------------------------------------------

// 1. List all IndexedDB databases: name, version
// Renamed getIndexedDBDatabases2 — getIndexedDBDatabases already exported above.
export async function getIndexedDBDatabases2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(async function() { if (typeof indexedDB === "undefined" || typeof indexedDB.databases !== "function") { return JSON.stringify([]); } var dbs = await indexedDB.databases(); return JSON.stringify(dbs.map(function(d) { return { name: d.name, version: d.version }; })); })()',
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('indexedDB.databases() returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 2. Open an IndexedDB by name and list its object stores: name, keyPath, autoIncrement
export async function getIndexedDBObjectStores(
  client: CdpClient,
  dbName: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const escaped = dbName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(async function() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open('${escaped}');
    req.onerror = function() { reject(req.error ? req.error.message : 'open failed'); };
    req.onsuccess = function() {
      var db = req.result;
      var stores = [];
      for (var i = 0; i < db.objectStoreNames.length; i++) {
        var name = db.objectStoreNames[i];
        var tx = db.transaction(name, 'readonly');
        var store = tx.objectStore(name);
        stores.push({ name: name, keyPath: store.keyPath, autoIncrement: store.autoIncrement });
      }
      db.close();
      resolve(JSON.stringify(stores));
    };
    req.onupgradeneeded = function() {
      var db = req.result;
      db.close();
      resolve(JSON.stringify([]));
    };
  });
})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('getIndexedDBObjectStores returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 3. Get all sessionStorage keys
// Renamed getSessionStorageKeys2 — getSessionStorageKeys already exported above.
export async function getSessionStorageKeys2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var keys = []; for (var i = 0; i < sessionStorage.length; i++) { keys.push(sessionStorage.key(i)); } return JSON.stringify(keys); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('sessionStorage.keys returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 4. Get a specific sessionStorage item value
export async function getSessionStorageItem(
  client: CdpClient,
  key: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() { var v = sessionStorage.getItem('${escaped}'); return JSON.stringify({ key: '${escaped}', value: v }); })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('getSessionStorageItem returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 5. Set a sessionStorage item
export async function setSessionStorageItem(
  client: CdpClient,
  key: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const escapedKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedVal = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() { sessionStorage.setItem('${escapedKey}', '${escapedVal}'); return "ok"; })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ key, set: true }));
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 6. Clear all sessionStorage
// Renamed clearSessionStorage2 — clearSessionStorage is already imported from storage.ts in server.ts.
export async function clearSessionStorage2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { sessionStorage.clear(); return "cleared"; })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ cleared: true }));
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 7. Get estimated sizes: localStorageKeys count, sessionStorageKeys count, storageEstimate if available
export async function getStorageSizes(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(async function() {
  var lsCount = localStorage.length;
  var ssCount = sessionStorage.length;
  var estimate = null;
  if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.estimate === "function") {
    try { estimate = await navigator.storage.estimate(); } catch(e) { estimate = null; }
  }
  return JSON.stringify({
    localStorageKeys: lsCount,
    sessionStorageKeys: ssCount,
    storageEstimate: estimate ? { usage: estimate.usage, quota: estimate.quota } : null
  });
})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('getStorageSizes returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}

// 8. Count cookies via document.cookie, return {count, names: string[]}
// Renamed getCookieCount2 — getCookieCount already exported above (returns number, different signature).
export async function getCookieCount2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { var raw = document.cookie; var parts = raw.split(";").map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; }); var names = parts.map(function(p) { var eq = p.indexOf("="); return eq >= 0 ? p.substring(0, eq).trim() : p.trim(); }); return JSON.stringify({ count: names.length, names: names }); })()',
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('getCookieCount2 returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e: any) {
    return err(e?.message ?? String(e));
  }
}
