// src/cdp/clipboard3.ts
// Clipboard, drag-and-drop, selection, and user interaction state inspection.
//
// Naming notes:
//   getFocusedElement2  — getFocusedElement already exported from accessibility.ts
//   getDropZones2       — getDropZones already exported from drag2.ts
//   getTabOrder2        — getTabOrder already exported from a11y2.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getTextSelection — Get currently selected text and its container:
 * { text, anchorTag, focusTag, isCollapsed }
 */
export async function getTextSelection(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return JSON.stringify({ text: '', isCollapsed: true });
  return JSON.stringify({ text: sel.toString().slice(0,200), isCollapsed: sel.isCollapsed, anchorTag: sel.anchorNode ? (sel.anchorNode.parentElement ? sel.anchorNode.parentElement.tagName.toLowerCase() : 'text') : null, focusTag: sel.focusNode ? (sel.focusNode.parentElement ? sel.focusNode.parentElement.tagName.toLowerCase() : 'text') : null });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getSelectableText — Get total word count of user-selectable text on page:
 * { wordCount, charCount }
 */
export async function getSelectableText(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var text = document.body ? document.body.innerText : '';
  var words = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  return JSON.stringify({ wordCount: words.length, charCount: text.length });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getDraggableCount — Count elements with draggable=true:
 * { count, elements: [{tag, id, text_preview}] } (max 20)
 */
export async function getDraggableCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = document.querySelectorAll('[draggable="true"]');
  return JSON.stringify({ count: els.length, elements: Array.from(els).slice(0,20).map(function(el) { return { tag: el.tagName.toLowerCase(), id: el.id, text: el.textContent.trim().slice(0,50) }; }) });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getDropZones2 — Find elements with ondrop or data-droptarget or dropzone attribute:
 * tag, id, class (max 20)
 * (Renamed from getDropZones to avoid collision with drag2.ts export.)
 */
export async function getDropZones2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = document.querySelectorAll('[ondrop],[data-droptarget],[dropzone]');
  return JSON.stringify(Array.from(els).slice(0,20).map(function(el) { return { tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,30), dropzone: el.getAttribute('dropzone') }; }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getContentEditable — Find all contenteditable elements:
 * tag, id, class, text_preview, isPlainText (max 20)
 */
export async function getContentEditable(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = document.querySelectorAll('[contenteditable]');
  return JSON.stringify(Array.from(els).slice(0,20).map(function(el) { return { tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,30), text_preview: el.textContent.trim().slice(0,100), isPlainText: el.getAttribute('contenteditable') === 'plaintext-only' }; }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getFocusedElement2 — Get the currently focused element:
 * { tag, id, type, role, value_preview }
 * (Renamed from getFocusedElement to avoid collision with accessibility.ts export.)
 */
export async function getFocusedElement2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var el = document.activeElement;
  if (!el || el === document.body) return JSON.stringify({ tag: 'body', id: '', focused: false });
  return JSON.stringify({ tag: el.tagName.toLowerCase(), id: el.id, type: el.getAttribute('type'), role: el.getAttribute('role'), value_preview: (el.value||el.textContent||'').slice(0,100), focused: true });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTabOrder2 — Get elements in tab order (tabIndex >= 0) in DOM order:
 * tag, id, tabIndex (max 30)
 * (Renamed from getTabOrder to avoid collision with a11y2.ts export.)
 */
export async function getTabOrder2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('[tabindex]');
  var result = Array.from(all).filter(function(el) { return parseInt(el.getAttribute('tabindex')) >= 0; });
  result.sort(function(a,b) { return parseInt(a.getAttribute('tabindex')) - parseInt(b.getAttribute('tabindex')); });
  return JSON.stringify(result.slice(0,30).map(function(el) { return { tag: el.tagName.toLowerCase(), id: el.id, tabIndex: parseInt(el.getAttribute('tabindex')) }; }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getClipboardSupport — Check Clipboard API support and permissions:
 * { supported, readSupported, writeSupported }
 */
export async function getClipboardSupport(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ supported: !!navigator.clipboard, readSupported: !!(navigator.clipboard && navigator.clipboard.readText), writeSupported: !!(navigator.clipboard && navigator.clipboard.writeText) });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
