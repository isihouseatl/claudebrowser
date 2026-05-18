// src/cdp/network3.ts
// Browser/page network environment introspection — complements network.ts and network2.ts.
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---------------------------------------------------------------------------
// 1. getConnectionType
// ---------------------------------------------------------------------------

/**
 * Return network connection info from `navigator.connection` (Network Information API).
 * The API may be undefined in Firefox and Safari — returns nulls gracefully.
 * Result: { type, effectiveType, downlink, rtt }
 */
export async function getConnectionType(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!c) {
          return { type: null, effectiveType: null, downlink: null, rtt: null };
        }
        return {
          type: c.type || null,
          effectiveType: c.effectiveType || null,
          downlink: typeof c.downlink === 'number' ? c.downlink : null,
          rtt: typeof c.rtt === 'number' ? c.rtt : null
        };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('navigator.connection returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. isOnline
// ---------------------------------------------------------------------------

/**
 * Return whether the browser currently reports an online state.
 * Result: { online: boolean }
 */
export async function isOnline(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        return { online: navigator.onLine };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('navigator.onLine returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. getPageLocation
// ---------------------------------------------------------------------------

/**
 * Return hostname, port, and origin from window.location.
 * Result: { hostname, port, origin }
 *
 * Note: getPageProtocol already exists in network2.ts and returns only
 * window.location.protocol. This function returns the complementary fields.
 */
export async function getPageLocation(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        return {
          hostname: location.hostname,
          port: location.port,
          origin: location.origin
        };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('location returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. getOpenWebSockets
// ---------------------------------------------------------------------------

/**
 * WebSocket connections are not enumerable from page context.
 * Returns a static informational response.
 * Result: { count: 'unknown', note: string }
 */
export async function getOpenWebSockets(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    return ok(
      JSON.stringify({
        count: 'unknown',
        note: 'WebSocket connections not enumerable from page context',
      }),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. getServiceWorkerRegistrations
// ---------------------------------------------------------------------------

/**
 * Return all service worker registrations visible to the page via
 * `navigator.serviceWorker.getRegistrations()`.
 * Each entry includes { scope, state } where state is the installing/waiting/active
 * worker state, or null if that slot is empty.
 *
 * Note: getServiceWorkerInfo in network2.ts returns the active *controller* only.
 * This function enumerates *all registrations* (including waiting/installing workers).
 *
 * Result: array of { scope, state }
 */
export async function getServiceWorkerRegistrations(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        if (!('serviceWorker' in navigator)) {
          return [];
        }
        return navigator.serviceWorker.getRegistrations().then(function(regs) {
          return regs.map(function(r) {
            var worker = r.active || r.waiting || r.installing;
            return {
              scope: r.scope,
              state: worker ? worker.state : null
            };
          });
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('getRegistrations returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. getBeaconSupport
// ---------------------------------------------------------------------------

/**
 * Return whether `navigator.sendBeacon` is available in the page.
 * Result: { supported: boolean }
 */
export async function getBeaconSupport(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        return { supported: typeof navigator.sendBeacon !== 'undefined' };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('sendBeacon check returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. getPageReferrer
// ---------------------------------------------------------------------------

/**
 * Return the document referrer for the current page.
 * Result: { referrer: string } — empty string if no referrer.
 */
export async function getPageReferrer(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        return { referrer: document.referrer };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    if (result.value === null || result.value === undefined) {
      return err('document.referrer returned null');
    }
    return ok(JSON.stringify(result.value));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
