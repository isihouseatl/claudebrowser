// src/cdp/dialog2.ts
// CDP module for interacting with HTML <dialog> elements and page overlays.
// Covers: getDialogElements, getOpenDialogs, openDialog, closeDialog,
//         getDialogReturnValue, isDialogOpen, getActiveModals, clickDialogButton
// Extended: getOpenDialogs2, getDialogCount, getAlertElements, getTooltips,
//           getPopupMenus, getNotifications, getFocusTrap, getDrawers
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---------------------------------------------------------------------------
// getDialogElements
// ---------------------------------------------------------------------------

/**
 * Find all <dialog> elements on the page.
 * Returns JSON array of { id, open, hasReturnValue }.
 * `open` reflects the element's .open property (boolean).
 * `hasReturnValue` is true when dialog.returnValue is a non-empty string.
 */
export async function getDialogElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var dialogs = Array.from(document.querySelectorAll('dialog'));
  var results = dialogs.map(function(el) {
    return {
      id: el.id || null,
      open: el.open,
      hasReturnValue: el.returnValue !== ''
    };
  });
  return JSON.stringify(results);
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getOpenDialogs
// ---------------------------------------------------------------------------

/**
 * Find only open <dialog> elements (el.open === true).
 * Returns JSON array of { id, preview } where preview is the first 100 chars
 * of innerHTML.
 */
export async function getOpenDialogs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var dialogs = Array.from(document.querySelectorAll('dialog'));
  var open = dialogs.filter(function(el) { return el.open; });
  var results = open.map(function(el) {
    return {
      id: el.id || null,
      preview: (el.innerHTML || '').substring(0, 100)
    };
  });
  return JSON.stringify(results);
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// openDialog
// ---------------------------------------------------------------------------

/**
 * Call .showModal() on a <dialog> element matched by selector.
 * Returns "Dialog opened" on success.
 */
export async function openDialog(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = ${JSON.stringify(selector)};
  var el = document.querySelector(sel);
  if (!el) return 'not-found';
  el.showModal();
  return 'ok';
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    if (result.value === 'not-found') {
      return err(`No element found for selector: ${selector}`);
    }
    return ok('Dialog opened');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// closeDialog
// ---------------------------------------------------------------------------

/**
 * Call .close() on a <dialog> element matched by selector.
 * Returns "Dialog closed" on success.
 */
export async function closeDialog(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = ${JSON.stringify(selector)};
  var el = document.querySelector(sel);
  if (!el) return 'not-found';
  el.close();
  return 'ok';
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    if (result.value === 'not-found') {
      return err(`No element found for selector: ${selector}`);
    }
    return ok('Dialog closed');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getDialogReturnValue
// ---------------------------------------------------------------------------

/**
 * Return JSON { returnValue } from dialog.returnValue for the element matched
 * by selector.
 */
export async function getDialogReturnValue(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = ${JSON.stringify(selector)};
  var el = document.querySelector(sel);
  if (!el) return null;
  return JSON.stringify({ returnValue: el.returnValue });
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err(`No element found for selector: ${selector}`);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// isDialogOpen
// ---------------------------------------------------------------------------

/**
 * Return JSON { open: bool } reflecting dialog.open for the element matched
 * by selector.
 */
export async function isDialogOpen(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = ${JSON.stringify(selector)};
  var el = document.querySelector(sel);
  if (!el) return null;
  return JSON.stringify({ open: el.open });
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err(`No element found for selector: ${selector}`);
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getActiveModals
// ---------------------------------------------------------------------------

/**
 * Find all visible overlay elements: fixed or absolute position, z-index > 100,
 * non-zero bounding box, not hidden/invisible.
 * Returns JSON array of { tag, id, zIndex } for the first 10 results.
 */
export async function getActiveModals(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var all = Array.from(document.querySelectorAll('*'));
  var results = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var style = window.getComputedStyle(el);
    var pos = style.position;
    if (pos !== 'fixed' && pos !== 'absolute') continue;
    var z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= 100) continue;
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      zIndex: z
    });
    if (results.length >= 10) break;
  }
  return JSON.stringify(results);
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// clickDialogButton
// ---------------------------------------------------------------------------

/**
 * Find the first <button> inside a <dialog> matched by selector and click it.
 * Returns "Button clicked" if found, "No button found" otherwise.
 */
export async function clickDialogButton(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
  var sel = ${JSON.stringify(selector)};
  var dialog = document.querySelector(sel);
  if (!dialog) return 'not-found';
  var btn = dialog.querySelector('button');
  if (!btn) return 'no-button';
  btn.click();
  return 'ok';
})()`;

    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });

    if (exceptionDetails) {
      return err(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown JS error',
      );
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    if (result.value === 'not-found') {
      return err(`No element found for selector: ${selector}`);
    }
    if (result.value === 'no-button') {
      return ok('No button found');
    }
    return ok('Button clicked');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getOpenDialogs2
// ---------------------------------------------------------------------------

/**
 * Find all <dialog> elements that are open (have the `open` attribute).
 * Returns JSON array of { id, class, hasCloseButton, text_snippet }[]. Max 10.
 * NOTE: named getOpenDialogs2 because getOpenDialogs already exists above.
 */
export async function getOpenDialogs2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var dialogs = Array.from(document.querySelectorAll('dialog[open]'));
  var results = dialogs.slice(0, 10).map(function(el) {
    var closeBtn = el.querySelector('button[aria-label*="close" i], button[class*="close" i], button[data-dismiss], [role="button"][aria-label*="close" i]');
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 120);
    return {
      id: el.id || null,
      class: el.className || null,
      hasCloseButton: !!closeBtn,
      text_snippet: text
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getDialogCount
// ---------------------------------------------------------------------------

/**
 * Return counts of dialog elements on the page.
 * Returns { total, open, withOpen, withRole } where:
 *   total    = all <dialog> elements
 *   open     = dialogs with .open === true
 *   withOpen = dialogs with the `open` HTML attribute
 *   withRole = elements with role="dialog"
 */
export async function getDialogCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var allDialogs = document.querySelectorAll('dialog');
  var openProp = Array.from(allDialogs).filter(function(el) { return el.open; });
  var withAttr = Array.from(allDialogs).filter(function(el) { return el.hasAttribute('open'); });
  var withRole = document.querySelectorAll('[role="dialog"]');
  return JSON.stringify({
    total: allDialogs.length,
    open: openProp.length,
    withOpen: withAttr.length,
    withRole: withRole.length
  });
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getAlertElements
// ---------------------------------------------------------------------------

/**
 * Find elements with role="alert" or role="alertdialog".
 * Returns JSON array of { tag, id, class, text }[]. Max 10.
 */
export async function getAlertElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="alert"], [role="alertdialog"]'));
  var results = els.slice(0, 10).map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 200)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getTooltips
// ---------------------------------------------------------------------------

/**
 * Find elements with role="tooltip" or a data-tooltip attribute.
 * Returns JSON array of { tag, id, text, targetId }[]. Max 20.
 * targetId is the value of aria-describedby on any element pointing to this tooltip.
 */
export async function getTooltips(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="tooltip"], [data-tooltip]'));
  var results = els.slice(0, 20).map(function(el) {
    var tooltipId = el.id || null;
    var targetId = null;
    if (tooltipId) {
      var ref = document.querySelector('[aria-describedby="' + tooltipId + '"]');
      if (ref) targetId = ref.id || null;
    }
    var text = el.hasAttribute('data-tooltip')
      ? (el.getAttribute('data-tooltip') || '')
      : (el.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 200);
    return {
      tag: el.tagName.toLowerCase(),
      id: tooltipId,
      text: text,
      targetId: targetId
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getPopupMenus
// ---------------------------------------------------------------------------

/**
 * Find elements with role="menu" or role="listbox" that are visible
 * (computed display is not none). Returns { tag, id, class, itemCount }[]. Max 10.
 */
export async function getPopupMenus(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="menu"], [role="listbox"]'));
  var visible = els.filter(function(el) {
    var style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
  var results = visible.slice(0, 10).map(function(el) {
    var items = el.querySelectorAll('[role="menuitem"], [role="option"], li, [role="menuitemcheckbox"], [role="menuitemradio"]');
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      itemCount: items.length
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getNotifications
// ---------------------------------------------------------------------------

/**
 * Find elements with role="status", role="log", or an aria-live attribute.
 * Returns { tag, id, ariaLive, text }[]. Max 20.
 */
export async function getNotifications(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="status"], [role="log"], [aria-live]'));
  var results = els.slice(0, 20).map(function(el) {
    var liveVal = el.getAttribute('aria-live') || el.getAttribute('role') || null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      ariaLive: liveVal,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 200)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getFocusTrap
// ---------------------------------------------------------------------------

/**
 * Check if a focus trap is active on the page.
 * Returns { hasFocusTrap, modalElement } where modalElement is a descriptor
 * string of the trapping element if found, or null.
 * Detects: aria-modal="true" elements, and programmatically focused
 * tabindex="-1" elements that match the active element.
 */
export async function getFocusTrap(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var hasFocusTrap = false;
  var modalElement = null;

  // Check aria-modal="true"
  var ariaModals = Array.from(document.querySelectorAll('[aria-modal="true"]'));
  if (ariaModals.length > 0) {
    hasFocusTrap = true;
    var m = ariaModals[0];
    modalElement = m.tagName.toLowerCase() + (m.id ? '#' + m.id : '') + (m.className ? '.' + String(m.className).split(' ')[0] : '');
  }

  // Check programmatically focused tabindex="-1" element
  var active = document.activeElement;
  if (!hasFocusTrap && active && active !== document.body) {
    var ti = active.getAttribute('tabindex');
    if (ti === '-1') {
      hasFocusTrap = true;
      var tag = active.tagName.toLowerCase();
      var id = active.id ? '#' + active.id : '';
      var cls = active.className ? '.' + String(active.className).split(' ')[0] : '';
      modalElement = tag + id + cls;
    }
  }

  return JSON.stringify({ hasFocusTrap: hasFocusTrap, modalElement: modalElement });
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getDrawers
// ---------------------------------------------------------------------------

/**
 * Find elements that look like drawers or sidebars by class name patterns:
 * "drawer", "sidebar", "panel", "flyout", "offcanvas".
 * Returns { tag, id, class, isVisible }[]. Max 10.
 * isVisible = computed display !== none AND visibility !== hidden.
 */
export async function getDrawers(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var patterns = ['drawer', 'sidebar', 'panel', 'flyout', 'offcanvas'];
  var seen = new Set();
  var results = [];
  var all = Array.from(document.querySelectorAll('*'));
  for (var i = 0; i < all.length && results.length < 10; i++) {
    var el = all[i];
    var cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';
    var matches = patterns.some(function(p) { return cls.indexOf(p) !== -1; });
    if (!matches) continue;
    if (seen.has(el)) continue;
    seen.add(el);
    var style = window.getComputedStyle(el);
    var visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      isVisible: visible
    });
  }
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null or undefined');
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// getDialogElements2
// ---------------------------------------------------------------------------

/**
 * All <dialog> elements: [{id, class, open, hasForm, text_preview}] (max 20).
 * Richer variant of getDialogElements — adds class, hasForm, and text_preview.
 */
export async function getDialogElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var dialogs = Array.from(document.querySelectorAll('dialog'));
  var results = dialogs.slice(0, 20).map(function(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      id: el.id || null,
      class: el.className || null,
      open: el.open,
      hasForm: !!el.querySelector('form'),
      text_preview: text.substring(0, 80)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getOpenDialogs3
// ---------------------------------------------------------------------------

/**
 * <dialog[open]> elements: [{id, class, text_preview}] (max 10).
 * Variant using the open HTML attribute selector.
 */
export async function getOpenDialogs3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var dialogs = Array.from(document.querySelectorAll('dialog[open]'));
  var results = dialogs.slice(0, 10).map(function(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      id: el.id || null,
      class: el.className || null,
      text_preview: text.substring(0, 80)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getModalRoles
// ---------------------------------------------------------------------------

/**
 * Elements with role="dialog" or role="alertdialog":
 * [{tag, id, class, role, ariaLabel_preview, ariaModal}] (max 20).
 */
export async function getModalRoles(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'));
  var results = els.slice(0, 20).map(function(el) {
    var label = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      role: el.getAttribute('role'),
      ariaLabel_preview: label ? String(label).substring(0, 80) : null,
      ariaModal: el.getAttribute('aria-modal')
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getTooltips3
// ---------------------------------------------------------------------------

/**
 * Elements with role="tooltip": [{tag, id, text_preview}] (max 20).
 * Focused variant -- role="tooltip" only, no data-tooltip.
 */
export async function getTooltips3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="tooltip"]'));
  var results = els.slice(0, 20).map(function(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      text_preview: text.substring(0, 80)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getAlerts
// ---------------------------------------------------------------------------

/**
 * Elements with role="alert" or role="status": [{tag, id, role, text_preview}] (max 20).
 */
export async function getAlerts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[role="alert"], [role="status"]'));
  var results = els.slice(0, 20).map(function(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      role: el.getAttribute('role'),
      text_preview: text.substring(0, 80)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getPopoverElements2
// ---------------------------------------------------------------------------

/**
 * Elements with the popover attribute (HTML Popover API):
 * [{tag, id, class, popover}] (max 20).
 */
export async function getPopoverElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[popover]'));
  var results = els.slice(0, 20).map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      popover: el.getAttribute('popover')
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getOverlays2
// ---------------------------------------------------------------------------

/**
 * Elements with high z-index (>100) and fixed/absolute position that are visible:
 * [{tag, id, class, zIndex, position}] (max 10).
 */
export async function getOverlays2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var all = Array.from(document.querySelectorAll('*'));
  var results = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var style = window.getComputedStyle(el);
    var pos = style.position;
    if (pos !== 'fixed' && pos !== 'absolute') continue;
    var z = parseInt(style.zIndex, 10);
    if (isNaN(z) || z <= 100) continue;
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    results.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      zIndex: z,
      position: pos
    });
    if (results.length >= 10) break;
  }
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ---------------------------------------------------------------------------
// getAriaExpanded3
// ---------------------------------------------------------------------------

/**
 * Elements with aria-expanded attribute: [{tag, id, role, ariaExpanded, text_preview}] (max 20).
 */
export async function getAriaExpanded3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var els = Array.from(document.querySelectorAll('[aria-expanded]'));
  var results = els.slice(0, 20).map(function(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      role: el.getAttribute('role'),
      ariaExpanded: el.getAttribute('aria-expanded'),
      text_preview: text.substring(0, 80)
    };
  });
  return JSON.stringify(results);
})()`;

  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(JSON.parse(result.value as string), null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}
