// src/cdp/clipboard2.ts
// Clipboard API-based clipboard utilities (original) plus clipboard / selection /
// copy-paste inspection helpers (new).
//
// Naming notes:
//   getSelectionText2   — getSelectionText already exported from cdp/selection.ts
//   getContentEditable2 — getContentEditable already exported from cdp/clipboard3.ts
//   getAutocomplete3    — getAutocomplete2 already exported from cdp/search2.ts

import type { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Original clipboard2 exports (kept for server.ts compatibility)
// ---------------------------------------------------------------------------

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

// Select the element matching selector and copy its textContent to the clipboard.
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

// Paste text at the cursor position in the currently active element.
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

// Return an array of MIME type strings available in the current clipboard contents.
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

// Copy the outerHTML of the element matching selector to the clipboard.
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

// ---------------------------------------------------------------------------
// New inspection helpers
// ---------------------------------------------------------------------------

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify({ error: msg }) }] };
}

/**
 * getClipboardPermission — Clipboard read/write permission state.
 * Returns { clipboardRead, clipboardWrite, supported }
 */
export async function getClipboardPermission(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => {
      const [read, write] = await Promise.all([
        navigator.permissions.query({name:'clipboard-read'}).then(r=>r.state).catch(()=>'error'),
        navigator.permissions.query({name:'clipboard-write'}).then(r=>r.state).catch(()=>'error')
      ]);
      return {clipboardRead: read, clipboardWrite: write, supported: !!navigator.clipboard};
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getSelectionText2 — Current text selection on the page.
 * Returns { selectedText_preview, rangeCount, isCollapsed }
 */
export async function getSelectionText2(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = window.getSelection();
      if (!sel) return { selectedText_preview: '', rangeCount: 0, isCollapsed: true };
      var full = sel.toString();
      return {
        selectedText_preview: full.length > 80 ? full.slice(0, 80) + '...' : full,
        rangeCount: sel.rangeCount,
        isCollapsed: sel.isCollapsed
      };
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getCopyButtons — Elements with copy-related patterns.
 * Returns array of { tag, id, class_preview, text_preview, ariaLabel_preview } (max 20)
 */
export async function getCopyButtons(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var selectors = '[class*="copy"], [aria-label*="copy"], [aria-label*="Copy"], [data-copy], button[onclick*="copy"]';
      var els = Array.from(document.querySelectorAll(selectors)).slice(0, 20);
      return els.map(function(el) {
        var cls = (el.className || '');
        if (typeof cls !== 'string') cls = '';
        var txt = (el.textContent || '').trim();
        var lbl = el.getAttribute('aria-label') || '';
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls.length > 80 ? cls.slice(0, 80) + '...' : cls,
          text_preview: txt.length > 80 ? txt.slice(0, 80) + '...' : txt,
          ariaLabel_preview: lbl.length > 80 ? lbl.slice(0, 80) + '...' : lbl
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getUserSelectNone — Elements with user-select: none (text not selectable).
 * Returns array of { tag, id, class_preview } (max 20)
 */
export async function getUserSelectNone(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var results = [];
      for (var i = 0; i < all.length && results.length < 20; i++) {
        var el = all[i];
        var us = getComputedStyle(el).userSelect;
        if (us === 'none') {
          var cls = (el.className || '');
          if (typeof cls !== 'string') cls = '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls.length > 80 ? cls.slice(0, 80) + '...' : cls
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getContentEditable2 — Elements with contenteditable attribute.
 * Returns array of { tag, id, class_preview, text_preview, isTrue } (max 20)
 */
export async function getContentEditable2(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.from(document.querySelectorAll('[contenteditable]')).slice(0, 20);
      return els.map(function(el) {
        var cls = (el.className || '');
        if (typeof cls !== 'string') cls = '';
        var txt = (el.textContent || '').trim();
        var ceVal = el.getAttribute('contenteditable');
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls.length > 80 ? cls.slice(0, 80) + '...' : cls,
          text_preview: txt.length > 80 ? txt.slice(0, 80) + '...' : txt,
          isTrue: ceVal === 'true' || ceVal === ''
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getSpellcheck — Input/textarea/contenteditable elements with spellcheck attribute.
 * Returns array of { tag, id, name, spellcheck } (max 20)
 */
export async function getSpellcheck(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.from(document.querySelectorAll('input[spellcheck], textarea[spellcheck], [contenteditable][spellcheck]')).slice(0, 20);
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          name: el.getAttribute('name') || null,
          spellcheck: el.getAttribute('spellcheck')
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getAutocomplete3 — Input elements with autocomplete attribute.
 * Returns array of { id, name, type, autocomplete } (max 20)
 */
export async function getAutocomplete3(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.from(document.querySelectorAll('input[autocomplete], [autocomplete]')).slice(0, 20);
      return els.map(function(el) {
        return {
          id: el.id || null,
          name: el.getAttribute('name') || null,
          type: el.getAttribute('type') || null,
          autocomplete: el.getAttribute('autocomplete')
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

/**
 * getInputPatterns — Input elements with pattern attribute (regex validation).
 * Returns array of { id, name, type, pattern_preview, title_preview } (max 20)
 */
export async function getInputPatterns(
  cdp: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.from(document.querySelectorAll('input[pattern]')).slice(0, 20);
      return els.map(function(el) {
        var pat = el.getAttribute('pattern') || '';
        var ttl = el.getAttribute('title') || '';
        return {
          id: el.id || null,
          name: el.getAttribute('name') || null,
          type: el.getAttribute('type') || null,
          pattern_preview: pat.length > 80 ? pat.slice(0, 80) + '...' : pat,
          title_preview: ttl.length > 80 ? ttl.slice(0, 80) + '...' : ttl
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}
