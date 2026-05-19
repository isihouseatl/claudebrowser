// src/cdp/highlight2.ts
// Visual overlay and highlighting functions (div/label injection, bounding boxes).
//
// Naming notes (new functions added below):
//   highlightElement2  — highlightElement already in server.ts (browser_highlight_element)
//   clearHighlights2   — clearHighlights already in server.ts (browser_clear_highlights)
//   flashElement2      — flashElement already in highlight2.ts (original) + server.ts
//   clearAllOverlays2  — clearAllOverlays already exported below (original)

import type { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Original exports (imported by server.ts — do not remove)
// ---------------------------------------------------------------------------

// Inject a <style> tag with a unique class that adds a colored outline to all
// elements matching selector. Returns the count of matched elements.
export async function highlightElements(
  client: CdpClient,
  selector: string,
  color: string = 'rgba(255,0,0,0.5)',
): Promise<number> {
  const expression = `(() => {
  const selector = ${JSON.stringify(selector)};
  const color = ${JSON.stringify(color)};
  const className = 'cdp-hl-' + Math.random().toString(36).slice(2, 9);
  const style = document.createElement('style');
  style.setAttribute('class', 'highlight-injected');
  style.setAttribute('data-hl-class', className);
  style.textContent = '.' + className + ' { outline: 3px solid ' + color + ' !important; outline-offset: 1px !important; }';
  document.head.appendChild(style);
  const els = Array.from(document.querySelectorAll(selector));
  els.forEach(el => el.classList.add(className));
  return els.length;
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`highlightElements error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

// Remove all <style> tags injected by highlightElements and strip the
// associated class from all elements.
export async function removeHighlights(client: CdpClient): Promise<void> {
  const expression = `(() => {
  const styles = Array.from(document.querySelectorAll('style.highlight-injected'));
  styles.forEach(style => {
    const cls = style.getAttribute('data-hl-class');
    if (cls) {
      document.querySelectorAll('.' + cls).forEach(el => el.classList.remove(cls));
    }
    style.remove();
  });
})()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`removeHighlights error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Highlight the first element matching selector and inject a floating label
// badge positioned near it.
export async function highlightWithLabel(
  client: CdpClient,
  selector: string,
  label: string,
): Promise<void> {
  const expression = `(() => {
  const selector = ${JSON.stringify(selector)};
  const labelText = ${JSON.stringify(label)};
  const el = document.querySelector(selector);
  if (!el) throw new Error('highlightWithLabel: no element matched ' + selector);
  const className = 'cdp-hl-lbl-' + Math.random().toString(36).slice(2, 9);
  const style = document.createElement('style');
  style.setAttribute('class', 'highlight-injected');
  style.setAttribute('data-hl-class', className);
  style.textContent =
    '.' + className + ' { outline: 3px solid rgba(255,165,0,0.9) !important; outline-offset: 1px !important; position: relative !important; }' +
    '.' + className + '-badge { position: fixed; background: rgba(255,165,0,0.95); color: #000; font: bold 11px/1.4 monospace; padding: 2px 6px; border-radius: 3px; z-index: 2147483647; pointer-events: none; white-space: nowrap; }';
  document.head.appendChild(style);
  el.classList.add(className);
  const rect = el.getBoundingClientRect();
  const badge = document.createElement('div');
  badge.setAttribute('class', className + '-badge highlight-injected-badge');
  badge.setAttribute('data-hl-badge-class', className);
  badge.textContent = labelText;
  badge.style.top = Math.max(0, rect.top - 20) + 'px';
  badge.style.left = rect.left + 'px';
  document.body.appendChild(badge);
})()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`highlightWithLabel error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Flash the border of the first element matching selector on/off N times.
export async function flashElement(
  client: CdpClient,
  selector: string,
  times: number = 3,
): Promise<void> {
  const expression = `(() => {
  const selector = ${JSON.stringify(selector)};
  const times = ${JSON.stringify(times)};
  const el = document.querySelector(selector);
  if (!el) throw new Error('flashElement: no element matched ' + selector);
  const animName = 'cdp-flash-' + Math.random().toString(36).slice(2, 9);
  const duration = 0.25;
  const style = document.createElement('style');
  style.setAttribute('class', 'highlight-injected');
  style.textContent =
    '@keyframes ' + animName + ' { 0%,100% { outline: none; } 50% { outline: 3px solid rgba(255,0,0,0.85) !important; outline-offset: 2px; } }' +
    '.' + animName + ' { animation: ' + animName + ' ' + duration + 's ease-in-out ' + times + ' !important; }';
  document.head.appendChild(style);
  el.classList.add(animName);
  el.addEventListener('animationend', () => {
    el.classList.remove(animName);
    style.remove();
  }, { once: true });
})()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`flashElement error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Return bounding boxes (relative to the viewport) for all elements matching
// selector.
export async function getBoundingBoxes(
  client: CdpClient,
  selector: string,
): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  const expression = `(() => {
  const selector = ${JSON.stringify(selector)};
  const els = Array.from(document.querySelectorAll(selector));
  return els.map(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`getBoundingBoxes error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ x: number; y: number; width: number; height: number }>;
}

// Draw a colored overlay div at the given page coordinates (fixed positioning).
// Returns a unique overlay ID that can be passed to removeOverlay.
export async function drawOverlay(
  client: CdpClient,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = 'rgba(0,120,255,0.3)',
): Promise<string> {
  const expression = `(() => {
  const x = ${JSON.stringify(x)};
  const y = ${JSON.stringify(y)};
  const width = ${JSON.stringify(width)};
  const height = ${JSON.stringify(height)};
  const color = ${JSON.stringify(color)};
  const id = 'cdp-overlay-' + Math.random().toString(36).slice(2, 11);
  const div = document.createElement('div');
  div.id = id;
  div.setAttribute('data-cdp-overlay', 'true');
  div.style.cssText = [
    'position:fixed',
    'left:' + x + 'px',
    'top:' + y + 'px',
    'width:' + width + 'px',
    'height:' + height + 'px',
    'background:' + color,
    'z-index:2147483646',
    'pointer-events:none',
    'box-sizing:border-box',
  ].join(';');
  document.body.appendChild(div);
  return id;
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`drawOverlay error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

// Remove the overlay div with the given ID (as returned by drawOverlay).
export async function removeOverlay(client: CdpClient, overlayId: string): Promise<void> {
  const expression = `(() => {
  const id = ${JSON.stringify(overlayId)};
  const el = document.getElementById(id);
  if (el) el.remove();
})()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`removeOverlay error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove all overlay divs injected by drawOverlay (identified by the
// data-cdp-overlay attribute).
export async function clearAllOverlays(client: CdpClient): Promise<void> {
  const expression = `(() => {
  document.querySelectorAll('[data-cdp-overlay="true"]').forEach(el => el.remove());
})()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`clearAllOverlays error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// ---------------------------------------------------------------------------
// New functions (2-suffix where name conflicts with originals above)
// ---------------------------------------------------------------------------

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * highlightElement2 — Draw a colored border overlay div over an element
 * matching selector. Returns { highlighted, selector, rect, overlayId }.
 * (Renamed from highlightElement — already used in server.ts.)
 */
export async function highlightElement2(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const jsBody = `
  var el = document.querySelector(SELECTOR);
  if (!el) return { highlighted: false, reason: 'not found' };
  var r = el.getBoundingClientRect();
  var overlay = document.createElement('div');
  overlay.id = '__cb_highlight_' + Date.now();
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:999999;border:3px solid #ff4444;background:rgba(255,68,68,0.1);box-sizing:border-box;transition:none;top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
  document.body.appendChild(overlay);
  return { highlighted: true, selector: SELECTOR, rect: { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }, overlayId: overlay.id };
`.trim();
    const expression = `(function() { var SELECTOR = ${JSON.stringify(selector)}; ${jsBody} })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * clearHighlights2 — Remove all overlay divs with id starting with
 * `__cb_highlight_`. Returns { removed }.
 * (Renamed from clearHighlights — already used in server.ts.)
 */
export async function clearHighlights2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var overlays = document.querySelectorAll('[id^="__cb_highlight_"]');
  overlays.forEach(function(el) { el.remove(); });
  return { removed: overlays.length };
})()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * flashElement2 — Flash an element 3 times by toggling outline style.
 * Returns { flashed, selector }.
 * (Renamed from flashElement — already in highlight2.ts + server.ts.)
 */
export async function flashElement2(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const jsBody = `
  var el = document.querySelector(SELECTOR);
  if (!el) return { flashed: false };
  var orig = el.style.outline;
  var count = 0;
  var iv = setInterval(function() {
    el.style.outline = (count % 2 === 0) ? '4px solid #ff4444' : orig;
    count++;
    if (count > 6) { clearInterval(iv); el.style.outline = orig; }
  }, 150);
  return { flashed: true, selector: SELECTOR };
`.trim();
    const expression = `(function() { var SELECTOR = ${JSON.stringify(selector)}; ${jsBody} })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * highlightAllLinks — Draw blue overlays on all visible <a href> elements.
 * Returns { count }.
 */
export async function highlightAllLinks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var links = document.querySelectorAll('a[href]');
  var count = 0;
  Array.from(links).forEach(function(el) {
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      var o = document.createElement('div');
      o.className = '__cb_link_highlight';
      o.style.cssText = 'position:fixed;pointer-events:none;z-index:999998;border:2px solid #4488ff;background:rgba(68,136,255,0.1);box-sizing:border-box;top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
      document.body.appendChild(o);
      count++;
    }
  });
  return { count: count };
})()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * clearLinkHighlights — Remove all `.__cb_link_highlight` overlay divs.
 * Returns { removed }.
 */
export async function clearLinkHighlights(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var els = document.querySelectorAll('.__cb_link_highlight');
  var count = els.length;
  els.forEach(function(e) { e.remove(); });
  return { removed: count };
})()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * highlightForms — Draw green overlays on all visible <form> elements.
 * Returns { count }.
 */
export async function highlightForms(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var forms = document.querySelectorAll('form');
  var count = 0;
  Array.from(forms).forEach(function(el) {
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      var o = document.createElement('div');
      o.className = '__cb_form_highlight';
      o.style.cssText = 'position:fixed;pointer-events:none;z-index:999998;border:2px solid #44bb44;background:rgba(68,187,68,0.1);box-sizing:border-box;top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
      document.body.appendChild(o);
      count++;
    }
  });
  return { count: count };
})()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * labelElement — Add a floating label div near an element matching selector.
 * Returns { labeled, selector }.
 */
export async function labelElement(
  client: CdpClient,
  selector: string,
  label: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const jsBody = `
  var el = document.querySelector(SELECTOR);
  if (!el) return { labeled: false };
  var r = el.getBoundingClientRect();
  var lbl = document.createElement('div');
  lbl.className = '__cb_label';
  lbl.textContent = LABEL;
  lbl.style.cssText = 'position:fixed;pointer-events:none;z-index:9999999;background:#ff4444;color:#fff;font-size:11px;font-family:monospace;padding:2px 5px;border-radius:3px;top:' + Math.max(0, r.top - 20) + 'px;left:' + r.left + 'px;';
  document.body.appendChild(lbl);
  return { labeled: true, selector: SELECTOR };
`.trim();
    const expression = `(function() { var SELECTOR = ${JSON.stringify(selector)}; var LABEL = ${JSON.stringify(label)}; ${jsBody} })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * clearAllOverlays2 — Remove ALL claudebrowser overlays and labels:
 * __cb_highlight_*, .__cb_link_highlight, .__cb_form_highlight, .__cb_label.
 * Returns { removed }.
 * (Renamed from clearAllOverlays — already exported from highlight2.ts.)
 */
export async function clearAllOverlays2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = '[id^="__cb_highlight_"],.__cb_link_highlight,.__cb_form_highlight,.__cb_label';
  var all = document.querySelectorAll(sel);
  var count = all.length;
  all.forEach(function(e) { e.remove(); });
  return { removed: count };
})()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
