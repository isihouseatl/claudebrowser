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
