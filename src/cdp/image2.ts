// src/cdp/image2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ─── getAllImages ─────────────────────────────────────────────────────────────
// Get all <img> elements on the page. Returns JSON array of up to 30 items
// with src, alt, width, height, naturalWidth, naturalHeight, id, class.
export async function getAllImages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'), 0, 30);
      return els.map(function(el) {
        return {
          src: el.src || el.getAttribute('src') || '',
          alt: el.alt || '',
          width: el.width,
          height: el.height,
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
          id: el.id || '',
          class: el.className || ''
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getBrokenImages ─────────────────────────────────────────────────────────
// Get images that failed to load: naturalWidth === 0 AND naturalHeight === 0
// but src is non-empty. Returns JSON array of up to 20 items with src, alt, id.
export async function getBrokenImages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'));
      var broken = [];
      for (var i = 0; i < els.length && broken.length < 20; i++) {
        var el = els[i];
        var src = el.src || el.getAttribute('src') || '';
        if (src !== '' && el.naturalWidth === 0 && el.naturalHeight === 0) {
          broken.push({ src: src, alt: el.alt || '', id: el.id || '' });
        }
      }
      return broken;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getImageCount ────────────────────────────────────────────────────────────
// Count all <img> elements. Returns JSON { total, loaded, broken }.
// loaded = naturalWidth > 0. broken = src non-empty AND naturalWidth === 0.
export async function getImageCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'));
      var total = els.length;
      var loaded = 0;
      var broken = 0;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var src = el.src || el.getAttribute('src') || '';
        if (el.naturalWidth > 0) {
          loaded++;
        } else if (src !== '') {
          broken++;
        }
      }
      return { total: total, loaded: loaded, broken: broken };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getLazyImages ────────────────────────────────────────────────────────────
// Get images with loading="lazy". Returns JSON array of up to 20 items
// with src, alt, id.
export async function getLazyImages(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img[loading="lazy"]'), 0, 20);
      return els.map(function(el) {
        return {
          src: el.src || el.getAttribute('src') || '',
          alt: el.alt || '',
          id: el.id || ''
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getImagesWithoutAlt ──────────────────────────────────────────────────────
// Get images missing alt attribute or with empty alt. Returns JSON array of
// up to 20 items with src, id, class.
export async function getImagesWithoutAlt(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'));
      var results = [];
      for (var i = 0; i < els.length && results.length < 20; i++) {
        var el = els[i];
        var altAttr = el.getAttribute('alt');
        if (altAttr === null || altAttr === '') {
          results.push({
            src: el.src || el.getAttribute('src') || '',
            id: el.id || '',
            class: el.className || ''
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getSvgElements ───────────────────────────────────────────────────────────
// List all inline <svg> elements on the page. Returns JSON array of up to 20
// items with id, class, width, height, viewBox.
export async function getSvgElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('svg'), 0, 20);
      return els.map(function(el) {
        return {
          id: el.id || '',
          class: el.getAttribute('class') || '',
          width: el.getAttribute('width') || '',
          height: el.getAttribute('height') || '',
          viewBox: el.getAttribute('viewBox') || ''
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getPictureElements ───────────────────────────────────────────────────────
// List all <picture> elements with their source srcsets. Returns JSON array of
// up to 10 items, each with sources: [{ srcset, media, type }] and fallbackSrc.
export async function getPictureElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var pictures = Array.prototype.slice.call(document.querySelectorAll('picture'), 0, 10);
      return pictures.map(function(pic) {
        var sources = Array.prototype.slice.call(pic.querySelectorAll('source')).map(function(s) {
          return {
            srcset: s.getAttribute('srcset') || '',
            media: s.getAttribute('media') || '',
            type: s.getAttribute('type') || ''
          };
        });
        var img = pic.querySelector('img');
        var fallbackSrc = img ? (img.src || img.getAttribute('src') || '') : '';
        return { sources: sources, fallbackSrc: fallbackSrc };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── getImageDimensions ───────────────────────────────────────────────────────
// Get dimensions of a specific image by CSS selector. Returns JSON
// { src, width, height, naturalWidth, naturalHeight, displayWidth, displayHeight }
// where displayWidth/displayHeight come from getBoundingClientRect().
export async function getImageDimensions(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      var rect = el.getBoundingClientRect();
      return {
        src: el.src || el.getAttribute('src') || '',
        width: el.width,
        height: el.height,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        displayWidth: rect.width,
        displayHeight: rect.height
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value);
}
