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

/**
 * getSelectionRanges — Current selection ranges:
 * { rangeCount, isCollapsed, hasSelection }
 */
export async function getSelectionRanges(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel=window.getSelection();return{rangeCount:sel?sel.rangeCount:0,isCollapsed:sel?sel.isCollapsed:true,hasSelection:sel?sel.toString().length>0:false} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getSelectedNodeInfo — Node containing the selection anchor:
 * { tag, id, class_preview, text_preview }
 */
export async function getSelectedNodeInfo(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel=window.getSelection();if(!sel||!sel.anchorNode)return{tag:null,id:null,class_preview:null,text_preview:null};const n=sel.anchorNode.nodeType===3?sel.anchorNode.parentElement:sel.anchorNode;return{tag:n?n.tagName?n.tagName.toLowerCase():null:null,id:n&&n.id?n.id:null,class_preview:n&&n.className?(n.className||'').toString().slice(0,40):null,text_preview:sel.toString().slice(0,60)} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getCaretPosition2 — Caret position in focused input:
 * { inInput, tag, id, selectionStart, selectionEnd, value_preview }
 * (Renamed from getCaretPosition to avoid collision with selection.ts export.)
 */
export async function getCaretPosition2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const el=document.activeElement;if(!el||!('selectionStart' in el))return{inInput:false};return{inInput:true,tag:el.tagName.toLowerCase(),id:el.id||null,selectionStart:el.selectionStart,selectionEnd:el.selectionEnd,value_preview:(el.value||'').slice(0,60)} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getSelectionBounds — Bounding rect of current selection:
 * { x, y, width, height, hasSelection }
 */
export async function getSelectionBounds(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel=window.getSelection();if(!sel||sel.rangeCount===0)return{hasSelection:false};try{const r=sel.getRangeAt(0).getBoundingClientRect();return{hasSelection:true,x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}}catch(e){return{hasSelection:false,error:e.message}} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTextSelection2 — Currently selected text:
 * { text_preview, length }
 * (Renamed from getTextSelection to avoid collision with existing export in this file.)
 */
export async function getTextSelection2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const t=window.getSelection()?window.getSelection().toString():'';return{text_preview:t.slice(0,200),length:t.length} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getSelectionContainer — Deepest common ancestor of selection:
 * { tag, id, class_preview }
 */
export async function getSelectionContainer(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel=window.getSelection();if(!sel||sel.rangeCount===0)return{tag:null,id:null,class_preview:null};try{const el=sel.getRangeAt(0).commonAncestorContainer;const n=el.nodeType===3?el.parentElement:el;return{tag:n?n.tagName?n.tagName.toLowerCase():null:null,id:n&&n.id?n.id:null,class_preview:n&&n.className?(n.className||'').toString().slice(0,40):null}}catch(e){return{tag:null,id:null,class_preview:null}} })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getRichTextEditors — Rich text editor elements:
 * [{ tag, id, class_preview, framework }] (max 20)
 */
export async function getRichTextEditors(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[contenteditable="true"],[role="textbox"],[class*="ql-editor"],[class*="ProseMirror"],[class*="tiptap"],[class*="codex-editor"],[class*="DraftEditor"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>{let fw='generic';if(el.className&&el.className.toString().includes('ql-'))fw='quill';else if(el.className&&el.className.toString().includes('ProseMirror'))fw='prosemirror';else if(el.className&&el.className.toString().includes('tiptap'))fw='tiptap';return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),framework:fw}}) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getMarkdownEditors — Markdown editor elements (CodeMirror, Monaco, ACE):
 * [{ tag, id, class_preview, editor }] (max 10)
 */
export async function getMarkdownEditors(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="CodeMirror"],[class*="monaco-editor"],[class*="ace_editor"],[class*="cm-editor"]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>{let ed='unknown';const c=(el.className||'').toString();if(c.includes('CodeMirror'))ed='codemirror';else if(c.includes('monaco'))ed='monaco';else if(c.includes('ace_'))ed='ace';else if(c.includes('cm-editor'))ed='codemirror6';return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:c.slice(0,40),editor:ed}}) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
