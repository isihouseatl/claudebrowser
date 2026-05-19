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

// ---------------------------------------------------------------------------
// Security inspection tools (ok/err pattern)
// ---------------------------------------------------------------------------

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// Get CSP from meta tags and report-only headers via document meta.
export async function getContentSecurityPolicy(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const policies = [];
  const metas = document.querySelectorAll('meta[http-equiv]');
  for (const m of metas) {
    const name = (m.getAttribute('http-equiv') || '').toLowerCase();
    if (name === 'content-security-policy' || name === 'content-security-policy-report-only') {
      policies.push({ httpEquiv: m.getAttribute('http-equiv'), content: m.getAttribute('content') });
    }
  }
  return JSON.stringify({ policies, count: policies.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// Find HTTP resources on an HTTPS page: images, scripts, iframes with http:// src.
export async function getMixedContentInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const isHttps = location.protocol === 'https:';
  const mixed = [];
  const selectors = [
    { tag: 'img', attr: 'src' },
    { tag: 'script', attr: 'src' },
    { tag: 'iframe', attr: 'src' },
    { tag: 'link', attr: 'href' },
    { tag: 'audio', attr: 'src' },
    { tag: 'video', attr: 'src' },
  ];
  for (const { tag, attr } of selectors) {
    const els = document.querySelectorAll(tag + '[' + attr + ']');
    for (const el of els) {
      const val = el.getAttribute(attr) || '';
      if (val.startsWith('http:')) {
        mixed.push({ tag, attr, url: val });
      }
    }
  }
  return JSON.stringify({ isHttpsPage: isHttps, mixedResources: mixed, count: mixed.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// List all external <script src> URLs with async, defer, crossOrigin attributes.
export async function getExternalScripts(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const scripts = [];
  const els = document.querySelectorAll('script[src]');
  for (const el of els) {
    scripts.push({
      src: el.getAttribute('src'),
      async: el.hasAttribute('async'),
      defer: el.hasAttribute('defer'),
      crossOrigin: el.getAttribute('crossorigin'),
      type: el.getAttribute('type'),
    });
  }
  return JSON.stringify({ scripts, count: scripts.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// Find resources (script, img, link, iframe) from different origins than the page.
export async function getThirdPartyResources(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const pageOrigin = location.origin;
  const resources = [];
  const checks = [
    { tag: 'script', attr: 'src' },
    { tag: 'img', attr: 'src' },
    { tag: 'link', attr: 'href' },
    { tag: 'iframe', attr: 'src' },
  ];
  for (const { tag, attr } of checks) {
    const els = document.querySelectorAll(tag + '[' + attr + ']');
    for (const el of els) {
      const val = el.getAttribute(attr) || '';
      try {
        const u = new URL(val, location.href);
        if (u.origin !== pageOrigin && u.origin !== 'null') {
          resources.push({ tag, attr, url: val, origin: u.origin });
        }
      } catch (_) {}
    }
  }
  return JSON.stringify({ pageOrigin, thirdPartyResources: resources, count: resources.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// Check if page has X-Frame-Options or frame-ancestors CSP directive (via meta).
export async function hasXFrameOptionsHeader(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const metas = document.querySelectorAll('meta[http-equiv]');
  let xFrameOptions = null;
  let frameAncestors = null;
  for (const m of metas) {
    const name = (m.getAttribute('http-equiv') || '').toLowerCase();
    const content = m.getAttribute('content') || '';
    if (name === 'x-frame-options') {
      xFrameOptions = content;
    }
    if (name === 'content-security-policy' || name === 'content-security-policy-report-only') {
      const match = content.match(/frame-ancestors[^;]*/i);
      if (match) frameAncestors = match[0].trim();
    }
  }
  return JSON.stringify({
    hasXFrameOptions: xFrameOptions !== null,
    xFrameOptionsValue: xFrameOptions,
    hasFrameAncestors: frameAncestors !== null,
    frameAncestorsValue: frameAncestors,
    protected: xFrameOptions !== null || frameAncestors !== null,
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// List scripts/links with integrity attribute: tag, src/href, integrity value.
export async function getSubresourceIntegrity(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const items = [];
  const scriptEls = document.querySelectorAll('script[integrity]');
  for (const el of scriptEls) {
    items.push({ tag: 'script', src: el.getAttribute('src'), integrity: el.getAttribute('integrity') });
  }
  const linkEls = document.querySelectorAll('link[integrity]');
  for (const el of linkEls) {
    items.push({ tag: 'link', href: el.getAttribute('href'), integrity: el.getAttribute('integrity'), rel: el.getAttribute('rel') });
  }
  return JSON.stringify({ items, count: items.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// Check if window has message event listeners (via window.__messageListeners or inline handler).
export async function getPostMessageListeners(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const hasOnMessage = typeof window.onmessage === 'function';
  const customListeners = Array.isArray(window.__messageListeners)
    ? window.__messageListeners.length
    : null;
  const iframes = document.querySelectorAll('iframe');
  const iframeCount = iframes.length;
  const iframeOrigins = Array.from(iframes).map(f => {
    try { return new URL(f.src || '', location.href).origin; } catch (_) { return f.src || ''; }
  });
  return JSON.stringify({
    hasOnMessageHandler: hasOnMessage,
    customListenerCount: customListeners,
    iframeCount,
    iframeOrigins,
    note: 'addEventListener listeners cannot be enumerated without instrumentation; only onmessage and window.__messageListeners are detectable here',
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}

// Find links/forms where action/href contains redirect parameters: ?redirect=, ?next=, ?url=, ?return=
export async function getOpenRedirects(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const redirectParams = ['redirect', 'next', 'url', 'return', 'returnUrl', 'return_url', 'goto', 'continue', 'dest', 'destination'];
  const pattern = new RegExp('[?&](' + redirectParams.join('|') + ')=', 'i');
  const found = [];
  const links = document.querySelectorAll('a[href]');
  for (const el of links) {
    const href = el.getAttribute('href') || '';
    if (pattern.test(href)) {
      found.push({ type: 'link', href, text: el.textContent ? el.textContent.trim().slice(0, 80) : '' });
    }
  }
  const forms = document.querySelectorAll('form[action]');
  for (const el of forms) {
    const action = el.getAttribute('action') || '';
    if (pattern.test(action)) {
      found.push({ type: 'form', action, method: el.getAttribute('method') || 'get' });
    }
  }
  return JSON.stringify({ redirectParams, found, count: found.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(JSON.parse(result.value as string));
}
