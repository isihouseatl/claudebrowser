// src/cdp/highlight2.ts
import { CdpClient } from './client';

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

// Remove all <style> tags injected by highlightElements (identified by the
// class "highlight-injected") and strip the associated class from all elements.
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
// badge positioned near it showing the label text.
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
// Uses a CSS @keyframes animation injected into a <style> tag.
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
  const totalDuration = times * duration * 2;
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
// selector. Uses getBoundingClientRect on each matched element.
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
