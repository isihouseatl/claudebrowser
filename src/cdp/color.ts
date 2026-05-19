// src/cdp/color.ts
import type { CdpClient } from './client';

// ---- Helpers ----

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify({ error: msg }) }] };
}

// ---- Functions ----

/**
 * Get color, background-color, border-color, and outline-color from the
 * computed style of the element matching the given selector.
 */
export async function getElementColors(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const s = window.getComputedStyle(el);
  return {
    color: s.color,
    backgroundColor: s.backgroundColor,
    borderColor: s.borderColor,
    outlineColor: s.outlineColor,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok(result.value);
}

/**
 * Collect computed color and background-color from all visible elements,
 * count occurrences, and return the top 10 most common values.
 */
export async function getDominantColors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const all = document.querySelectorAll('*');
  const counts = {};
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const s = window.getComputedStyle(el);
    const vals = [s.color, s.backgroundColor];
    for (let j = 0; j < vals.length; j++) {
      const v = vals[j];
      if (!v) continue;
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  const entries = Object.keys(counts).map(function(k) { return { value: k, count: counts[k] }; });
  entries.sort(function(a, b) { return b.count - a.count; });
  return entries.slice(0, 10);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  return ok(result.value);
}

/**
 * Get color and background-color for a given element to enable manual
 * contrast ratio calculation.
 */
export async function getColorContrast(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const s = window.getComputedStyle(el);
  return {
    color: s.color,
    backgroundColor: s.backgroundColor,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok(result.value);
}

/**
 * Check if the element matching selector has a transparent or fully-transparent
 * background (transparent keyword or rgba(0,0,0,0)).
 */
export async function hasTransparentBackground(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const bg = window.getComputedStyle(el).backgroundColor;
  const isTransparent = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
  return { backgroundColor: bg, isTransparent: isTransparent };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok(result.value);
}

/**
 * Scan all elements for unique color and background-color values.
 * Returns a deduplicated list (max 30 entries).
 */
export async function getAllColors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const all = document.querySelectorAll('*');
  const seen = {};
  const out = [];
  for (let i = 0; i < all.length; i++) {
    const s = window.getComputedStyle(all[i]);
    const vals = [s.color, s.backgroundColor];
    for (let j = 0; j < vals.length; j++) {
      const v = vals[j];
      if (v && !seen[v]) {
        seen[v] = true;
        out.push(v);
        if (out.length >= 30) return out;
      }
    }
  }
  return out;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  return ok(result.value);
}

/**
 * Find elements with CSS gradient backgrounds (linear-gradient or
 * radial-gradient). Returns tag name, id, and background-image value
 * for up to 10 elements.
 */
export async function getGradients(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const all = document.querySelectorAll('*');
  const out = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && (bg.indexOf('linear-gradient') !== -1 || bg.indexOf('radial-gradient') !== -1)) {
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        backgroundImage: bg,
      });
      if (out.length >= 10) break;
    }
  }
  return out;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  return ok(result.value);
}

/**
 * Check the active prefers-color-scheme media query result and the
 * color-scheme meta tag value from the document.
 * NOTE: named getColorScheme2 to avoid conflict with darkmode.ts getColorScheme.
 */
export async function getColorScheme2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const light = window.matchMedia('(prefers-color-scheme: light)').matches;
  let prefersColorScheme = 'no-preference';
  if (dark) prefersColorScheme = 'dark';
  else if (light) prefersColorScheme = 'light';
  const metaTag = document.querySelector('meta[name="color-scheme"]');
  const metaColorScheme = metaTag ? metaTag.getAttribute('content') : null;
  return { prefersColorScheme: prefersColorScheme, metaColorScheme: metaColorScheme };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  return ok(result.value);
}

/**
 * Get the computed color of anchor elements to approximate link, visited,
 * and hover color states. Returns colors sampled from existing anchors.
 */
export async function getLinkColors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const anchors = document.querySelectorAll('a');
  if (anchors.length === 0) return { note: 'No anchor elements found', linkColor: null };
  const first = anchors[0];
  const s = window.getComputedStyle(first);
  const linkColor = s.color;
  const out = {
    note: 'Computed colors sampled from first anchor element. Visited/hover states require user interaction to reflect in computed style.',
    linkColor: linkColor,
    anchorCount: anchors.length,
    samples: [],
  };
  const sampleCount = Math.min(3, anchors.length);
  for (let i = 0; i < sampleCount; i++) {
    const a = anchors[i];
    const cs = window.getComputedStyle(a);
    out.samples.push({
      href: a.getAttribute('href') || null,
      color: cs.color,
      textDecorationColor: cs.textDecorationColor,
    });
  }
  return out;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  return ok(result.value);
}
