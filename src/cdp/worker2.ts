// src/cdp/worker2.ts
// Service worker and browser worker inspection.
//
// Original 8 (imported by server.ts — must not be removed):
//   getServiceWorkerStatus, getServiceWorkerRegistrations2, getCacheStorageNames,
//   getCacheEntryCount, clearCacheStorage, getWebWorkerCount, getBroadcastChannels,
//   getSharedWorkerCount
//
// New 8 (requested addition — no server.ts wiring yet):
//   getServiceWorkers2, getWorkerCount2, getServiceWorkerScope, getBroadcastChannels2,
//   getCacheStorageKeys, getIndexedDBNames, getWorkerSupport, getNavigatorInfo
//
// Naming notes:
//   getServiceWorkers2    — getServiceWorkerRegistrations exists in network3.ts
//   getWorkerCount2       — getWorkerCount exists in workers.ts and worker.ts
//   getBroadcastChannels2 — getBroadcastChannels is the original name kept below
//   getCacheStorageKeys   — getCacheStorageNames is the original name kept below
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// ===========================================================================
// ORIGINAL 8 — required by server.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// getServiceWorkerStatus
// Check navigator.serviceWorker.controller and navigator.serviceWorker.ready.
// Result: { supported, hasController, controllerState, scriptURL }
// ---------------------------------------------------------------------------
export async function getServiceWorkerStatus(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, hasController: false, controllerState: null, scriptURL: null };
  }
  var ctrl = navigator.serviceWorker.controller;
  return {
    supported: true,
    hasController: ctrl !== null,
    controllerState: ctrl ? ctrl.state : null,
    scriptURL: ctrl ? ctrl.scriptURL : null
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getServiceWorkerRegistrations2
// NOTE: getServiceWorkerRegistrations is already exported from network3.ts.
// This version returns richer data: { scope, active, installing, waiting } per reg.
// Result: { registrations: [{ scope, active, installing, waiting }] } | { supported: false }
// ---------------------------------------------------------------------------
export async function getServiceWorkerRegistrations2(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve({ supported: false });
  }
  return navigator.serviceWorker.getRegistrations().then(function(regs) {
    return {
      registrations: regs.map(function(r) {
        return {
          scope: r.scope,
          active: r.active ? { state: r.active.state, scriptURL: r.active.scriptURL } : null,
          installing: r.installing ? { state: r.installing.state, scriptURL: r.installing.scriptURL } : null,
          waiting: r.waiting ? { state: r.waiting.state, scriptURL: r.waiting.scriptURL } : null
        };
      })
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getCacheStorageNames
// caches.keys() — list all Cache Storage cache names.
// Result: { caches: string[], count: number } | { supported: false }
// ---------------------------------------------------------------------------
export async function getCacheStorageNames(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof caches === 'undefined') {
    return Promise.resolve({ supported: false });
  }
  return caches.keys().then(function(names) {
    return { caches: names, count: names.length };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getCacheEntryCount
// Open a named cache and count entries via cache.keys().
// Result: { cacheName, count }
// ---------------------------------------------------------------------------
export async function getCacheEntryCount(client: CdpClient, cacheName: string) {
  const nameExpr = JSON.stringify(cacheName);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof caches === 'undefined') {
    return Promise.resolve({ cacheName: ${nameExpr}, count: 0 });
  }
  return caches.open(${nameExpr}).then(function(cache) {
    return cache.keys().then(function(keys) {
      return { cacheName: ${nameExpr}, count: keys.length };
    });
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// clearCacheStorage
// Delete a named cache via caches.delete(cacheName).
// Result: { deleted: boolean, cacheName }
// ---------------------------------------------------------------------------
export async function clearCacheStorage(client: CdpClient, cacheName: string) {
  const nameExpr = JSON.stringify(cacheName);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof caches === 'undefined') {
    return Promise.resolve({ deleted: false, cacheName: ${nameExpr} });
  }
  return caches.delete(${nameExpr}).then(function(deleted) {
    return { deleted: deleted, cacheName: ${nameExpr} };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getWebWorkerCount
// Inject a counter into window.__webWorkerCount by patching the Worker constructor.
// Result: { count: number, patched: boolean }
// ---------------------------------------------------------------------------
export async function getWebWorkerCount(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof Worker === 'undefined') {
    return { count: 0, patched: false };
  }
  if (window.__webWorkerCount !== undefined) {
    return { count: window.__webWorkerCount, patched: true };
  }
  window.__webWorkerCount = 0;
  var OrigWorker = Worker;
  window.Worker = function(scriptURL, options) {
    window.__webWorkerCount++;
    return new OrigWorker(scriptURL, options);
  };
  window.Worker.prototype = OrigWorker.prototype;
  return { count: window.__webWorkerCount, patched: true };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getBroadcastChannels
// Inject a BroadcastChannel constructor patch to track open channel names.
// Result: { channels: string[], count: number, patched: boolean }
// ---------------------------------------------------------------------------
export async function getBroadcastChannels(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof BroadcastChannel === 'undefined') {
    return { channels: [], count: 0, patched: false };
  }
  if (window.__broadcastChannels !== undefined) {
    return { channels: window.__broadcastChannels.slice(), count: window.__broadcastChannels.length, patched: true };
  }
  window.__broadcastChannels = [];
  var OrigBC = BroadcastChannel;
  window.BroadcastChannel = function(name) {
    window.__broadcastChannels.push(name);
    return new OrigBC(name);
  };
  window.BroadcastChannel.prototype = OrigBC.prototype;
  return { channels: [], count: 0, patched: true };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// getSharedWorkerCount
// Inject a SharedWorker constructor patch to count invocations.
// Result: { count: number, patched: boolean }
// ---------------------------------------------------------------------------
export async function getSharedWorkerCount(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof SharedWorker === 'undefined') {
    return { count: 0, patched: false };
  }
  if (window.__sharedWorkerCount !== undefined) {
    return { count: window.__sharedWorkerCount, patched: true };
  }
  window.__sharedWorkerCount = 0;
  var OrigShared = SharedWorker;
  window.SharedWorker = function(scriptURL, options) {
    window.__sharedWorkerCount++;
    return new OrigShared(scriptURL, options);
  };
  window.SharedWorker.prototype = OrigShared.prototype;
  return { count: window.__sharedWorkerCount, patched: true };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ===========================================================================
// NEW 8 — service worker and browser worker inspection additions
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. getServiceWorkers2
// navigator.serviceWorker.getRegistrations() — scope, state, scriptURL per reg.
// Renamed because getServiceWorkerRegistrations exists in network3.ts and
// getServiceWorkerRegistrations2 is already above.
// Result: { supported, registrations: [{ scope, state, scriptURL }] }
// ---------------------------------------------------------------------------
export async function getServiceWorkers2(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve({ supported: false, registrations: [] });
  }
  return navigator.serviceWorker.getRegistrations().then(function(regs) {
    return {
      supported: true,
      registrations: regs.map(function(r) {
        var sw = r.active || r.installing || r.waiting || null;
        return {
          scope: r.scope,
          state: sw ? sw.state : null,
          scriptURL: sw ? sw.scriptURL : null
        };
      })
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 2. getWorkerCount2
// Count service worker registrations: registered total vs active.
// Renamed because getWorkerCount exists in workers.ts and worker.ts.
// Result: { registered: number, active: number }
// ---------------------------------------------------------------------------
export async function getWorkerCount2(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve({ registered: 0, active: 0 });
  }
  return navigator.serviceWorker.getRegistrations().then(function(regs) {
    var active = regs.filter(function(r) { return r.active !== null; }).length;
    return { registered: regs.length, active: active };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 3. getServiceWorkerScope
// Service worker scope and controller state for the current page.
// Result: { supported, scope, state, scriptURL, isControlled }
// ---------------------------------------------------------------------------
export async function getServiceWorkerScope(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve({ supported: false, scope: null, state: null, scriptURL: null, isControlled: false });
  }
  var ctrl = navigator.serviceWorker.controller;
  return navigator.serviceWorker.getRegistrations().then(function(regs) {
    var activeReg = regs.find(function(r) { return r.active !== null; }) || regs[0] || null;
    return {
      supported: true,
      scope: activeReg ? activeReg.scope : null,
      state: ctrl ? ctrl.state : null,
      scriptURL: ctrl ? ctrl.scriptURL : null,
      isControlled: ctrl !== null
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 4. getBroadcastChannels2
// List BroadcastChannel names from window.__broadcastChannels (requires prior
// injection via getBroadcastChannels). Patches constructor if not yet patched.
// Renamed to avoid collision with getBroadcastChannels above.
// Result: { supported, channels: string[], count: number, patched: boolean }
// ---------------------------------------------------------------------------
export async function getBroadcastChannels2(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof BroadcastChannel === 'undefined') {
    return { supported: false, channels: [], count: 0, patched: false };
  }
  if (window.__broadcastChannels !== undefined) {
    return { supported: true, channels: window.__broadcastChannels.slice(), count: window.__broadcastChannels.length, patched: true };
  }
  window.__broadcastChannels = [];
  var OrigBC = BroadcastChannel;
  window.BroadcastChannel = function(name) {
    window.__broadcastChannels.push(name);
    return new OrigBC(name);
  };
  window.BroadcastChannel.prototype = OrigBC.prototype;
  return { supported: true, channels: [], count: 0, patched: true, note: 'constructor patched — open new channels to track them' };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 5. getCacheStorageKeys
// caches.keys() — list all Cache Storage cache names for this origin.
// Distinct export name from getCacheStorageNames (kept above for server.ts).
// Result: { supported, caches: string[], count: number }
// ---------------------------------------------------------------------------
export async function getCacheStorageKeys(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof caches === 'undefined') {
    return Promise.resolve({ supported: false, caches: [], count: 0 });
  }
  return caches.keys().then(function(names) {
    return { supported: true, caches: names, count: names.length };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 6. getIndexedDBNames
// indexedDB.databases() — list all IDB databases for this origin.
// Result: { supported, databases: [{ name, version }], count: number }
// ---------------------------------------------------------------------------
export async function getIndexedDBNames(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
    return Promise.resolve({ supported: false, databases: [], count: 0 });
  }
  return indexedDB.databases().then(function(dbs) {
    return {
      supported: true,
      databases: dbs.map(function(d) { return { name: d.name, version: d.version }; }),
      count: dbs.length
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 7. getWorkerSupport
// Feature-detect which worker-related APIs are available in this context.
// Result: { serviceWorker, sharedWorker, dedicatedWorker, broadcastChannel, cacheAPI }
// ---------------------------------------------------------------------------
export async function getWorkerSupport(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    sharedWorker: typeof SharedWorker !== 'undefined',
    dedicatedWorker: typeof Worker !== 'undefined',
    broadcastChannel: typeof BroadcastChannel !== 'undefined',
    cacheAPI: typeof caches !== 'undefined'
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// ---------------------------------------------------------------------------
// 8. getNavigatorInfo
// Key navigator properties for the current context.
// Result: { userAgent, language, languages, platform, onLine, cookieEnabled,
//           hardwareConcurrency, maxTouchPoints }
// ---------------------------------------------------------------------------
export async function getNavigatorInfo(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var n = navigator;
  return {
    userAgent: n.userAgent,
    language: n.language,
    languages: n.languages ? Array.prototype.slice.call(n.languages) : [],
    platform: n.platform,
    onLine: n.onLine,
    cookieEnabled: n.cookieEnabled,
    hardwareConcurrency: n.hardwareConcurrency !== undefined ? n.hardwareConcurrency : null,
    maxTouchPoints: n.maxTouchPoints !== undefined ? n.maxTouchPoints : null
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}
