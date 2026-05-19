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

// ─── getDraggableElements3 ───────────────────────────────────────────────────
// Elements with draggable=true: [{tag, id, class_preview, text_preview}] (max 20)
// (getDraggableElements = drag2.ts, getDraggableElements2 = pointer.ts)
export async function getDraggableElements3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('[draggable="true"]'), 0, 20);
        return els.map(function(el) {
          var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
          var txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
          return { tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls, text_preview: txt };
        });
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDropTargets2 ─────────────────────────────────────────────────────────
// Elements with drop event handlers (heuristic): [{tag, id, class_preview}] (max 20)
// Looks for [class*="drop"], [class*="droptarget"], [data-drop], [ondrop]
// (getDropTargets = pointer.ts)
export async function getDropTargets2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var sel = '[class*="drop"],[class*="droptarget"],[data-drop],[ondrop]';
        var els = Array.prototype.slice.call(document.querySelectorAll(sel), 0, 20);
        return els.map(function(el) {
          var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
          return { tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls };
        });
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getSortableLists ────────────────────────────────────────────────────────
// Lists with sortable indicators: [{tag, id, class_preview, itemCount}] (max 10)
// Looks for [class*="sortable"], [class*="draggable-list"], [data-sortable]
export async function getSortableLists(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var sel = '[class*="sortable"],[class*="draggable-list"],[data-sortable]';
        var els = Array.prototype.slice.call(document.querySelectorAll(sel), 0, 10);
        return els.map(function(el) {
          var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            itemCount: el.children.length
          };
        });
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getTouchActionElements2 ─────────────────────────────────────────────────
// Elements with touch-action CSS set to a non-auto value: [{tag, id, class_preview, touchAction}] (max 20)
// (getTouchActionElements = touch2.ts)
export async function getTouchActionElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var ta = window.getComputedStyle(el).touchAction;
          if (ta && ta !== 'auto') {
            var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
            out.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls, touchAction: ta });
          }
        }
        return out;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getPointerEvents3 ───────────────────────────────────────────────────────
// Elements with pointer-events:none: [{tag, id, class_preview}] (max 20)
// (getPointerEvents = pointer.ts, getPointerEvents2 = pointer.ts)
export async function getPointerEvents3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          if (window.getComputedStyle(el).pointerEvents === 'none') {
            var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
            out.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls });
          }
        }
        return out;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getResizableElements ────────────────────────────────────────────────────
// Elements with CSS resize property set (not none): [{tag, id, class_preview, resize}] (max 20)
export async function getResizableElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var out = [];
        for (var i = 0; i < all.length && out.length < 20; i++) {
          var el = all[i];
          var r = window.getComputedStyle(el).resize;
          if (r && r !== 'none') {
            var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
            out.push({ tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls, resize: r });
          }
        }
        return out;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getCursorStyles2 ────────────────────────────────────────────────────────
// Unique cursor values used on interactive elements: [{cursor, count, example_tag}] (max 20)
// Samples a, button, input, [class*="btn"], [role="button"]
// (getCursorStyles = pointer.ts)
export async function getCursorStyles2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(
          document.querySelectorAll('a,button,input,[class*="btn"],[role="button"]')
        );
        var map = {};
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          var c = window.getComputedStyle(el).cursor || 'auto';
          if (!map[c]) map[c] = { cursor: c, count: 0, example_tag: el.tagName.toLowerCase() };
          map[c].count++;
        }
        var arr = Object.keys(map).map(function(k) { return map[k]; });
        arr.sort(function(a, b) { return b.count - a.count; });
        return arr.slice(0, 20);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDragHandles ──────────────────────────────────────────────────────────
// Drag handle elements: [{tag, id, class_preview, ariaLabel_preview}] (max 20)
// Looks for [class*="handle"], [class*="drag-handle"], [aria-grabbed], [role="button"][data-drag]
export async function getDragHandles(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var sel = '[class*="handle"],[class*="drag-handle"],[aria-grabbed],[role="button"][data-drag]';
        var els = Array.prototype.slice.call(document.querySelectorAll(sel), 0, 20);
        return els.map(function(el) {
          var cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '';
          var lbl = (el.getAttribute('aria-label') || '').slice(0, 80);
          return { tag: el.tagName.toLowerCase(), id: el.id || '', class_preview: cls, ariaLabel_preview: lbl };
        });
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error' }) }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
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
