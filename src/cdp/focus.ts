// src/cdp/focus.ts
import { CdpClient } from './client';

/**
 * Return a CSS selector string for the currently focused element, or null if
 * nothing meaningful is focused. Builds the selector from tagName + id (if
 * present) + class list. Returns 'body' when document.body has focus.
 */
export async function getFocusedSelector(client: CdpClient): Promise<string | null> {
  const expression = `(() => {
    const el = document.activeElement;
    if (!el || el === document.documentElement) return null;
    if (el === document.body) return 'body';
    let sel = el.tagName.toLowerCase();
    if (el.id) {
      sel += '#' + CSS.escape(el.id);
    } else {
      const classes = Array.from(el.classList)
        .map(c => '.' + CSS.escape(c))
        .join('');
      sel += classes;
    }
    return sel;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`getFocusedSelector: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
  return (result.value as string | null) ?? null;
}

/**
 * Press Tab to move focus to the next focusable element.
 */
export async function tabToNext(client: CdpClient): Promise<void> {
  await (client.raw.Input as any).dispatchKeyEvent({ type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 0 });
  await (client.raw.Input as any).dispatchKeyEvent({ type: 'keyUp',   key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 0 });
}

/**
 * Press Shift+Tab to move focus to the previous focusable element.
 */
export async function tabToPrev(client: CdpClient): Promise<void> {
  // modifier bit 8 = Shift
  await (client.raw.Input as any).dispatchKeyEvent({ type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  await (client.raw.Input as any).dispatchKeyEvent({ type: 'keyUp',   key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
}

/**
 * Return all focusable elements in document order. For each element the
 * returned object contains:
 *   selector  - a CSS selector string (tag + id/classes)
 *   tag       - lower-case tag name
 *   type      - value of the `type` attribute (for inputs), or null
 */
export async function getFocusableElements(
  client: CdpClient,
): Promise<Array<{ selector: string; tag: string; type: string | null }>> {
  const expression = `(() => {
    const QUERY = [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const nodes = Array.from(document.querySelectorAll(QUERY));
    return nodes.map(el => {
      const tag = el.tagName.toLowerCase();
      let sel = tag;
      if (el.id) {
        sel += '#' + CSS.escape(el.id);
      } else {
        const classes = Array.from(el.classList)
          .map(c => '.' + CSS.escape(c))
          .join('');
        sel += classes;
      }
      const type = el.getAttribute('type');
      return { selector: sel, tag, type };
    });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`getFocusableElements: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
  return (result.value as Array<{ selector: string; tag: string; type: string | null }>) ?? [];
}

/**
 * Inject a keydown listener on the element matched by `selector` that traps
 * Tab / Shift+Tab focus within it (cycling between the first and last focusable
 * descendants). Sets a `data-focus-trap` attribute on a sentinel element so
 * isFocusTrapped() can detect the trap.
 */
export async function trapFocusInElement(client: CdpClient, selector: string): Promise<void> {
  const expression = `(() => {
    const container = document.querySelector(${JSON.stringify(selector)});
    if (!container) throw new Error('trapFocusInElement: element not found: ' + ${JSON.stringify(selector)});

    const FOCUSABLE = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function getFocusable() {
      return Array.from(container.querySelectorAll(FOCUSABLE));
    }

    function handler(e) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handler);

    // Sentinel: mark with data attribute so isFocusTrapped() can detect it
    if (!container.hasAttribute('data-focus-trap')) {
      container.setAttribute('data-focus-trap', 'true');
    }

    // Stash the handler reference so releaseFocusTrap() can remove it
    if (!window.__focusTrapHandlers) window.__focusTrapHandlers = [];
    window.__focusTrapHandlers.push({ container, handler });

    // Focus the first focusable child immediately
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();
  })()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`trapFocusInElement: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
}

/**
 * Return true if a focus trap listener is currently active on any element
 * (detected via the `data-focus-trap` attribute sentinel).
 */
export async function isFocusTrapped(client: CdpClient): Promise<boolean> {
  const expression = `document.querySelector('[data-focus-trap]') !== null`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`isFocusTrapped: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
  return Boolean(result.value);
}

/**
 * Remove all active focus trap listeners. Removes the `data-focus-trap`
 * attribute from all sentinel elements and clears stored handler references
 * from window.__focusTrapHandlers.
 */
export async function releaseFocusTrap(client: CdpClient): Promise<void> {
  const expression = `(() => {
    // Remove event listeners via stored references
    if (window.__focusTrapHandlers && Array.isArray(window.__focusTrapHandlers)) {
      for (const { container, handler } of window.__focusTrapHandlers) {
        try {
          container.removeEventListener('keydown', handler);
          container.removeAttribute('data-focus-trap');
        } catch (e) {
          // Container may have been removed from DOM — ignore
        }
      }
      window.__focusTrapHandlers = [];
    }

    // Belt-and-suspenders: remove any remaining sentinel attributes
    const remaining = Array.from(document.querySelectorAll('[data-focus-trap]'));
    for (const el of remaining) {
      el.removeAttribute('data-focus-trap');
    }
  })()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`releaseFocusTrap: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
}

/**
 * Focus the nth (0-based) element matching `selector` by calling .focus() on
 * it directly via Runtime.evaluate.
 */
export async function focusNthElement(
  client: CdpClient,
  selector: string,
  n: number,
): Promise<void> {
  const expression = `(() => {
    const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
    if (nodes.length === 0) throw new Error('focusNthElement: no elements match ' + ${JSON.stringify(selector)});
    const idx = ${JSON.stringify(n)};
    if (idx < 0 || idx >= nodes.length) {
      throw new Error('focusNthElement: index ' + idx + ' out of range (0..' + (nodes.length - 1) + ')');
    }
    nodes[idx].focus();
  })()`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`focusNthElement: ${exceptionDetails.text ?? JSON.stringify(exceptionDetails)}`);
  }
}
