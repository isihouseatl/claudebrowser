// src/cdp/clipboard2.ts
// Clipboard API-based clipboard utilities. These use navigator.clipboard directly
// (the async Clipboard API) and are distinct from the Input.dispatchKeyEvent-based
// helpers in clipboard.ts.
import { CdpClient } from './client';

// Read plain text from the clipboard via navigator.clipboard.readText().
export async function getClipboardText(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.clipboard.readText()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `getClipboardText failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as string) ?? '';
}

// Write text to the clipboard via navigator.clipboard.writeText().
export async function setClipboardText(client: CdpClient, text: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.clipboard.writeText(${JSON.stringify(text)})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `setClipboardText failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Read the HTML clipboard item via navigator.clipboard.read().
// Returns the text/html content as a string, or an empty string if the type is
// not present or the API is unavailable.
export async function getClipboardHtml(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') return '';
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            return await blob.text();
          }
        }
        return '';
      } catch (_e) {
        return '';
      }
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `getClipboardHtml failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as string) ?? '';
}

// Clear the clipboard by writing an empty string.
export async function clearClipboard(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.clipboard.writeText('')`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `clearClipboard failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Select the element matching selector and copy its textContent to the clipboard
// via navigator.clipboard.writeText().
export async function copyTextToClipboard(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      await navigator.clipboard.writeText(el.textContent ?? '');
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `copyTextToClipboard failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Paste text at the cursor position in the currently active element using
// document.execCommand('insertText', false, text).
export async function pasteTextAtCursor(client: CdpClient, text: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      document.execCommand('insertText', false, ${JSON.stringify(text)});
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `pasteTextAtCursor failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Return an array of MIME type strings available in the current clipboard contents
// via navigator.clipboard.read(). Returns an empty array if the API is unavailable
// or no items are present.
export async function getClipboardItemTypes(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') return [];
      try {
        const items = await navigator.clipboard.read();
        const types = [];
        for (const item of items) {
          for (const t of item.types) {
            if (!types.includes(t)) types.push(t);
          }
        }
        return types;
      } catch (_e) {
        return [];
      }
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `getClipboardItemTypes failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as string[]) ?? [];
}

// Copy the outerHTML of the element matching selector to the clipboard via
// navigator.clipboard.writeText().
export async function copyElementHtml(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      await navigator.clipboard.writeText(el.outerHTML);
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `copyElementHtml failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}
