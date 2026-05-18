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
