// src/cdp/iframe2.ts
import type { CdpClient } from './client';

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * List all iframes on the page (max 10): src, name, id, width, height, sandbox attribute.
 */
export async function getIframes2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'), 0, 10);
  return JSON.stringify(frames.map(function(f, i) {
    return {
      index: i,
      src: f.src || f.getAttribute('src') || '',
      name: f.name || '',
      id: f.id || '',
      width: f.width || '',
      height: f.height || '',
      sandbox: f.getAttribute('sandbox') !== null ? f.getAttribute('sandbox') : null
    };
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Count total iframes: total, withSrc, sandboxed, crossOrigin.
 */
export async function getIframeCount2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
  var origin = window.location.origin;
  var withSrc = 0, sandboxed = 0, crossOrigin = 0;
  frames.forEach(function(f) {
    var src = f.src || f.getAttribute('src') || '';
    if (src) withSrc++;
    if (f.getAttribute('sandbox') !== null) sandboxed++;
    if (src) {
      try {
        var u = new URL(src);
        if (u.origin !== origin) crossOrigin++;
      } catch(e) {}
    }
  });
  return JSON.stringify({ total: frames.length, withSrc: withSrc, sandboxed: sandboxed, crossOrigin: crossOrigin });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Try to querySelector inside an iframe by name or id (same-origin only).
 * Returns found, tag, and text content of the matched element.
 */
export async function queryInIframe(
  client: CdpClient,
  iframeName: string,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
  var target = null;
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].name === ${JSON.stringify(iframeName)} || frames[i].id === ${JSON.stringify(iframeName)}) {
      target = frames[i];
      break;
    }
  }
  if (!target) return JSON.stringify({ error: 'iframe not found: ' + ${JSON.stringify(iframeName)} });
  var doc;
  try {
    doc = target.contentDocument;
  } catch(e) {
    return JSON.stringify({ error: 'cross-origin iframe: cannot access document' });
  }
  if (!doc) return JSON.stringify({ error: 'iframe contentDocument not accessible' });
  var el = doc.querySelector(${JSON.stringify(selector)});
  if (!el) return JSON.stringify({ found: false, tag: null, text: null });
  return JSON.stringify({ found: true, tag: el.tagName.toLowerCase(), text: el.textContent ? el.textContent.trim().slice(0, 500) : '' });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Get document.title of a same-origin iframe identified by name or id.
 */
export async function getIframeTitle(
  client: CdpClient,
  iframeName: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
  var target = null;
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].name === ${JSON.stringify(iframeName)} || frames[i].id === ${JSON.stringify(iframeName)}) {
      target = frames[i];
      break;
    }
  }
  if (!target) return JSON.stringify({ error: 'iframe not found: ' + ${JSON.stringify(iframeName)} });
  var doc;
  try {
    doc = target.contentDocument;
  } catch(e) {
    return JSON.stringify({ error: 'cross-origin iframe: cannot access document' });
  }
  if (!doc) return JSON.stringify({ error: 'iframe contentDocument not accessible' });
  return JSON.stringify({ title: doc.title });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Get the src attribute of the iframe matching a CSS selector.
 */
export async function getIframeSrc2(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return JSON.stringify({ error: 'element not found: ' + ${JSON.stringify(selector)} });
  return JSON.stringify({ src: el.getAttribute('src') || el.src || '' });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Check if the iframe matching a CSS selector has the sandbox attribute and list its tokens.
 */
export async function isIframeSandboxed2(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return JSON.stringify({ error: 'element not found: ' + ${JSON.stringify(selector)} });
  var hasSandbox = el.hasAttribute('sandbox');
  var raw = el.getAttribute('sandbox') || '';
  var tokens = hasSandbox ? raw.split(/\\s+/).filter(function(t) { return t.length > 0; }) : [];
  return JSON.stringify({ sandboxed: hasSandbox, tokens: tokens, raw: raw });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Get basic document info from a same-origin iframe: title, url, readyState.
 */
export async function getIframeDocument(
  client: CdpClient,
  iframeName: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
  var target = null;
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].name === ${JSON.stringify(iframeName)} || frames[i].id === ${JSON.stringify(iframeName)}) {
      target = frames[i];
      break;
    }
  }
  if (!target) return JSON.stringify({ error: 'iframe not found: ' + ${JSON.stringify(iframeName)} });
  var doc;
  try {
    doc = target.contentDocument;
  } catch(e) {
    return JSON.stringify({ error: 'cross-origin iframe: cannot access document' });
  }
  if (!doc) return JSON.stringify({ error: 'iframe contentDocument not accessible' });
  return JSON.stringify({ title: doc.title, url: doc.URL, readyState: doc.readyState });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Call focus() on the iframe element matching a CSS selector.
 */
export async function focusIframe(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return JSON.stringify({ error: 'element not found: ' + ${JSON.stringify(selector)} });
  el.focus();
  return JSON.stringify({ focused: true, selector: ${JSON.stringify(selector)} });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}
