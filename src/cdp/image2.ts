// src/cdp/image2.ts
import type { CdpClient } from './client';

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): McpResult {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ─── getImages ────────────────────────────────────────────────────────────────
// Find all <img> elements: src, alt, width, height, naturalWidth, naturalHeight,
// loading, isVisible. Max 20.
export async function getImages(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'), 0, 20);
      return els.map(function(el) {
        var style = window.getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        var isVisible = style.display !== 'none'
          && style.visibility !== 'hidden'
          && style.opacity !== '0'
          && rect.width > 0
          && rect.height > 0;
        return {
          src: el.src || el.getAttribute('src') || '',
          alt: el.alt || '',
          width: el.width,
          height: el.height,
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
          loading: el.getAttribute('loading') || '',
          isVisible: isVisible
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
// Find <img> elements missing alt attribute or with empty alt.
// Returns { src, id, class }[]. Max 20.
export async function getImagesWithoutAlt(client: CdpClient): Promise<McpResult> {
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

// ─── getLazyImages ────────────────────────────────────────────────────────────
// Find <img> elements with loading="lazy" or data-src attribute (lazy load pattern).
// Returns { src, dataSrc, id, class }[]. Max 20.
export async function getLazyImages(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('img'));
      var results = [];
      for (var i = 0; i < all.length && results.length < 20; i++) {
        var el = all[i];
        var isLazy = el.getAttribute('loading') === 'lazy';
        var dataSrc = el.getAttribute('data-src') || '';
        if (isLazy || dataSrc !== '') {
          results.push({
            src: el.src || el.getAttribute('src') || '',
            dataSrc: dataSrc,
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

// ─── getImageDimensions ───────────────────────────────────────────────────────
// Get { width, height, naturalWidth, naturalHeight, clientWidth, clientHeight }
// for a specific image matched by CSS selector.
export async function getImageDimensions(
  client: CdpClient,
  selector: string,
): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return {
        width: el.width,
        height: el.height,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight
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

// ─── getSvgElements ───────────────────────────────────────────────────────────
// Find all <svg> elements: { id, class, width, height, viewBox, title }. Max 20.
export async function getSvgElements(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('svg'), 0, 20);
      return els.map(function(el) {
        var titleEl = el.querySelector('title');
        return {
          id: el.id || '',
          class: el.getAttribute('class') || '',
          width: el.getAttribute('width') || '',
          height: el.getAttribute('height') || '',
          viewBox: el.getAttribute('viewBox') || '',
          title: titleEl ? (titleEl.textContent || '') : ''
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

// ─── getBackgroundImages ──────────────────────────────────────────────────────
// Find elements with CSS background-image containing url(.
// Returns { tag, id, class, backgroundImage }[]. Max 20.
export async function getBackgroundImages(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var results = [];
      for (var i = 0; i < all.length && results.length < 20; i++) {
        var el = all[i];
        var bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg.indexOf('url(') !== -1) {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class: el.className || '',
            backgroundImage: bg
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

// ─── getBrokenImages ─────────────────────────────────────────────────────────
// Find <img> elements where naturalWidth === 0 (failed to load).
// Returns { src, id, class }[]. Max 20.
export async function getBrokenImages(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('img'));
      var results = [];
      for (var i = 0; i < els.length && results.length < 20; i++) {
        var el = els[i];
        var src = el.src || el.getAttribute('src') || '';
        if (src !== '' && el.naturalWidth === 0) {
          results.push({
            src: src,
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

// ─── getPictureElements ───────────────────────────────────────────────────────
// Find <picture> elements with their <source> srcset and media attributes.
// Returns { sources: [{srcset, media, type}], fallbackSrc }[]. Max 10.
export async function getPictureElements(client: CdpClient): Promise<McpResult> {
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

// ─── getAllImages ─────────────────────────────────────────────────────────────
// Legacy: Get all <img> elements. Returns up to 30 items.
// Kept for server.ts compatibility.
export async function getAllImages(client: CdpClient): Promise<McpResult> {
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

// ─── getAllImages2 ────────────────────────────────────────────────────────────
// All <img> elements: src (80 chars), alt, width, height, loading,
// naturalWidth, naturalHeight. Max 20.
export async function getAllImages2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('img'), 0, 20);
        var out = [];
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          var src = (el.src || el.getAttribute('src') || '');
          out.push({
            src: src.length > 80 ? src.slice(0, 80) : src,
            alt: el.alt || '',
            width: el.width,
            height: el.height,
            loading: el.getAttribute('loading') || '',
            naturalWidth: el.naturalWidth,
            naturalHeight: el.naturalHeight
          });
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getImagesWithoutAlt2 ─────────────────────────────────────────────────────
// img elements where alt attribute is missing or empty: src, id. Max 20.
export async function getImagesWithoutAlt2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('img'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var altAttr = el.getAttribute('alt');
          if (altAttr === null || altAttr === '') {
            var src = (el.src || el.getAttribute('src') || '');
            out.push({ src: src.length > 80 ? src.slice(0, 80) : src, id: el.id || '' });
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getLazyImages2 ───────────────────────────────────────────────────────────
// img elements with loading="lazy" or data-src: src, id. Max 20.
export async function getLazyImages2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('img'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var isLazy = el.getAttribute('loading') === 'lazy';
          var dataSrc = el.getAttribute('data-src') || '';
          if (isLazy || dataSrc !== '') {
            var src = (el.src || el.getAttribute('src') || '');
            out.push({ src: src.length > 80 ? src.slice(0, 80) : src, id: el.id || '' });
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getSvgElements2 ─────────────────────────────────────────────────────────
// All <svg> elements: id, class, width, height, viewBox. Max 20.
export async function getSvgElements2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('svg'), 0, 20);
        var out = [];
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          out.push({
            id: el.id || '',
            class: el.getAttribute('class') || '',
            width: el.getAttribute('width') || '',
            height: el.getAttribute('height') || '',
            viewBox: el.getAttribute('viewBox') || ''
          });
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getImageDimensions2 ─────────────────────────────────────────────────────
// All img elements with natural vs rendered size comparison:
// src_preview, renderedW, renderedH, naturalW, naturalH. Max 20.
export async function getImageDimensions2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('img'), 0, 20);
        var out = [];
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          var rect = el.getBoundingClientRect();
          var src = (el.src || el.getAttribute('src') || '');
          out.push({
            src_preview: src.length > 80 ? src.slice(0, 80) : src,
            renderedW: Math.round(rect.width),
            renderedH: Math.round(rect.height),
            naturalW: el.naturalWidth,
            naturalH: el.naturalHeight
          });
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getBrokenImages2 ────────────────────────────────────────────────────────
// img elements where naturalWidth === 0 (failed to load): src, id. Max 20.
export async function getBrokenImages2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('img'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var src = (el.src || el.getAttribute('src') || '');
          if (src !== '' && el.naturalWidth === 0) {
            out.push({ src: src.length > 80 ? src.slice(0, 80) : src, id: el.id || '' });
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getBackgroundImages2 ────────────────────────────────────────────────────
// Elements with computed background-image set (not none):
// tag, id, backgroundImage (truncated 80). Max 20.
export async function getBackgroundImages2(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg !== 'none' && bg.indexOf('url(') !== -1) {
            var bgTrunc = bg.length > 80 ? bg.slice(0, 80) : bg;
            out.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              backgroundImage: bgTrunc
            });
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResponsiveImages ──────────────────────────────────────────────────────
// img elements with srcset attribute: src_preview, srcset_preview. Max 20.
export async function getResponsiveImages(client: CdpClient): Promise<McpResult> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('img'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var srcset = el.getAttribute('srcset') || '';
          if (srcset !== '') {
            var src = (el.src || el.getAttribute('src') || '');
            out.push({
              src_preview: src.length > 80 ? src.slice(0, 80) : src,
              srcset_preview: srcset.length > 80 ? srcset.slice(0, 80) : srcset
            });
          }
        }
        return JSON.stringify(out);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getImageCount ────────────────────────────────────────────────────────────
// Legacy: Count all <img> elements. Returns { total, loaded, broken }.
// Kept for server.ts compatibility.
export async function getImageCount(client: CdpClient): Promise<McpResult> {
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
