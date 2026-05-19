// src/cdp/drag2.ts
// HTML5 drag-and-drop inspection and simulation helpers.
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ─── getDraggableElements ────────────────────────────────────────────────────
// Find all elements with draggable="true" attribute.
// Returns JSON array of {tag, id, text} (first 20, text truncated to 50 chars).
export async function getDraggableElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('[draggable="true"]'), 0, 20);
        return els.map(function(el) {
          var text = (el.textContent || '').trim().slice(0, 50);
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            text: text
          };
        });
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null/undefined');
    }
    return ok(JSON.stringify(result.value, null, 2));
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getDropZones ────────────────────────────────────────────────────────────
// Find elements with ondragover or ondrop handlers.
// Returns JSON array of {tag, id, class} (first 20).
export async function getDropZones(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var zones = [];
        for (var i = 0; i < all.length && zones.length < 20; i++) {
          var el = all[i];
          if (typeof el.ondragover === 'function' || typeof el.ondrop === 'function') {
            zones.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              class: el.className || ''
            });
          }
        }
        return zones;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null/undefined');
    }
    return ok(JSON.stringify(result.value, null, 2));
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── simulateDragStart ───────────────────────────────────────────────────────
// Dispatch dragstart event on element matching selector.
export async function simulateDragStart(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        var evt = new DragEvent('dragstart', { bubbles: true, cancelable: true });
        el.dispatchEvent(evt);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok('dragstart dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── simulateDragEnd ─────────────────────────────────────────────────────────
// Dispatch dragend event on element matching selector.
export async function simulateDragEnd(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        var evt = new DragEvent('dragend', { bubbles: true, cancelable: true });
        el.dispatchEvent(evt);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok('dragend dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── simulateDragEnter ───────────────────────────────────────────────────────
// Dispatch dragenter event on element matching selector.
export async function simulateDragEnter(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        var evt = new DragEvent('dragenter', { bubbles: true, cancelable: true });
        el.dispatchEvent(evt);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok('dragenter dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── simulateDragOver ────────────────────────────────────────────────────────
// Dispatch dragover event (with preventDefault) on element matching selector.
export async function simulateDragOver(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        var evt = new DragEvent('dragover', { bubbles: true, cancelable: true });
        evt.preventDefault();
        el.dispatchEvent(evt);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok('dragover dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── simulateDrop ────────────────────────────────────────────────────────────
// Dispatch drop event on element matching selector.
export async function simulateDrop(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        var evt = new DragEvent('drop', { bubbles: true, cancelable: true });
        el.dispatchEvent(evt);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok('drop dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── isDraggable ─────────────────────────────────────────────────────────────
// Check if element matching selector has draggable="true" attribute.
// Returns JSON {draggable: bool}.
export async function isDraggable(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
        return { draggable: el.getAttribute('draggable') === 'true' };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('evaluate returned null/undefined');
    }
    return ok(JSON.stringify(result.value));
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
