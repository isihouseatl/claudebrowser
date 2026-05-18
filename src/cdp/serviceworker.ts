// src/cdp/serviceworker.ts
import { CdpClient } from './client';

export interface ServiceWorkerRegistration {
  scopeURL: string;
  isDeleted: boolean;
  registrationId?: string;
}

export interface ServiceWorkerVersion {
  versionId: string;
  registrationId: string;
  scriptURL: string;
  runningStatus: string; // 'stopped' | 'starting' | 'running' | 'stopping'
  status: string;        // 'new' | 'installing' | 'installed' | 'activating' | 'activated' | 'redundant'
}

// List all registered service workers for the current page (via JS API)
export async function listServiceWorkers(
  client: CdpClient,
): Promise<ServiceWorkerRegistration[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.serviceWorker.getRegistrations().then(regs =>
  regs.map(r => ({ scopeURL: r.scope, isDeleted: false }))
)`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  if (!Array.isArray(result.value)) {
    return [];
  }
  return result.value as ServiceWorkerRegistration[];
}

// Unregister a service worker by scope URL. Returns true if found and unregistered.
export async function unregisterServiceWorker(
  client: CdpClient,
  scopeUrl: string,
): Promise<boolean> {
  const scopeExpr = JSON.stringify(scopeUrl);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.serviceWorker.getRegistrations().then(async regs => {
  const reg = regs.find(r => r.scope === ${scopeExpr});
  if (!reg) return false;
  return reg.unregister();
})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as boolean;
}

// Update (re-fetch) a service worker registration by scope URL.
export async function updateServiceWorker(
  client: CdpClient,
  scopeUrl: string,
): Promise<void> {
  const scopeExpr = JSON.stringify(scopeUrl);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.serviceWorker.getRegistrations().then(async regs => {
  const reg = regs.find(r => r.scope === ${scopeExpr});
  if (!reg) throw new Error('No service worker with scope: ' + ${scopeExpr});
  return reg.update();
})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Check if the current page is controlled by a service worker.
export async function isControlledByServiceWorker(client: CdpClient): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `!!navigator.serviceWorker.controller`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as boolean;
}
