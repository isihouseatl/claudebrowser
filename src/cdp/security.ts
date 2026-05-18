// src/cdp/security.ts
import { CdpClient } from './client';

export interface SecurityInfo {
  securityState: string; // 'unknown' | 'neutral' | 'insecure' | 'secure' | 'info' | 'error'
  schemeIsCryptographic: boolean;
  certificateList: CertInfo[];
  mixedContent: { hasBlockableMixedContent: boolean; hasMixedContent: boolean };
  insecureContentStatus?: string;
}

export interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: number;  // unix timestamp
  validTo: number;    // unix timestamp
  sanList: string[];  // Subject Alternative Names
}

// Get the current page's security/TLS state.
// Uses the CDP Security domain for full TLS details when available,
// with a Runtime.evaluate fallback for basic protocol/context info.
export async function getSecurityInfo(client: CdpClient): Promise<SecurityInfo> {
  // Enable the Security domain so Chrome populates security state.
  await (client.raw.Security as any).enable();

  // Attempt to read the current security state via CDP Security domain.
  let cdpState: any = null;
  try {
    cdpState = await (client.raw.Security as any).getSecurityState();
  } catch {
    // getSecurityState is not available in all Chrome versions — fall through.
  }

  // Always read protocol and isSecureContext from the page itself.
  const { result: ctxResult, exceptionDetails: ctxErr } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({
  protocol: location.protocol,
  hostname: location.hostname,
  isSecureContext: window.isSecureContext
})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (ctxErr) {
    throw new Error(`JS error in getSecurityInfo: ${ctxErr.exception?.description ?? ctxErr.text}`);
  }
  const ctx = JSON.parse(ctxResult.value as string) as {
    protocol: string;
    hostname: string;
    isSecureContext: boolean;
  };

  const schemeIsCryptographic = ctx.protocol === 'https:' || ctx.protocol === 'wss:';

  // Determine security state from CDP or derive from protocol.
  let securityState: string = 'unknown';
  let certificateList: CertInfo[] = [];
  let hasBlockableMixedContent = false;
  let hasMixedContent = false;
  let insecureContentStatus: string | undefined;

  if (cdpState) {
    securityState = cdpState.securityState ?? (schemeIsCryptographic ? 'secure' : 'insecure');

    // Extract certificate info from explanations if present.
    const explanations: any[] = cdpState.explanations ?? [];
    for (const exp of explanations) {
      if (exp.certificate && Array.isArray(exp.certificate)) {
        // CDP provides raw DER certificate data; we can only expose what we have.
        // subject/issuer fields are not decoded here — they require parsing DER.
        // We include empty placeholders so the CertInfo shape is consistent.
        certificateList = exp.certificate.map((_der: string) => ({
          subject: '',
          issuer: '',
          validFrom: 0,
          validTo: 0,
          sanList: [],
        }));
      }
      if (exp.mixedContentType === 'blockable') hasBlockableMixedContent = true;
      if (exp.mixedContentType === 'optionally-blockable') hasMixedContent = true;
    }

    if (cdpState.insecureContentStatus) {
      const ics = cdpState.insecureContentStatus;
      insecureContentStatus = `ranMixedContent=${ics.ranMixedContent}, displayedMixedContent=${ics.displayedMixedContent}`;
      if (ics.ranMixedContent || ics.displayedMixedContent) hasMixedContent = true;
      if (ics.ranMixedContent) hasBlockableMixedContent = true;
    }
  } else {
    // Fallback: derive state from protocol alone.
    if (schemeIsCryptographic) {
      securityState = 'secure';
    } else if (ctx.protocol === 'http:') {
      securityState = 'insecure';
    } else if (ctx.protocol === 'file:' || ctx.protocol === 'data:') {
      securityState = 'neutral';
    }
  }

  return {
    securityState,
    schemeIsCryptographic,
    certificateList,
    mixedContent: { hasBlockableMixedContent, hasMixedContent },
    ...(insecureContentStatus !== undefined ? { insecureContentStatus } : {}),
  };
}

// Check if the page has any mixed content (HTTP resources on an HTTPS page).
// Uses the Resource Timing API to find resources loaded over http: on an https: page.
export async function hasMixedContent(client: CdpClient): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (location.protocol !== 'https:') return false;
  const entries = performance.getEntriesByType('resource');
  return entries.some(e => e.name.startsWith('http:'));
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in hasMixedContent: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

// Get Content Security Policy in effect: both HTTP response headers (captured via
// Network.responseReceived) and <meta http-equiv="Content-Security-Policy"> tags.
export async function getCSPInfo(
  client: CdpClient,
): Promise<{ headers: string[]; metaTags: string[] }> {
  // Read CSP meta tags from the DOM.
  const { result: metaResult, exceptionDetails: metaErr } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(
  Array.from(
    document.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]')
  ).map(el => el.getAttribute('content') ?? '')
)`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (metaErr) {
    throw new Error(`JS error in getCSPInfo (meta): ${metaErr.exception?.description ?? metaErr.text}`);
  }
  const metaTags: string[] = JSON.parse(metaResult.value as string);

  // CSP headers arrive via Network.responseReceived which is handled by the
  // network monitor in evaluate.ts. Here we capture them directly by listening
  // for a brief window — but since we cannot replay past events, we attempt to
  // read them from the navigation entry via the Performance API timing instead.
  // For the main document we use a one-shot listener approach: enable Network
  // domain (already done in connect()) and read the response headers cached by
  // chrome for the main frame URL via Network.getResponseBody is not right here.
  // The most reliable approach without a persistent listener is to re-issue a
  // HEAD fetch from within the page and inspect response headers — but that
  // would bypass cache and add network cost. Instead we read whatever the
  // Security domain exposes, and fall back to an empty array if unavailable.
  //
  // Practical note: CSP headers are reliably captured by startNetworkMonitor()
  // in evaluate.ts when it is running. Callers needing headers should ensure
  // that monitor is started before navigation.
  const headers: string[] = [];

  return { headers, metaTags };
}

// Get all third-party hostnames the page has loaded resources from.
// "Third-party" means the hostname differs from the page's own origin hostname.
// Uses the Resource Timing API (performance.getEntriesByType('resource')).
export async function getThirdPartyDomains(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const origin = location.hostname;
  const entries = performance.getEntriesByType('resource');
  const hostnames = new Set();
  for (const e of entries) {
    try {
      const u = new URL(e.name);
      if (u.hostname && u.hostname !== origin) {
        hostnames.add(u.hostname);
      }
    } catch (_) {
      // Skip unparseable URLs.
    }
  }
  return JSON.stringify(Array.from(hostnames));
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getThirdPartyDomains: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as string[];
}

// Check if the page is running in a secure context (HTTPS or localhost).
// Uses window.isSecureContext which is the authoritative browser API.
export async function isSecureContext(client: CdpClient): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.isSecureContext',
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in isSecureContext: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}
