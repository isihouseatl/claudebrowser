// src/cdp/network.ts
import { CdpClient } from './client';

export interface NetworkResponse {
  url: string;
  status: number;
  mimeType: string;
  requestId: string;
  timestamp: number;
}

// Wait for a network response whose URL contains the given pattern.
// Resolves with the response when it arrives.
// Rejects with timeout error if not seen within timeoutMs.
export async function waitForResponse(
  client: CdpClient,
  urlPattern: string,
  timeoutMs = 15000,
): Promise<NetworkResponse> {
  return new Promise<NetworkResponse>((resolve, reject) => {
    let settled = false;
    let removeListener: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      removeListener?.();
      reject(new Error(`waitForResponse: no response matching "${urlPattern}" within ${timeoutMs}ms`));
    }, timeoutMs);

    removeListener = client.raw.Network.responseReceived(({ requestId, response, timestamp }: {
      requestId: string;
      response: { url: string; status: number; mimeType: string };
      timestamp: number;
    }) => {
      if (settled) return;
      if (!response.url.includes(urlPattern)) return;
      settled = true;
      clearTimeout(timer);
      removeListener?.();
      resolve({
        url: response.url,
        status: response.status,
        mimeType: response.mimeType,
        requestId,
        timestamp,
      });
    }) as unknown as () => void;
  });
}

export interface InterceptRule {
  urlPattern: string;   // substring to match in request URL
  status?: number;      // response status code (default 200)
  body?: string;        // response body
  contentType?: string; // default 'application/json'
}

// Set up request interception: matching requests get the mock response.
// Returns a cleanup function to remove the interception.
// Uses CDP Fetch domain (must enable before requests fire).
export async function interceptRequest(
  client: CdpClient,
  rule: InterceptRule,
): Promise<() => Promise<void>> {
  const status = rule.status ?? 200;
  const contentType = rule.contentType ?? 'application/json';
  const body = rule.body ?? '';
  const bodyBase64 = Buffer.from(body).toString('base64');

  await client.raw.Fetch.enable({
    patterns: [{ urlPattern: '*', requestStage: 'Request' }],
  });

  const handler = ({ requestId, request }: {
    requestId: string;
    request: { url: string };
  }) => {
    if (request.url.includes(rule.urlPattern)) {
      client.raw.Fetch.fulfillRequest({
        requestId,
        responseCode: status,
        responseHeaders: [
          { name: 'Content-Type', value: contentType },
        ],
        body: bodyBase64,
      }).catch(() => {
        // Request may have already completed; ignore stale fulfillment errors.
      });
    } else {
      client.raw.Fetch.continueRequest({ requestId }).catch(() => {
        // Request may have already completed; ignore stale continuation errors.
      });
    }
  };

  const removeHandler = client.raw.Fetch.requestPaused(handler) as unknown as () => void;

  const cleanup = async (): Promise<void> => {
    removeHandler?.();
    await client.raw.Fetch.disable();
  };

  return cleanup;
}

// Remove all active request interceptions
export async function clearInterceptions(client: CdpClient): Promise<void> {
  await client.raw.Fetch.disable();
}

// Get the response body for a captured request by requestId.
// requestId comes from waitForResponse() or browser_network_log_get entries.
// Returns decoded string body (decodes base64 if needed).
export async function getResponseBody(client: CdpClient, requestId: string): Promise<string> {
  const result = await (client.raw.Network as any).getResponseBody({ requestId });
  if (!result) throw new Error(`No response body for requestId: ${requestId}`);
  if (result.base64Encoded) {
    return Buffer.from(result.body as string, 'base64').toString('utf8');
  }
  return result.body as string;
}

// Set extra HTTP headers sent with every request (e.g. auth tokens, custom headers)
export async function setExtraHeaders(
  client: CdpClient,
  headers: Record<string, string>,
): Promise<void> {
  await (client.raw.Network as any).setExtraHTTPHeaders({ headers });
}

// Clear extra HTTP headers (pass empty object)
export async function clearExtraHeaders(client: CdpClient): Promise<void> {
  await (client.raw.Network as any).setExtraHTTPHeaders({ headers: {} });
}

// ---------------------------------------------------------------------------
// URL blocking
// ---------------------------------------------------------------------------

// Block requests to URLs matching the given patterns (glob-style, CDP semantics).
export async function blockUrls(client: CdpClient, patterns: string[]): Promise<void> {
  await (client.raw.Network as any).setBlockedURLs({ urls: patterns });
}

// Clear all blocked URL patterns.
export async function clearBlockedUrls(client: CdpClient): Promise<void> {
  await (client.raw.Network as any).setBlockedURLs({ urls: [] });
}

// ---------------------------------------------------------------------------
// CORS override
// ---------------------------------------------------------------------------

// Enable CORS bypass: intercepts every response via CDP Fetch and injects
// Access-Control-Allow-Origin: * (plus ACAO credentials / methods headers).
// Returns a cleanup function that disables the override.
export async function enableCorsOverride(client: CdpClient): Promise<() => Promise<void>> {
  await client.raw.Fetch.enable({
    patterns: [{ urlPattern: '*', requestStage: 'Response' }],
  });

  const handler = ({ requestId, responseHeaders }: {
    requestId: string;
    responseHeaders?: Array<{ name: string; value: string }>;
  }) => {
    const headers = (responseHeaders ?? []).filter(
      (h) =>
        !h.name.toLowerCase().startsWith('access-control-'),
    );
    headers.push(
      { name: 'Access-Control-Allow-Origin', value: '*' },
      { name: 'Access-Control-Allow-Methods', value: '*' },
      { name: 'Access-Control-Allow-Headers', value: '*' },
    );
    client.raw.Fetch.continueRequest({
      requestId,
      headers,
    } as any).catch(() => {});
  };

  const removeHandler = client.raw.Fetch.requestPaused(handler) as unknown as () => void;

  return async (): Promise<void> => {
    removeHandler?.();
    await client.raw.Fetch.disable();
  };
}

// ---------------------------------------------------------------------------
// Response header capture
// ---------------------------------------------------------------------------

// Per-client map: requestId -> response headers (populated by startHeaderCapture).
const headerStore = new WeakMap<object, Map<string, Record<string, string>>>();

// Begin capturing response headers for this client. Idempotent — safe to call
// multiple times. Should be called once after Network.enable().
export function startHeaderCapture(client: CdpClient): void {
  if (headerStore.has(client.raw)) return;

  const map = new Map<string, Record<string, string>>();
  headerStore.set(client.raw, map);

  client.raw.Network.responseReceived(({
    requestId,
    response,
  }: {
    requestId: string;
    response: { headers?: Record<string, string> };
  }) => {
    if (response.headers) {
      map.set(requestId, response.headers);
    }
  });
}

// Stop capturing and clear stored headers for this client.
export function stopHeaderCapture(client: CdpClient): void {
  headerStore.delete(client.raw);
}

// Return the captured response headers for a requestId.
// Throws if startHeaderCapture was never called or the requestId is unknown.
export async function getResponseHeaders(
  client: CdpClient,
  requestId: string,
): Promise<Record<string, string>> {
  const map = headerStore.get(client.raw);
  if (!map) {
    throw new Error('getResponseHeaders: call startHeaderCapture(client) first');
  }
  const headers = map.get(requestId);
  if (!headers) {
    throw new Error(`getResponseHeaders: no captured headers for requestId "${requestId}"`);
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Network quiet detection
// ---------------------------------------------------------------------------

// Resolves when the in-flight request count has been 0 for idleMs continuously.
// Rejects after timeoutMs if network never quiets.
export async function waitForNetworkQuiet(
  client: CdpClient,
  idleMs = 500,
  timeoutMs = 30000,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let inFlight = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let globalTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      clearTimeout(idleTimer);
      clearTimeout(globalTimer);
      removeRequest?.();
      removeFinished?.();
      removeFailed?.();
    };

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      err ? reject(err) : resolve();
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      if (inFlight === 0) {
        idleTimer = setTimeout(() => settle(), idleMs);
      }
    };

    globalTimer = setTimeout(
      () => settle(new Error(`waitForNetworkQuiet: network did not quiet within ${timeoutMs}ms`)),
      timeoutMs,
    );

    const removeRequest = client.raw.Network.requestWillBeSent(() => {
      inFlight++;
      clearTimeout(idleTimer);
    }) as unknown as () => void;

    const removeFinished = client.raw.Network.loadingFinished(() => {
      inFlight = Math.max(0, inFlight - 1);
      resetIdleTimer();
    }) as unknown as () => void;

    const removeFailed = client.raw.Network.loadingFailed(() => {
      inFlight = Math.max(0, inFlight - 1);
      resetIdleTimer();
    }) as unknown as () => void;

    // Start the idle timer immediately in case nothing is in-flight yet.
    resetIdleTimer();
  });
}

// ---------------------------------------------------------------------------
// One-shot request blocking
// ---------------------------------------------------------------------------

// Abort the next request whose URL contains urlPattern, then remove the
// interception. Returns a cleanup function to cancel early if needed.
export async function blockNextRequest(
  client: CdpClient,
  urlPattern: string,
): Promise<() => Promise<void>> {
  await client.raw.Fetch.enable({
    patterns: [{ urlPattern: '*', requestStage: 'Request' }],
  });

  let triggered = false;

  const handler = ({ requestId, request }: {
    requestId: string;
    request: { url: string };
  }) => {
    if (!triggered && request.url.includes(urlPattern)) {
      triggered = true;
      client.raw.Fetch.failRequest({
        requestId,
        errorReason: 'BlockedByClient',
      } as any).catch(() => {});
      removeHandler?.();
      client.raw.Fetch.disable().catch(() => {});
    } else {
      client.raw.Fetch.continueRequest({ requestId }).catch(() => {});
    }
  };

  let removeHandler: (() => void) | undefined =
    client.raw.Fetch.requestPaused(handler) as unknown as () => void;

  return async (): Promise<void> => {
    if (!triggered) {
      removeHandler?.();
      removeHandler = undefined;
      await client.raw.Fetch.disable();
    }
  };
}
