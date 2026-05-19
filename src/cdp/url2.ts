// src/cdp/url2.ts
import { CdpClient } from './client';

export async function getUrlParts(client: CdpClient): Promise<{
  href: string;
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
}> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({href:location.href,protocol:location.protocol,host:location.host,pathname:location.pathname,search:location.search,hash:location.hash,origin:location.origin})',
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

export async function getQueryParams(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Object.fromEntries(new URLSearchParams(location.search).entries()))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

export async function setQueryParam(client: CdpClient, key: string, value: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const u = new URL(location.href);
  u.searchParams.set(${JSON.stringify(key)}, ${JSON.stringify(value)});
  history.replaceState(null, '', u.toString());
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function removeQueryParam(client: CdpClient, key: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const u = new URL(location.href);
  u.searchParams.delete(${JSON.stringify(key)});
  history.replaceState(null, '', u.toString());
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function getHashFragment(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.hash',
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

export async function setHashFragment(client: CdpClient, hash: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.hash = ${JSON.stringify(hash)}`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function navigateToHash(client: CdpClient, elementId: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.getElementById(${JSON.stringify(elementId)});
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  location.hash = ${JSON.stringify('#' + elementId)};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function getNavigationHistory(
  client: CdpClient,
): Promise<{ currentIndex: number; entries: Array<{ url: string; title: string }> }> {
  const { currentIndex, entries } = await (client.raw.Page as any).getNavigationHistory();
  return {
    currentIndex,
    entries: (entries as Array<{ id: number; url: string; userTypedURL: string; title: string; transitionType: string }>).map(
      ({ url, title }) => ({ url, title }),
    ),
  };
}

// --- ok/err helpers for tool-style functions below ---
function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. parseCurrentUrl — parse window.location into parts
export async function parseCurrentUrl(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({href:window.location.href,protocol:window.location.protocol,host:window.location.host,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash,port:window.location.port})',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 2. getQueryParams2 — parse URL query string into key-value pairs (getQueryParams conflicts with existing export)
export async function getQueryParams2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify(Object.fromEntries(new URLSearchParams(window.location.search).entries()))',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 3. getUrlFragment — get window.location.hash value
export async function getUrlFragment(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.hash',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as string);
}

// 4. setUrlFragment — set window.location.hash = fragment
export async function setUrlFragment(
  client: CdpClient,
  fragment: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.hash = ${JSON.stringify(fragment)}`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok('Fragment set');
}

// 5. getOrigin — get window.location.origin
export async function getOrigin(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.origin',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as string);
}

// 6. isHttps — check if current URL uses https protocol
export async function isHttps(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'window.location.protocol === "https:"',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value as boolean);
}

// 7. getPathSegments — split pathname by "/" and return non-empty segments
export async function getPathSegments(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify(window.location.pathname.split("/").filter(function(s){return s.length>0;}))',
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(JSON.parse(result.value as string));
}

// 8. navigateTo — set window.location.href = url (triggers navigation)
export async function navigateTo(
  client: CdpClient,
  url: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.location.href = ${JSON.stringify(url)}`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok('Navigating to ' + url);
}
