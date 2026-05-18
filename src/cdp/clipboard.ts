// src/cdp/clipboard.ts
import { CdpClient } from './client';

// Write text to the clipboard.
// Uses navigator.clipboard.writeText() — requires the page to have focus.
// If that fails (e.g. no permissions), falls back to document.execCommand('copy')
// via a temporary textarea.
export async function setClipboard(client: CdpClient, text: string): Promise<void> {
  const escaped = JSON.stringify(text);
  const expression = `
    navigator.clipboard
      ? navigator.clipboard.writeText(${escaped})
      : (() => {
          const ta = document.createElement('textarea');
          ta.value = ${escaped};
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        })()
  `;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `Clipboard write failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Read text from the clipboard.
// Uses navigator.clipboard.readText() — requires clipboard-read permission.
// Throws if permission denied.
export async function getClipboard(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'navigator.clipboard.readText()',
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `Clipboard read failed (needs clipboard-read permission): ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as string;
}
