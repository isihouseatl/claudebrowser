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
