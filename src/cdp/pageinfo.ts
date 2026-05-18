// src/cdp/pageinfo.ts
import { CdpClient } from './client';

// Returns the lang attribute of <html>, or 'unknown' if not set.
export async function getPageLanguage(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.documentElement.lang || 'unknown'`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

// Returns document.characterSet (e.g. 'UTF-8').
export async function getCharset(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.characterSet`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

// Returns the href of <link rel="canonical">, or null if not present.
export async function getCanonicalUrl(client: CdpClient): Promise<string | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector('link[rel="canonical"]');
  return el ? el.getAttribute('href') : null;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? null) as string | null;
}

// Returns all Open Graph meta tags as a plain object keyed by property name.
// e.g. { 'og:title': 'Page Title', 'og:description': '...' }
export async function getOpenGraphTags(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('meta[property^="og:"]')).reduce((acc, el) => {
  const prop = el.getAttribute('property');
  const content = el.getAttribute('content');
  if (prop !== null && content !== null) acc[prop] = content;
  return acc;
}, {}))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as Record<string, string>;
}

// Returns all Twitter Card meta tags as a plain object keyed by name.
// e.g. { 'twitter:card': 'summary_large_image', 'twitter:title': '...' }
export async function getTwitterCardTags(client: CdpClient): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('meta[name^="twitter:"]')).reduce((acc, el) => {
  const name = el.getAttribute('name');
  const content = el.getAttribute('content');
  if (name !== null && content !== null) acc[name] = content;
  return acc;
}, {}))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as Record<string, string>;
}

// Returns an array of parsed JSON-LD structured data objects from all
// <script type="application/ld+json"> tags. Entries that fail JSON.parse are skipped.
export async function getStructuredData(client: CdpClient): Promise<unknown[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('script[type="application/ld+json"]')).reduce((acc, el) => {
  try {
    acc.push(JSON.parse(el.textContent || ''));
  } catch (e) {
    // skip malformed blocks
  }
  return acc;
}, []))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as unknown[];
}

// Returns the word count of document.body.innerText, split on whitespace.
export async function getPageWordCount(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const text = (document.body && document.body.innerText) ? document.body.innerText.trim() : '';
  if (!text) return 0;
  return text.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

// Returns all anchor tags whose href starts with 'http' and whose host differs
// from the current page's host, as an array of { href, text }.
export async function getExternalLinks(
  client: CdpClient,
): Promise<Array<{ href: string; text: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).reduce(function(acc, el) {
  var href = el.getAttribute('href') || '';
  if (href.indexOf('http') !== 0) return acc;
  try {
    var url = new URL(href);
    if (url.host !== window.location.host) {
      acc.push({ href: href, text: (el.textContent || '').trim() });
    }
  } catch (e) {
    // skip unparseable hrefs
  }
  return acc;
}, []))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as Array<{ href: string; text: string }>;
}
