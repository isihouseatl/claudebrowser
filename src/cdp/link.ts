// src/cdp/link.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// Get all <a> elements with href. Returns JSON array of { text, href, target, rel }. Limit 50.
export async function getAllLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).slice(0, 50).map(function(el) {
  return {
    text: (el.textContent || '').trim(),
    href: el.getAttribute('href') || '',
    target: el.getAttribute('target') || '',
    rel: el.getAttribute('rel') || ''
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

// Get links where href starts with http and doesn't include window.location.hostname.
// Returns JSON array of { text, href }. Limit 30.
export async function getExternalLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).reduce(function(acc, el) {
  if (acc.length >= 30) return acc;
  var href = el.getAttribute('href') || '';
  if (href.indexOf('http') !== 0) return acc;
  if (href.indexOf(window.location.hostname) !== -1) return acc;
  acc.push({ text: (el.textContent || '').trim(), href: href });
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

// Get links pointing to the same host. Returns JSON array of { text, href }. Limit 30.
export async function getInternalLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).reduce(function(acc, el) {
  if (acc.length >= 30) return acc;
  var href = el.getAttribute('href') || '';
  var isRelative = href.indexOf('http') !== 0 && href.indexOf('//') !== 0 && href.indexOf('mailto:') !== 0 && href.indexOf('tel:') !== 0;
  var isSameHost = false;
  if (href.indexOf('http') === 0) {
    try {
      var url = new URL(href);
      isSameHost = url.hostname === window.location.hostname;
    } catch (e) {}
  }
  if (isRelative || isSameHost) {
    acc.push({ text: (el.textContent || '').trim(), href: href });
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

// Count all links on page. Returns JSON { total, withHref, withoutHref }.
export async function getLinkCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((function() {
  var all = document.querySelectorAll('a');
  var withHref = document.querySelectorAll('a[href]').length;
  return { total: all.length, withHref: withHref, withoutHref: all.length - withHref };
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value as string);
}

// Get links with a specific rel attribute value. Returns JSON array of { text, href, rel }. Limit 30.
export async function getLinksWithRel(
  client: CdpClient,
  rel: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const relLiteral = JSON.stringify(rel);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[rel]')).reduce(function(acc, el) {
  if (acc.length >= 30) return acc;
  var relVal = el.getAttribute('rel') || '';
  var parts = relVal.split(/\\s+/);
  if (parts.indexOf(${relLiteral}) !== -1) {
    acc.push({ text: (el.textContent || '').trim(), href: el.getAttribute('href') || '', rel: relVal });
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

// Get all mailto: links. Returns JSON array of { text, email }. Limit 20.
export async function getMailtoLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href^="mailto:"]')).slice(0, 20).map(function(el) {
  return {
    text: (el.textContent || '').trim(),
    email: (el.getAttribute('href') || '').replace('mailto:', '')
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

// Get all tel: links. Returns JSON array of { text, tel }. Limit 20.
export async function getTelLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href^="tel:"]')).slice(0, 20).map(function(el) {
  return {
    text: (el.textContent || '').trim(),
    tel: (el.getAttribute('href') || '').replace('tel:', '')
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

// Get all links pointing to #fragment anchors (href starts with #).
// Returns JSON array of { text, href }. Limit 30.
export async function getAnchorLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href^="#"]')).slice(0, 30).map(function(el) {
  return {
    text: (el.textContent || '').trim(),
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
