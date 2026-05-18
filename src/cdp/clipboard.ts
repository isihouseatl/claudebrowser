// src/cdp/clipboard.ts
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// 1. Read text from clipboard via navigator.clipboard.readText()
export async function readClipboardText(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: '(function() { return navigator.clipboard.readText(); })()',
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'clipboard read failed');
    }
    if (result.value === null || result.value === undefined) {
      return err('clipboard returned null or undefined');
    }
    return ok(JSON.stringify({ text: result.value }));
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. Write text to clipboard via navigator.clipboard.writeText()
export async function writeClipboardText(
  client: CdpClient,
  text: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const escaped = JSON.stringify(text);
    const expression = `(function() { return navigator.clipboard.writeText(${escaped}); })()`;
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'clipboard write failed');
    }
    return ok('Written');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. Select element text and copy to clipboard using document.execCommand('copy')
export async function copyElementText(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const sel = JSON.stringify(selector);
    const expression = `(function() {
      var el = document.querySelector(${sel});
      if (!el) { return 'NOT_FOUND'; }
      var range = document.createRange();
      range.selectNodeContents(el);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      var success = document.execCommand('copy');
      return success ? 'ok' : 'execCommand_failed';
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'copy failed');
    }
    if (result.value === null || result.value === undefined) {
      return err('no result from copy');
    }
    if (result.value === 'NOT_FOUND') {
      return err(`element not found: ${selector}`);
    }
    if (result.value === 'execCommand_failed') {
      return err('execCommand copy failed');
    }
    return ok('Copied');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. Get currently selected text
export async function getSelectionText(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
      var text = window.getSelection().toString();
      return JSON.stringify({ text: text, length: text.length });
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'getSelection failed');
    }
    if (result.value === null || result.value === undefined) {
      return err('no selection result');
    }
    return ok(result.value as string);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. Select all text in an input/textarea using .select(), or Selection.selectAllChildren() for other elements
export async function selectAllText(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const sel = JSON.stringify(selector);
    const expression = `(function() {
      var el = document.querySelector(${sel});
      if (!el) { return 'NOT_FOUND'; }
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') {
        el.focus();
        el.select();
      } else {
        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        range.selectNodeContents(el);
        selection.addRange(range);
      }
      return 'ok';
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'selectAll failed');
    }
    if (result.value === 'NOT_FOUND') {
      return err(`element not found: ${selector}`);
    }
    return ok('Selected');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. Clear any text selection
export async function clearSelection(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
      window.getSelection().removeAllRanges();
      return 'ok';
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'clearSelection failed');
    }
    if (result.value === null || result.value === undefined) {
      return err('no result');
    }
    return ok('Cleared');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. Check if navigator.clipboard is available and permissions allow clipboard-read
export async function hasClipboardAccess(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `(function() {
      if (!navigator.clipboard) {
        return Promise.resolve(JSON.stringify({ available: false, state: 'unavailable' }));
      }
      return navigator.permissions.query({ name: 'clipboard-read' }).then(function(result) {
        return JSON.stringify({ available: true, state: result.state });
      }).catch(function() {
        return JSON.stringify({ available: true, state: 'unknown' });
      });
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'permissions check failed');
    }
    if (result.value === null || result.value === undefined) {
      return err('no result from permissions query');
    }
    return ok(result.value as string);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. Focus element, move cursor to end, set value and dispatch input/change events (paste-like)
export async function pasteAtCursor(
  client: CdpClient,
  selector: string,
  text: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const sel = JSON.stringify(selector);
    const escaped = JSON.stringify(text);
    const expression = `(function() {
      var el = document.querySelector(${sel});
      if (!el) { return 'NOT_FOUND'; }
      el.focus();
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') {
        var start = el.selectionStart;
        var end = el.selectionEnd;
        var current = el.value;
        var before = current.substring(0, start);
        var after = current.substring(end);
        el.value = before + ${escaped} + after;
        var newPos = before.length + ${escaped}.length;
        el.selectionStart = newPos;
        el.selectionEnd = newPos;
      } else {
        el.textContent = el.textContent + ${escaped};
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    })()`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'paste failed');
    }
    if (result.value === 'NOT_FOUND') {
      return err(`element not found: ${selector}`);
    }
    return ok('Pasted');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
