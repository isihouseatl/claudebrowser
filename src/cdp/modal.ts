// src/cdp/modal.ts
import { CdpClient } from './client';

// ---------------------------------------------------------------------------
// isModalOpen
// ---------------------------------------------------------------------------

/**
 * Detect if any in-page modal/overlay is currently visible.
 * Checks for: role="dialog", class containing "modal" or "overlay",
 * or any element with z-index > 1000 that is visible in the viewport.
 */
export async function isModalOpen(client: CdpClient): Promise<boolean> {
  const expression = `(() => {
  // Check role="dialog"
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
  for (const el of dialogs) {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return true;
    }
  }
  // Check class containing "modal" or "overlay"
  const byClass = Array.from(document.querySelectorAll('[class]')).filter(el => {
    const cls = el.className;
    return typeof cls === 'string' && (cls.includes('modal') || cls.includes('overlay'));
  });
  for (const el of byClass) {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return true;
    }
  }
  // Check any element with high z-index
  const all = Array.from(document.querySelectorAll('*'));
  for (const el of all) {
    const style = window.getComputedStyle(el);
    const z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= 1000) continue;
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return true;
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
    throw new Error(`isModalOpen: JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

// ---------------------------------------------------------------------------
// getModalContent
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

// ---------------------------------------------------------------------------
// closeModal
// ---------------------------------------------------------------------------

/**
 * Try to close an open modal.
 * Strategy 1: Click a button with aria-label="Close" or text matching Close/×/✕/Cancel.
 * Strategy 2: Press Escape.
 * Returns true if a close button was found and clicked, false if Escape was used.
 */
export async function closeModal(client: CdpClient): Promise<boolean> {
  const expression = `(() => {
  const closeTexts = ['close', '\u00d7', '\u2715', 'cancel'];
  // Search within modal containers first, then fallback to full document
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
      if (ariaLabel.toLowerCase() === 'close') {
        btn.click();
        return true;
      }
      const text = (btn.textContent || '').trim().toLowerCase();
      if (closeTexts.includes(text)) {
        btn.click();
        return true;
      }
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
    await client.raw.Input.dispatchKeyEvent({
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await client.raw.Input.dispatchKeyEvent({
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
  }

  return clicked;
}

// ---------------------------------------------------------------------------
// waitForModal
// ---------------------------------------------------------------------------

/**
 * Poll every 200ms for up to timeoutMs (default 5000ms) for a modal to appear.
 * Returns true when a modal is detected, false on timeout.
 * Polling is done Node-side.
 */
export async function waitForModal(client: CdpClient, timeoutMs: number = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const open = await isModalOpen(client);
    if (open) return true;
    await new Promise<void>(r => setTimeout(r, 200));
  }
  return false;
}

// ---------------------------------------------------------------------------
// getModalButtons
// ---------------------------------------------------------------------------

/**
 * Find all buttons inside role="dialog" or .modal elements.
 * Returns an array of { text, selector } for each button found.
 * The selector is an nth-of-type CSS path scoped to the modal container.
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
    buttons.forEach((btn, index) => {
      if (seen.has(btn)) return;
      seen.add(btn);
      const text = (btn.textContent || '').trim();
      const tag = btn.tagName.toLowerCase();
      const role = btn.getAttribute('role');
      // Build a selector: tag with nth-child index relative to its parent
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

// ---------------------------------------------------------------------------
// clickModalButton
// ---------------------------------------------------------------------------

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
      if (text === target) {
        btn.click();
        return true;
      }
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

// ---------------------------------------------------------------------------
// isOverlayBlocking
// ---------------------------------------------------------------------------

/**
 * Check if any overlay element blocks the given selector.
 * Compares z-index values and bounding box overlap between the target element
 * and all visible high-z-index elements.
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
    // Check if el overlaps the center point of the target
    if (
      rect.left <= centerX && rect.right >= centerX &&
      rect.top <= centerY && rect.bottom >= centerY
    ) {
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

// ---------------------------------------------------------------------------
// dismissOverlay
// ---------------------------------------------------------------------------

/**
 * Press Escape to dismiss any visible overlay, then click document.body at (1,1)
 * as a fallback to ensure focus is shifted away from the overlay.
 */
export async function dismissOverlay(client: CdpClient): Promise<void> {
  await client.raw.Input.dispatchKeyEvent({
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await client.raw.Input.dispatchKeyEvent({
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });

  // Fallback: click body at (1, 1) to shift focus away from any remaining overlay
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
