// src/cdp/worker2.ts
// Service Worker and Web Worker inspection — complements worker.ts, workers.ts, and serviceworker.ts.
import { CdpClient } from './client';

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): McpResult {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// ---------------------------------------------------------------------------
// 1. getServiceWorkerStatus
// ---------------------------------------------------------------------------

/**
 * Check navigator.serviceWorker.controller and navigator.serviceWorker.ready.
 * Result: { supported, hasController, controllerState, scriptURL }
 */
export async function getServiceWorkerStatus(
  client: CdpClient,
): Promise<McpResult> {
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
// 2. getServiceWorkerRegistrations2
// ---------------------------------------------------------------------------
// NOTE: getServiceWorkerRegistrations is already exported from network3.ts.
// This version returns richer data: { scope, active, installing, waiting } per registration.

/**
 * Call navigator.serviceWorker.getRegistrations().
 * Result: { registrations: [{ scope, active, installing, waiting }] } or { supported: false }
 */
export async function getServiceWorkerRegistrations2(
  client: CdpClient,
): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false };
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
// 3. getCacheStorageNames
// ---------------------------------------------------------------------------

/**
 * Call caches.keys() to list all Cache Storage cache names for this origin.
 * Result: { caches: string[], count: number } or { supported: false }
 */
export async function getCacheStorageNames(
  client: CdpClient,
): Promise<McpResult> {
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
// 4. getCacheEntryCount
// ---------------------------------------------------------------------------

/**
 * Open a named cache and count entries via cache.keys().
 * Result: { cacheName, count }
 */
export async function getCacheEntryCount(
  client: CdpClient,
  cacheName: string,
): Promise<McpResult> {
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
// 5. clearCacheStorage
// ---------------------------------------------------------------------------

/**
 * Delete all entries in a named cache via caches.delete(cacheName).
 * Result: { deleted: boolean, cacheName }
 */
export async function clearCacheStorage(
  client: CdpClient,
  cacheName: string,
): Promise<McpResult> {
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
// 6. getWebWorkerCount
// ---------------------------------------------------------------------------

/**
 * Inject a counter into window.__webWorkerCount by patching the Worker constructor.
 * If already patched, return current count.
 * Result: { count: number, patched: boolean }
 */
export async function getWebWorkerCount(
  client: CdpClient,
): Promise<McpResult> {
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
// 7. getBroadcastChannels
// ---------------------------------------------------------------------------

/**
 * Check window.__broadcastChannels (requires prior injection).
 * Inject a BroadcastChannel constructor patch if not already done.
 * Result: { channels: string[], count: number, patched: boolean }
 */
export async function getBroadcastChannels(
  client: CdpClient,
): Promise<McpResult> {
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
// 8. getSharedWorkerCount
// ---------------------------------------------------------------------------

/**
 * Inject a SharedWorker constructor patch to count invocations in window.__sharedWorkerCount.
 * Result: { count: number, patched: boolean }
 */
export async function getSharedWorkerCount(
  client: CdpClient,
): Promise<McpResult> {
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
