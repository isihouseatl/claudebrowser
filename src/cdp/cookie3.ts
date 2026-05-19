// cookie3.ts — storage and cookie inspection utilities (set 3)

export async function getCookies3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var raw = document.cookie ? document.cookie.split('; ') : [];
        var cookies = raw.slice(0, 30).map(function(pair) {
          var idx = pair.indexOf('=');
          var name = idx >= 0 ? pair.substring(0, idx) : pair;
          var value = idx >= 0 ? pair.substring(idx + 1) : '';
          return {
            name: name,
            value_preview: value.length > 80 ? value.substring(0, 80) + '...' : value,
            domain: location.hostname,
            path: '/',
            secure: location.protocol === 'https:',
            httpOnly: false,
            sameSite: 'unknown'
          };
        });
        return JSON.stringify(cookies);
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getSessionStorageItems3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var items = [];
        var keys = Object.keys(sessionStorage);
        keys.slice(0, 30).forEach(function(key) {
          var val = sessionStorage.getItem(key) || '';
          items.push({
            key: key,
            value_preview: val.length > 80 ? val.substring(0, 80) + '...' : val
          });
        });
        return JSON.stringify(items);
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getLocalStorageItems3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var items = [];
        var keys = Object.keys(localStorage);
        keys.slice(0, 30).forEach(function(key) {
          var val = localStorage.getItem(key) || '';
          items.push({
            key: key,
            value_preview: val.length > 80 ? val.substring(0, 80) + '...' : val
          });
        });
        return JSON.stringify(items);
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getIndexedDBDatabases5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (async function() {
        try {
          var dbs = await indexedDB.databases();
          var limited = dbs.slice(0, 20).map(function(db) {
            return { name: db.name || '', version: db.version || 0 };
          });
          return JSON.stringify(limited);
        } catch(e) {
          return JSON.stringify([]);
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getCacheStorageNames3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (async function() {
        try {
          var names = await caches.keys();
          return JSON.stringify(names.slice(0, 20));
        } catch(e) {
          return JSON.stringify([]);
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getStorageQuota5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (async function() {
        try {
          var estimate = await navigator.storage.estimate();
          return JSON.stringify({
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
            usageDetails: estimate.usageDetails || {}
          });
        } catch(e) {
          return JSON.stringify({ quota: 0, usage: 0, usageDetails: {} });
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getCookieCount5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var raw = document.cookie ? document.cookie.split('; ') : [];
        var count = raw.length;
        var secureCookies = 0;
        var httpOnlyCookies = 0;
        var sameSiteStrict = 0;
        var sameSiteLax = 0;
        var sameSiteNone = 0;
        // document.cookie only exposes non-HttpOnly cookies accessible to JS
        // HttpOnly count is unavailable from JS; approximation only
        return JSON.stringify({
          count: count,
          secureCookies: location.protocol === 'https:' ? count : 0,
          httpOnlyCookies: httpOnlyCookies,
          sameSiteStrict: sameSiteStrict,
          sameSiteLax: sameSiteLax,
          sameSiteNone: sameSiteNone
        });
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getStorageState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (async function() {
        var hasCookies = document.cookie.length > 0;
        var hasLocalStorage = localStorage.length > 0;
        var hasSessionStorage = sessionStorage.length > 0;
        var hasIndexedDB = false;
        var hasCacheStorage = false;
        try {
          var dbs = await indexedDB.databases();
          hasIndexedDB = dbs.length > 0;
        } catch(e) {}
        try {
          var cacheKeys = await caches.keys();
          hasCacheStorage = cacheKeys.length > 0;
        } catch(e) {}
        return JSON.stringify({
          hasCookies: hasCookies,
          hasLocalStorage: hasLocalStorage,
          hasSessionStorage: hasSessionStorage,
          hasIndexedDB: hasIndexedDB,
          hasCacheStorage: hasCacheStorage
        });
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
