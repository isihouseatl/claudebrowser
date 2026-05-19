// src/cdp/clipboard.ts
import type { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * 1. Read clipboard text via navigator.clipboard.readText().
 * Returns the clipboard text, or an error if permission is denied or API unavailable.
 */
export async function getClipboardText(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: '(async () => { return await navigator.clipboard.readText(); })()',
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception reading clipboard');
  }
  return ok(result.value as string ?? '');
}

/**
 * 2. Write text to clipboard via navigator.clipboard.writeText().
 * Returns a success message or an error.
 */
export async function writeClipboardText(client: CdpClient, text: string): Promise<ToolResult> {
  const escaped = JSON.stringify(text);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => { await navigator.clipboard.writeText(${escaped}); return 'ok'; })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception writing clipboard');
  }
  return ok('Clipboard written successfully');
}

/**
 * 3. Get currently selected text via window.getSelection().toString().
 */
export async function getSelectedText(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: '(function() { return window.getSelection().toString(); })()',
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception getting selected text');
  }
  return ok(result.value as string ?? '');
}

/**
 * 4. Get selection range info: startOffset, endOffset, collapsed, commonAncestor tag.
 */
export async function getSelectionRange(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return { rangeCount: 0, collapsed: true, startOffset: 0, endOffset: 0, commonAncestor: null };
      }
      var range = sel.getRangeAt(0);
      var ancestor = range.commonAncestorContainer;
      var tag = ancestor.nodeType === 1
        ? ancestor.nodeName
        : (ancestor.parentElement ? ancestor.parentElement.nodeName : null);
      return {
        rangeCount: sel.rangeCount,
        collapsed: range.collapsed,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        commonAncestor: tag
      };
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception getting selection range');
  }
  return ok(result.value);
}

/**
 * 5. Select all text in an input or textarea matching the given CSS selector via el.select().
 */
export async function selectAllText(client: CdpClient, selector: string): Promise<ToolResult> {
  const escaped = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${escaped});
      if (!el) return 'element not found';
      if (typeof el.select === 'function') {
        el.select();
        return 'selected';
      }
      return 'element does not support select()';
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception selecting text');
  }
  return ok(result.value as string);
}

/**
 * 6. Clear current text selection via window.getSelection().removeAllRanges().
 */
export async function clearSelection(client: CdpClient): Promise<ToolResult> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: '(function() { window.getSelection().removeAllRanges(); return "cleared"; })()',
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception clearing selection');
  }
  return ok('Selection cleared');
}

/**
 * 7. Check if navigator.clipboard API is available in the current page context.
 */
export async function isClipboardSupported(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: '(function() { return typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined"; })()',
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception checking clipboard support');
  }
  return ok({ supported: result.value as boolean });
}

/**
 * 8. Select and copy the text content of an element matching the given CSS selector to clipboard.
 * Writes the element's textContent to the clipboard via navigator.clipboard.writeText().
 */
export async function copyElementText(client: CdpClient, selector: string): Promise<ToolResult> {
  const escaped = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(async () => {
      var el = document.querySelector(${escaped});
      if (!el) return JSON.stringify({ error: 'element not found' });
      var text = el.textContent || '';
      await navigator.clipboard.writeText(text);
      return text;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.text ?? 'Exception copying element text');
  }
  const val = result.value as string;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        return err(parsed.error);
      }
    } catch {
      // not JSON — it's the actual text content, fall through
    }
  }
  return ok(val);
}
