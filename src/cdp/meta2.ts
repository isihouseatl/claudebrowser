// src/cdp/meta2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// Get content of <meta name="description">. Returns JSON { description: string|null }.
export async function getMetaDescription(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ description: document.querySelector('meta[name="description"]') ? document.querySelector('meta[name="description"]').getAttribute('content') : null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get content of <meta name="keywords">. Returns JSON { keywords: string|null }.
export async function getMetaKeywords(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ keywords: document.querySelector('meta[name="keywords"]') ? document.querySelector('meta[name="keywords"]').getAttribute('content') : null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get content of <meta name="robots">. Returns JSON { robots: string|null }.
export async function getMetaRobots(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ robots: document.querySelector('meta[name="robots"]') ? document.querySelector('meta[name="robots"]').getAttribute('content') : null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get content of <meta name="viewport">. Returns JSON { viewport: string|null }.
export async function getMetaViewport(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ viewport: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get href of <link rel="canonical">. Returns JSON { canonical: string|null }.
export async function getCanonicalUrl(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ canonical: document.querySelector('link[rel="canonical"]') ? document.querySelector('link[rel="canonical"]').getAttribute('href') : null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get all <link rel="alternate" hreflang> tags. Returns JSON array of { hreflang, href }. Limit 20.
export async function getHreflangTags(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).slice(0, 20).map(function(el) {
  return {
    hreflang: el.getAttribute('hreflang') || '',
    href: el.getAttribute('href') || ''
  };
}))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get all <script type="application/ld+json"> content. Returns JSON array of schema objects
// (up to 5 schemas, each stringified and truncated to 500 chars).
export async function getJsonLdSchemas(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('script[type="application/ld+json"]')).slice(0, 5).reduce(function(acc, el) {
  try {
    var parsed = JSON.parse(el.textContent || '');
    var str = JSON.stringify(parsed);
    acc.push(str.length > 500 ? str.slice(0, 500) + '...' : str);
  } catch (e) {
    // skip malformed blocks
  }
  return acc;
}, []))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get all headings h1-h6 in document order. Returns JSON array of { level, text }
// where text is truncated to 80 chars. Limit 50 headings.
export async function getHeadingStructure(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).slice(0, 50).map(function(el) {
  var text = (el.textContent || '').trim();
  return {
    level: parseInt(el.tagName.slice(1), 10),
    text: text.length > 80 ? text.slice(0, 80) + '...' : text
  };
}))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}
