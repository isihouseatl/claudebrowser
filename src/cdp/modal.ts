// src/cdp/modal.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ---------------------------------------------------------------------------
// detectModals
// ---------------------------------------------------------------------------

/**
 * Find elements that look like modals: fixed or absolute position, z-index > 100,
 * non-zero bounding box, visible (not hidden/display:none).
 * Returns JSON array of { tag, id, class, zIndex } (first 10 elements).
 */
export async function detectModals(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  const results = [];
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    if (results.length >= 10) break;
    const style = window.getComputedStyle(el);
    const pos = style.position;
    if (pos !== 'fixed' && pos !== 'absolute') continue;
    const z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= 100) continue;
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: typeof el.className === 'string' ? el.className : null,
      zIndex: z,
    });
  }
  return JSON.stringify(results);
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`detectModals: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// isModalOpen
// ---------------------------------------------------------------------------

/**
 * Check if any modal-like overlay is currently visible.
 * Returns JSON { open: true|false, count: <number> }.
 */
export async function isModalOpen(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  let count = 0;
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    const style = window.getComputedStyle(el);
    const pos = style.position;
    if (pos !== 'fixed' && pos !== 'absolute') continue;
    const z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= 100) continue;
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    count++;
  }
  return JSON.stringify({ open: count > 0, count });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`isModalOpen: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// getOverlayElements
// ---------------------------------------------------------------------------

/**
 * Find elements with position: fixed and non-zero size.
 * Returns JSON array of { tag, id, class, zIndex, width, height }. Limit 15.
 */
export async function getOverlayElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  const results = [];
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    if (results.length >= 15) break;
    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const z = parseInt(style.zIndex, 10);
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: typeof el.className === 'string' ? el.className : null,
      zIndex: isNaN(z) ? null : z,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }
  return JSON.stringify(results);
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`getOverlayElements: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// hasBackdrop
// ---------------------------------------------------------------------------

/**
 * Check if any element with class matching backdrop, overlay, mask, or modal-backdrop
 * is visible. Returns JSON { found: true|false, selector: <class>|null }.
 */
export async function hasBackdrop(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  const keywords = ['backdrop', 'overlay', 'mask', 'modal-backdrop'];
  const all = Array.from(document.querySelectorAll('[class]'));
  for (const el of all) {
    const cls = typeof el.className === 'string' ? el.className : '';
    const matched = keywords.find(k => cls.includes(k));
    if (!matched) continue;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    return JSON.stringify({ found: true, selector: matched });
  }
  return JSON.stringify({ found: false, selector: null });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`hasBackdrop: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// closeModalByEscape
// ---------------------------------------------------------------------------

/**
 * Dispatch Escape keydown/keyup events on the document.
 */
export async function closeModalByEscape(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
  document.dispatchEvent(new KeyboardEvent('keyup', {key:'Escape',code:'Escape',bubbles:true}));
  return 'escape-sent';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`closeModalByEscape: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// clickModalCloseButton
// ---------------------------------------------------------------------------

/**
 * Find and click a close button inside a modal.
 * Looks for: button with aria-label containing "close"/"dismiss",
 * button with class containing "close"/"dismiss", or [data-dismiss].
 * Returns ok with what was found or err.
 */
export async function clickModalCloseButton(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  // aria-label match
  const byAria = Array.from(document.querySelectorAll('button[aria-label]'));
  for (const btn of byAria) {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('close') || label.includes('dismiss')) {
      btn.click();
      return 'clicked aria-label=' + btn.getAttribute('aria-label');
    }
  }
  // class match
  const byClass = Array.from(document.querySelectorAll('button[class]'));
  for (const btn of byClass) {
    const cls = (typeof btn.className === 'string' ? btn.className : '').toLowerCase();
    if (cls.includes('close') || cls.includes('dismiss')) {
      btn.click();
      return 'clicked class=' + btn.className;
    }
  }
  // data-dismiss
  const byDismiss = document.querySelector('[data-dismiss]');
  if (byDismiss) {
    byDismiss.click();
    return 'clicked data-dismiss=' + byDismiss.getAttribute('data-dismiss');
  }
  return null;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`clickModalCloseButton: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('no close button found');
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// getPopoverElements
// ---------------------------------------------------------------------------

/**
 * Find elements with [popover] attribute.
 * Returns JSON array of { tag, id, popoverType }. Limit 10.
 */
export async function getPopoverElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  const all = Array.from(document.querySelectorAll('[popover]'));
  const results = all.slice(0, 10).map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    popoverType: el.getAttribute('popover'),
  }));
  return JSON.stringify(results);
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`getPopoverElements: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// countZIndexLayers
// ---------------------------------------------------------------------------

/**
 * Count distinct z-index values in use on visible positioned elements.
 * Returns JSON { count, zIndexValues: number[] } sorted descending.
 */
export async function countZIndexLayers(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
  const zSet = new Set();
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    const style = window.getComputedStyle(el);
    const pos = style.position;
    if (pos === 'static') continue;
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const z = parseInt(style.zIndex, 10);
    if (!isNaN(z)) zSet.add(z);
  }
  const zIndexValues = Array.from(zSet).sort((a, b) => b - a);
  return JSON.stringify({ count: zIndexValues.length, zIndexValues });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`countZIndexLayers: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value as string);
}

// ---------------------------------------------------------------------------
// Legacy functions — retained for server.ts compatibility
// ---------------------------------------------------------------------------

/**
 * Return the textContent of the first visible role="dialog" or .modal element.
 * Returns null if none is found.
 */
export async function getModalContent(client: CdpClient): Promise<string | null> {
  const expression = `(() => {
  const candidates = [
    ...Array.from(document.querySelectorAll('[role="dialog"]')),
    ...Array.from(document.querySelectorAll('[class]')).filter(el => {
      const cls = el.className;
      return typeof cls === 'string' && cls.includes('modal');
    }),
  ];
  for (const el of candidates) {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return el.textContent || '';
      }
    }
  }
  return null;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`getModalContent: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as string | null) ?? null;
}

/**
 * Try to close an open modal.
 * Strategy 1: Click a button with aria-label="Close" or text matching Close/×/✕/Cancel.
 * Strategy 2: Press Escape.
 * Returns true if a close button was found and clicked, false if Escape was used.
 */
export async function closeModal(client: CdpClient): Promise<boolean> {
  const expression = `(() => {
  const closeTexts = ['close', '\u00d7', '\u2715', 'cancel'];
  const containers = [
    ...Array.from(document.querySelectorAll('[role="dialog"]')),
    ...Array.from(document.querySelectorAll('[class]')).filter(el => {
      const cls = el.className;
      return typeof cls === 'string' && (cls.includes('modal') || cls.includes('overlay'));
    }),
    document.body,
  ];
  for (const container of containers) {
    const buttons = Array.from(container.querySelectorAll('button, [role="button"]'));
    for (const btn of buttons) {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase() === 'close') { btn.click(); return true; }
      const text = (btn.textContent || '').trim().toLowerCase();
      if (closeTexts.includes(text)) { btn.click(); return true; }
    }
  }
  return false;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`closeModal: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  const clicked = result.value as boolean;
  if (!clicked) {
    await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  }
  return clicked;
}

/**
 * Poll every 200ms for up to timeoutMs (default 5000ms) for a modal to appear.
 * Returns true when a modal is detected, false on timeout.
 */
export async function waitForModal(client: CdpClient, timeoutMs: number = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await isModalOpen(client);
    const parsed = JSON.parse(result.content[0].text) as { open: boolean; count: number };
    if (parsed.open) return true;
    await new Promise<void>(r => setTimeout(r, 200));
  }
  return false;
}

/**
 * Find all buttons inside role="dialog" or .modal elements.
 * Returns an array of { text, selector }.
 */
export async function getModalButtons(client: CdpClient): Promise<Array<{ text: string; selector: string }>> {
  const expression = `(() => {
  const containers = [
    ...Array.from(document.querySelectorAll('[role="dialog"]')),
    ...Array.from(document.querySelectorAll('[class]')).filter(el => {
      const cls = el.className;
      return typeof cls === 'string' && cls.includes('modal');
    }),
  ].filter(el => {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  const seen = new Set();
  const results = [];
  for (const container of containers) {
    const buttons = Array.from(container.querySelectorAll('button, [role="button"]'));
    buttons.forEach((btn) => {
      if (seen.has(btn)) return;
      seen.add(btn);
      const text = (btn.textContent || '').trim();
      const tag = btn.tagName.toLowerCase();
      const role = btn.getAttribute('role');
      const parent = btn.parentElement;
      let selector = tag;
      if (role) selector += '[role=' + JSON.stringify(role) + ']';
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === btn.tagName);
        const pos = siblings.indexOf(btn) + 1;
        selector = tag + ':nth-of-type(' + pos + ')';
      }
      results.push({ text, selector });
    });
  }
  return results;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`getModalButtons: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as Array<{ text: string; selector: string }>) ?? [];
}

/**
 * Click a button inside a modal by its text content (case-insensitive).
 * Returns true if the button was found and clicked, false otherwise.
 */
export async function clickModalButton(client: CdpClient, buttonText: string): Promise<boolean> {
  const expression = `(() => {
  const target = ${JSON.stringify(buttonText)}.toLowerCase();
  const containers = [
    ...Array.from(document.querySelectorAll('[role="dialog"]')),
    ...Array.from(document.querySelectorAll('[class]')).filter(el => {
      const cls = el.className;
      return typeof cls === 'string' && cls.includes('modal');
    }),
    document.body,
  ];
  for (const container of containers) {
    const buttons = Array.from(container.querySelectorAll('button, [role="button"]'));
    for (const btn of buttons) {
      const text = (btn.textContent || '').trim().toLowerCase();
      if (text === target) { btn.click(); return true; }
    }
  }
  return false;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`clickModalButton: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

/**
 * Check if any overlay element blocks the given selector.
 * Returns true if the target exists and is covered by an overlay.
 */
export async function isOverlayBlocking(client: CdpClient, selector: string): Promise<boolean> {
  const expression = `(() => {
  const target = document.querySelector(${JSON.stringify(selector)});
  if (!target) return false;
  const targetRect = target.getBoundingClientRect();
  if (targetRect.width === 0 && targetRect.height === 0) return false;
  const targetStyle = window.getComputedStyle(target);
  const targetZ = parseInt(targetStyle.zIndex, 10) || 0;
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    if (el === target || target.contains(el) || el.contains(target)) continue;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= targetZ) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.left <= centerX && rect.right >= centerX && rect.top <= centerY && rect.bottom >= centerY) {
      return true;
    }
  }
  return false;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`isOverlayBlocking: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

/**
 * Press Escape to dismiss any visible overlay, then click document.body at (1,1) as fallback.
 */
export async function dismissOverlay(client: CdpClient): Promise<void> {
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });

  const expression = `(() => {
  const el = document.elementFromPoint(1, 1) || document.body;
  el.click();
})()`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`dismissOverlay: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
