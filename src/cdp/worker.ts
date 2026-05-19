// src/cdp/worker.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// 1. Check if Web Workers are supported
export async function isWorkerSupported(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `typeof Worker !== 'undefined'`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok({ supported: result.value as boolean });
}

// 2. Check if SharedWorker is supported
export async function isSharedWorkerSupported(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `typeof SharedWorker !== 'undefined'`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok({ supported: result.value as boolean });
}

// 3. Count active workers tracked via window.__workerRegistry
export async function getWorkerCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `typeof window.__workerRegistry !== 'undefined' ? window.__workerRegistry.length : 0`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok({ count: result.value as number, note: 'requires worker registry injection' });
}

// 4. Inject a worker registry that patches the Worker constructor to track instances
export async function injectWorkerRegistry(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  if (window.__workerRegistry) return 'already-injected';
  window.__workerRegistry = [];
  var OrigWorker = window.Worker;
  window.Worker = function(url, opts) {
    var w = new OrigWorker(url, opts);
    window.__workerRegistry.push({ url: String(url), created: Date.now() });
    return w;
  };
  window.Worker.prototype = OrigWorker.prototype;
  return 'injected';
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// 5. Post a message to a named BroadcastChannel (proxy for SharedWorker messaging)
export async function postMessageToSharedWorker(
  client: CdpClient,
  name: string,
  message: unknown,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `new BroadcastChannel(${JSON.stringify(name)}).postMessage(${JSON.stringify(message)})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok('Message posted to channel');
}

// 6. Check if BroadcastChannel is available
export async function isBroadcastChannelSupported(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `typeof BroadcastChannel !== 'undefined'`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok({ supported: result.value as boolean });
}

// 7. Get all entries in the worker registry
export async function getWorkerRegistryEntries(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(window.__workerRegistry || [])`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// 8. Clear the worker registry
export async function clearWorkerRegistry(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.__workerRegistry = []; 'cleared'`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok('Worker registry cleared');
}
