// src/cdp/clipboard2.ts
import { CdpClient } from './client';

// Read text from clipboard. Tries navigator.clipboard.readText() first (async Clipboard API),
// falls back to document.execCommand('paste') via a temporary textarea when the API is
// unavailable or the clipboard-read permission has not been granted.
export async function readClipboard(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        try {
          return await navigator.clipboard.readText();
        } catch (_e) {
          // fall through to execCommand fallback
        }
      }
      const ta = document.createElement('textarea');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.top = '0';
      ta.style.left = '0';
      document.body.appendChild(ta);
      ta.focus();
      const ok = document.execCommand('paste');
      const value = ok ? ta.value : '';
      document.body.removeChild(ta);
      return value;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `readClipboard failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as string) ?? '';
}

// Write text to clipboard using navigator.clipboard.writeText().
export async function writeClipboard(client: CdpClient, text: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.clipboard.writeText(${JSON.stringify(text)})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `writeClipboard failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Clear the clipboard by writing an empty string.
export async function clearClipboard(client: CdpClient): Promise<void> {
  await writeClipboard(client, '');
}

// Read the clipboard as HTML using the async Clipboard API (navigator.clipboard.read()).
// Returns an empty string if the text/html type is not present or the API is unavailable.
export async function readClipboardHtml(client: CdpClient): Promise<string> {
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
      `readClipboardHtml failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as string) ?? '';
}

// Write HTML to the clipboard using navigator.clipboard.write() with a ClipboardItem.
// Also writes a plain-text version derived from the HTML (via DOMParser) so paste targets
// that only accept text/plain still receive something sensible.
export async function writeClipboardHtml(client: CdpClient, html: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      const html = ${JSON.stringify(html)};
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const plain = parsed.body.textContent ?? '';
      const textBlob = new Blob([plain], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
      ]);
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `writeClipboardHtml failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Focus the element matching selector, select all its text content, execute
// document.execCommand('copy') to push it to the clipboard, then read the
// clipboard and return the copied string.
export async function copyFromElement(client: CdpClient, selector: string): Promise<string> {
  const { result: focusResult, exceptionDetails: focusEx } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      el.focus();
      if (typeof el.select === 'function') {
        el.select();
      } else {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
      }
      return document.execCommand('copy');
    })()`,
    returnByValue: true,
  });
  if (focusEx) {
    throw new Error(
      `copyFromElement (select+copy) failed: ${focusEx.exception?.description ?? focusEx.text}`,
    );
  }
  if (!focusResult.value) {
    throw new Error(`copyFromElement: execCommand('copy') returned false for selector ${selector}`);
  }
  return readClipboard(client);
}

// Focus the element matching selector, write text to the clipboard, then dispatch
// a synthetic paste event so the element receives the pasted content.
export async function pasteIntoElement(
  client: CdpClient,
  selector: string,
  text: string,
): Promise<void> {
  await writeClipboard(client, text);

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      el.focus();
      const dt = new DataTransfer();
      dt.setData('text/plain', ${JSON.stringify(text)});
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      });
      el.dispatchEvent(pasteEvent);
      if (!pasteEvent.defaultPrevented) {
        if (typeof el.setRangeText === 'function') {
          el.setRangeText(${JSON.stringify(text)}, el.selectionStart ?? 0, el.selectionEnd ?? 0, 'end');
        } else if ('value' in el) {
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          el.value = el.value.slice(0, start) + ${JSON.stringify(text)} + el.value.slice(end);
        } else {
          document.execCommand('insertText', false, ${JSON.stringify(text)});
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `pasteIntoElement failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Return the number of entries in window.__cbClipHistory if that array exists,
// or 0 if it is absent.
export async function getClipboardHistoryLength(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(window.__cbClipHistory?.length ?? 0)`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `getClipboardHistoryLength failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return (result.value as number) ?? 0;
}
