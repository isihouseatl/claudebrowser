// src/cdp/dialog2.ts
// CDP module for interacting with HTML <dialog> elements and page overlays.
// Covers: getDialogElements, getOpenDialogs, openDialog, closeDialog,
//         getDialogReturnValue, isDialogOpen, getActiveModals, clickDialogButton
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
