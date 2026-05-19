// src/cdp/keyboard2.ts
import type { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * Dispatch Enter keydown+keyup on document.
 */
export async function pressEnter(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      document.activeElement
        ? document.activeElement.dispatchEvent(new KeyboardEvent('keydown', opts))
        : document.dispatchEvent(new KeyboardEvent('keydown', opts));
      document.activeElement
        ? document.activeElement.dispatchEvent(new KeyboardEvent('keyup', opts))
        : document.dispatchEvent(new KeyboardEvent('keyup', opts));
      return 'Enter dispatched';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in pressEnter');
  return ok(result.value ?? 'Enter dispatched');
}

/**
 * Dispatch Tab keydown+keyup on document.
 */
export async function pressTab(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var opts = { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent('keydown', opts));
      document.dispatchEvent(new KeyboardEvent('keyup', opts));
      return 'Tab dispatched';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in pressTab');
  return ok(result.value ?? 'Tab dispatched');
}

/**
 * Dispatch Escape keydown+keyup on document.
 */
export async function pressEscape(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var opts = { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent('keydown', opts));
      document.dispatchEvent(new KeyboardEvent('keyup', opts));
      return 'Escape dispatched';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in pressEscape');
  return ok(result.value ?? 'Escape dispatched');
}

/**
 * Dispatch ArrowDown keydown+keyup on document.
 */
export async function pressArrowDown(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var opts = { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent('keydown', opts));
      document.dispatchEvent(new KeyboardEvent('keyup', opts));
      return 'ArrowDown dispatched';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in pressArrowDown');
  return ok(result.value ?? 'ArrowDown dispatched');
}

/**
 * Dispatch ArrowUp keydown+keyup on document.
 */
export async function pressArrowUp(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var opts = { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent('keydown', opts));
      document.dispatchEvent(new KeyboardEvent('keyup', opts));
      return 'ArrowUp dispatched';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in pressArrowUp');
  return ok(result.value ?? 'ArrowUp dispatched');
}

/**
 * Dispatch keydown+keypress+input+keyup for each character in text to the focused element.
 * NOTE: exported as typeText2 to avoid conflict with typeText in cdp/input.ts.
 */
export async function typeText2(client: CdpClient, text: string): Promise<ToolResult> {
  const textLiteral = JSON.stringify(text);
  const expression = `
    (function() {
      var el = document.activeElement;
      if (!el) return JSON.stringify({ error: 'No focused element' });
      var chars = ${textLiteral}.split('');
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var downOpts = { key: ch, code: 'Key' + ch.toUpperCase(), keyCode: ch.charCodeAt(0), which: ch.charCodeAt(0), bubbles: true, cancelable: true };
        el.dispatchEvent(new KeyboardEvent('keydown', downOpts));
        el.dispatchEvent(new KeyboardEvent('keypress', downOpts));
        if ('value' in el) {
          el.value = el.value + ch;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.dispatchEvent(new InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }));
        }
        el.dispatchEvent(new KeyboardEvent('keyup', downOpts));
      }
      return 'Typed ' + chars.length + ' character(s)';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in typeText2');
  if (typeof result.value === 'string' && result.value.startsWith('{"error"')) {
    return err(JSON.parse(result.value).error);
  }
  return ok(result.value ?? 'Typed');
}

/**
 * Get the currently focused element: tag, id, class, type, name.
 */
export async function getActiveElement(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var el = document.activeElement;
      if (!el) return JSON.stringify({ error: 'No active element' });
      return JSON.stringify({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: el.className || null,
        type: el.getAttribute('type') || null,
        name: el.getAttribute('name') || null
      });
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in getActiveElement');
  const val = result.value;
  if (typeof val !== 'string') return err('Unexpected result type');
  return ok(JSON.parse(val));
}

/**
 * Walk from document.activeElement up to body, return array of ancestor tags (breadcrumb path).
 */
export async function getFocusPath(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (function() {
      var el = document.activeElement;
      if (!el) return JSON.stringify({ error: 'No active element' });
      var path = [];
      var current = el;
      while (current && current !== document.body.parentElement) {
        var label = current.tagName.toLowerCase();
        if (current.id) label += '#' + current.id;
        else if (current.className && typeof current.className === 'string' && current.className.trim()) {
          label += '.' + current.className.trim().split(/\\s+/).join('.');
        }
        path.push(label);
        current = current.parentElement;
      }
      return JSON.stringify(path);
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text ?? 'Runtime exception in getFocusPath');
  const val = result.value;
  if (typeof val !== 'string') return err('Unexpected result type');
  return ok(JSON.parse(val));
}
