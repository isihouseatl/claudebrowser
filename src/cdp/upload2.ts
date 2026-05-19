// src/cdp/upload2.ts
// Advanced file upload helpers: drag-drop zones, progress monitoring, multi-file uploads.
import { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface FileInputInfo {
  selector: string;
  accept?: string;
  multiple: boolean;
  name?: string;
  id?: string;
}

export interface UploadProgress {
  percent: number | null;
  text: string;
  visible: boolean;
}

// ---------------------------------------------------------------------------
// findFileInputs
// ---------------------------------------------------------------------------

/**
 * Find all <input type="file"> elements on the page.
 * Returns selector, accept, multiple, name, and id for each.
 */
export async function findFileInputs(client: CdpClient): Promise<FileInputInfo[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  return inputs.map((el, i) => {
    // Build a unique selector: prefer id, fall back to nth-of-type index
    let selector;
    if (el.id) {
      selector = '#' + el.id;
    } else {
      // Count position among all file inputs
      const all = Array.from(document.querySelectorAll('input[type="file"]'));
      const idx = all.indexOf(el);
      selector = 'input[type="file"]:nth-of-type(' + (idx + 1) + ')';
    }
    return {
      selector,
      accept: el.accept || undefined,
      multiple: el.multiple,
      name: el.name || undefined,
      id: el.id || undefined,
    };
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FileInputInfo[]) ?? [];
}

// ---------------------------------------------------------------------------
// setFilesOnInput
// ---------------------------------------------------------------------------

/**
 * Set files on an input[type=file] element using CDP DOM.setFileInputFiles.
 * Uses the CDP-native approach: getDocument → querySelector → setFileInputFiles.
 */
export async function setFilesOnInput(
  client: CdpClient,
  selector: string,
  filePaths: string[],
): Promise<void> {
  const { root } = await (client.raw.DOM as any).getDocument({ depth: 0 });
  const { nodeId } = await (client.raw.DOM as any).querySelector({
    nodeId: root.nodeId,
    selector,
  });
  if (!nodeId) throw new Error(`File input not found: ${selector}`);
  await (client.raw.DOM as any).setFileInputFiles({ nodeId, files: filePaths });
}

// ---------------------------------------------------------------------------
// waitForUploadComplete
// ---------------------------------------------------------------------------

/**
 * Wait until a progress indicator element disappears or reaches 100%.
 * Polls every 300ms. Resolves when the element is gone or its text contains '100'.
 * timeoutMs defaults to 30000ms.
 */
export async function waitForUploadComplete(
  client: CdpClient,
  progressSelector: string,
  timeoutMs: number = 30000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${JSON.stringify(progressSelector)});
  if (!el) return true; // element gone — upload complete
  const style = window.getComputedStyle(el);
  const hidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  if (hidden) return true;
  const text = el.textContent || '';
  if (text.includes('100')) return true;
  return false;
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
    if (result.value === true) return;
    await new Promise<void>(r => setTimeout(r, 300));
  }
  throw new Error(`waitForUploadComplete timed out after ${timeoutMs}ms for: ${progressSelector}`);
}

// ---------------------------------------------------------------------------
// getUploadProgress
// ---------------------------------------------------------------------------

/**
 * Read the current state of a progress indicator.
 * Detects percent via el.value (for <progress>) or by parsing text content for "XX%".
 */
export async function getUploadProgress(
  client: CdpClient,
  progressSelector: string,
): Promise<UploadProgress> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(progressSelector)});
  if (!el) return { percent: null, text: '', visible: false };
  const style = window.getComputedStyle(el);
  const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  const text = (el.textContent || '').trim();
  // Try el.value first (native <progress> element)
  let percent = null;
  if (typeof el.value === 'number' && !isNaN(el.value)) {
    // <progress> value is 0-max; normalise to 0-100
    const max = typeof el.max === 'number' && el.max > 0 ? el.max : 1;
    percent = Math.round((el.value / max) * 100);
  } else {
    // Parse "XX%" from text
    const m = text.match(/(\\d+(?:\\.\\d+)?)\\s*%/);
    if (m) percent = Math.round(parseFloat(m[1]));
  }
  return { percent, text, visible };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as UploadProgress;
}

// ---------------------------------------------------------------------------
// simulateDragDropFile
// ---------------------------------------------------------------------------

/**
 * Simulate dropping a file onto a drop zone using DataTransfer.
 * fileContent is a plain text string (not base64).
 * mimeType defaults to 'text/plain'.
 */
export async function simulateDragDropFile(
  client: CdpClient,
  dropZoneSelector: string,
  fileName: string,
  fileContent: string,
  mimeType: string = 'text/plain',
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const zone = document.querySelector(${JSON.stringify(dropZoneSelector)});
  if (!zone) throw new Error('Drop zone not found: ' + ${JSON.stringify(dropZoneSelector)});
  const file = new File([${JSON.stringify(fileContent)}], ${JSON.stringify(fileName)}, { type: ${JSON.stringify(mimeType)} });
  const dt = new DataTransfer();
  dt.items.add(file);
  const dragoverEvt = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
  zone.dispatchEvent(dragoverEvt);
  const dropEvt = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
  zone.dispatchEvent(dropEvt);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// ---------------------------------------------------------------------------
// clickAndUpload
// ---------------------------------------------------------------------------

/**
 * Click a button to trigger a file chooser, then set files without waiting for a dialog.
 * Strategy: click the button, then wait for an input[type=file] to become visible/active,
 * then call setFilesOnInput on it.
 * timeoutMs defaults to 5000ms.
 */
export async function clickAndUpload(
  client: CdpClient,
  buttonSelector: string,
  filePaths: string[],
  timeoutMs: number = 5000,
): Promise<void> {
  // Get button coordinates and click it
  const { result: coordResult, exceptionDetails: coordEx } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(buttonSelector)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`,
    returnByValue: true,
  });
  if (coordEx) {
    throw new Error(`JS error: ${coordEx.exception?.description ?? coordEx.text}`);
  }
  if (!coordResult.value) throw new Error(`Button not found: ${buttonSelector}`);
  const { x, y } = coordResult.value as { x: number; y: number };
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

  // Poll for a visible/active file input to appear
  const start = Date.now();
  let foundSelector: string | null = null;
  while (Date.now() - start < timeoutMs) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  for (const el of inputs) {
    // Accept inputs that are visible or active (focused)
    const style = window.getComputedStyle(el);
    const notHidden = style.display !== 'none' && style.visibility !== 'hidden';
    if (notHidden || document.activeElement === el) {
      if (el.id) return '#' + el.id;
      const all = Array.from(document.querySelectorAll('input[type="file"]'));
      const idx = all.indexOf(el);
      return 'input[type="file"]:nth-of-type(' + (idx + 1) + ')';
    }
  }
  return null;
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
    if (result.value) {
      foundSelector = result.value as string;
      break;
    }
    await new Promise<void>(r => setTimeout(r, 100));
  }

  if (!foundSelector) {
    throw new Error(`No visible file input found within ${timeoutMs}ms after clicking: ${buttonSelector}`);
  }

  await setFilesOnInput(client, foundSelector, filePaths);
}

// ---------------------------------------------------------------------------
// getFileUploadInputs
// ---------------------------------------------------------------------------

/**
 * List all file input elements on the page.
 * Returns id, name, accept, multiple, and a class preview for each (max 20).
 */
export async function getFileUploadInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="file"]')).slice(0,20).map(el=>({id:el.id||null,name:el.name||null,accept:el.accept||null,multiple:el.multiple,class_preview:(el.className||'').slice(0,40)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getDropzoneElements
// ---------------------------------------------------------------------------

/**
 * Find dropzone upload area elements on the page (max 10).
 * Matches class patterns: dropzone, drop-zone, dz-, upload-area, drag-drop, or data-dropzone attribute.
 */
export async function getDropzoneElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="dropzone"],[class*="drop-zone"],[class*="dz-"],[data-dropzone],[class*="upload-area"],[class*="drag-drop"]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getDragDropAreas
// ---------------------------------------------------------------------------

/**
 * Find elements that have drag/drop event handlers or droppable class patterns (max 20).
 */
export async function getDragDropAreas(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=document.querySelectorAll('*');const res=[];for(const el of all){if(el.ondragover||el.ondrop||el.getAttribute('ondragover')||el.getAttribute('ondrop')||((el.className||'').toString().toLowerCase().includes('droppable')))res.push({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40)});if(res.length>=20)break;}return res })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getUploadProgress2
// ---------------------------------------------------------------------------

/**
 * Find upload progress indicator elements on the page (max 10).
 * Matches class patterns: upload-progress, dz-upload, file-progress, or <progress> with upload class.
 * Returns tag, id, class preview, value, and max for each element.
 */
export async function getUploadProgress2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="upload-progress"],[class*="dz-upload"],[class*="file-progress"],progress[class*="upload"]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),value:el.value||el.getAttribute('value')||null,max:el.max||el.getAttribute('max')||null})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getFilePreviewElements
// ---------------------------------------------------------------------------

/**
 * Find file preview/thumbnail elements on the page (max 20).
 * Matches class patterns: file-preview, upload-preview, dz-preview, file-thumb, attachment-preview.
 */
export async function getFilePreviewElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="file-preview"],[class*="upload-preview"],[class*="dz-preview"],[class*="file-thumb"],[class*="attachment-preview"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),src_preview:(el.src||el.querySelector('img')?.src||'').slice(0,80)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getUploadButtons
// ---------------------------------------------------------------------------

/**
 * Find upload/attach buttons on the page (max 20).
 * Matches buttons, links, labels, and role=button elements whose text or class indicates upload/attach.
 */
export async function getUploadButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const kw=['upload','attach','browse files','choose file','select file','add file'];return Array.from(document.querySelectorAll('button,a,label,[role="button"]')).filter(el=>{const t=(el.textContent||'').toLowerCase().trim();const c=(el.className||'').toString().toLowerCase();return kw.some(k=>t.includes(k))||c.includes('upload-btn')||c.includes('btn-upload')}).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getAcceptedFileTypes
// ---------------------------------------------------------------------------

/**
 * Read accepted file types from all file inputs that have an accept attribute (max 20).
 * Returns inputId, the raw accept string, and acceptedTypes as a parsed array.
 */
export async function getAcceptedFileTypes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="file"][accept]')).slice(0,20).map(el=>({inputId:el.id||null,accept:el.accept,acceptedTypes:el.accept.split(',').map(t=>t.trim())})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// ---------------------------------------------------------------------------
// getMultipleFileInputs
// ---------------------------------------------------------------------------

/**
 * Find file inputs that accept multiple files (max 10).
 * Returns id, name, and accept for each.
 */
export async function getMultipleFileInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="file"][multiple]')).slice(0,10).map(el=>({id:el.id||null,name:el.name||null,accept:el.accept||null})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
