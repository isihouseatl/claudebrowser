// src/cdp/input2.ts
// Advanced input interaction utilities: delayed typing, key combos, label-based
// filling, checkbox/radio control, and contenteditable typing.
// These are distinct from input.ts (typeText, setValue, pressKey, etc.) — they
// handle delays, simultaneous key combos, label-associated inputs, and
// contenteditable elements.
import { CdpClient } from './client';

// Map of key names to their key codes and text representations for
// Input.dispatchKeyEvent. Covers printable ASCII + common control keys.
const KEY_CODE_MAP: Record<string, { keyCode: number; code: string }> = {
  ' ': { keyCode: 32, code: 'Space' },
  Enter: { keyCode: 13, code: 'Enter' },
  Tab: { keyCode: 9, code: 'Tab' },
  Backspace: { keyCode: 8, code: 'Backspace' },
  Delete: { keyCode: 46, code: 'Delete' },
  Escape: { keyCode: 27, code: 'Escape' },
  ArrowLeft: { keyCode: 37, code: 'ArrowLeft' },
  ArrowRight: { keyCode: 39, code: 'ArrowRight' },
  ArrowUp: { keyCode: 38, code: 'ArrowUp' },
  ArrowDown: { keyCode: 40, code: 'ArrowDown' },
  Home: { keyCode: 36, code: 'Home' },
  End: { keyCode: 35, code: 'End' },
  PageUp: { keyCode: 33, code: 'PageUp' },
  PageDown: { keyCode: 34, code: 'PageDown' },
  Control: { keyCode: 17, code: 'ControlLeft' },
  Shift: { keyCode: 16, code: 'ShiftLeft' },
  Alt: { keyCode: 18, code: 'AltLeft' },
  Meta: { keyCode: 91, code: 'MetaLeft' },
  a: { keyCode: 65, code: 'KeyA' },
  A: { keyCode: 65, code: 'KeyA' },
  c: { keyCode: 67, code: 'KeyC' },
  C: { keyCode: 67, code: 'KeyC' },
  v: { keyCode: 86, code: 'KeyV' },
  V: { keyCode: 86, code: 'KeyV' },
  x: { keyCode: 88, code: 'KeyX' },
  X: { keyCode: 88, code: 'KeyX' },
  z: { keyCode: 90, code: 'KeyZ' },
  Z: { keyCode: 90, code: 'KeyZ' },
};

const MODIFIER_KEY_BITS: Record<string, number> = {
  Control: 2,
  Shift: 8,
  Alt: 1,
  Meta: 4,
};

// Resolve the modifier bitmask for a set of simultaneously held keys.
function modifierBitsFor(keys: string[]): number {
  return keys.reduce((bits, k) => bits | (MODIFIER_KEY_BITS[k] ?? 0), 0);
}

// Resolve the keyCode for a single key name. For single printable characters
// not in KEY_CODE_MAP, derive the keyCode from charCodeAt.
function keyCodeFor(key: string): number {
  if (KEY_CODE_MAP[key]) return KEY_CODE_MAP[key].keyCode;
  if (key.length === 1) return key.toUpperCase().charCodeAt(0);
  return 0;
}

// Resolve the code string for a single key name.
function codeFor(key: string): string {
  if (KEY_CODE_MAP[key]) return KEY_CODE_MAP[key].code;
  if (key.length === 1) return 'Key' + key.toUpperCase();
  return key;
}

// Determine whether a key is printable (produces a character) for use as
// the text field in Input.dispatchKeyEvent.
function textFor(key: string): string {
  if (key.length === 1) return key;
  if (key === 'Enter') return '\r';
  if (key === ' ') return ' ';
  return '';
}

// 1. Type each character in `text` with a `delayMs` pause between keystrokes.
//    Uses Input.dispatchKeyEvent keyDown + keyUp per character, matching the
//    pattern from input.ts typeText but adding the configurable delay.
export async function typeWithDelay(
  client: CdpClient,
  text: string,
  delayMs: number,
): Promise<void> {
  for (const char of text) {
    const keyCode = keyCodeFor(char);
    const code = codeFor(char);
    await (client.raw.Input as any).dispatchKeyEvent({
      type: 'keyDown',
      key: char,
      text: char,
      unmodifiedText: char,
      keyCode,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await (client.raw.Input as any).dispatchKeyEvent({
      type: 'keyUp',
      key: char,
      text: char,
      unmodifiedText: char,
      keyCode,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    if (delayMs > 0) {
      await new Promise<void>((r) => setTimeout(r, delayMs));
    }
  }
}

// 2. Select all text in the element identified by `selector`, then type the
//    replacement `text`. Focuses the element via Runtime.evaluate, dispatches
//    Ctrl+A to select-all, then calls typeWithDelay with 0ms delay.
export async function clearAndType(
  client: CdpClient,
  selector: string,
  text: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.focus();
    return true;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `clearAndType focus failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  if (!result.value) throw new Error(`Element not found: ${selector}`);

  // Ctrl+A — select all
  await (client.raw.Input as any).dispatchKeyEvent({
    type: 'keyDown',
    key: 'a',
    code: 'KeyA',
    keyCode: 65,
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 2, // Ctrl
  });
  await (client.raw.Input as any).dispatchKeyEvent({
    type: 'keyUp',
    key: 'a',
    code: 'KeyA',
    keyCode: 65,
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 2,
  });

  // Type the replacement text at full speed
  await typeWithDelay(client, text, 0);
}

// 3. Press multiple keys simultaneously (e.g. ['Control', 'a'] for select-all,
//    ['Control', 'Shift', 'z'] for redo). Dispatches keyDown for each key in
//    order (building up the modifier mask), then keyUp in reverse order.
export async function pressKeyCombo(
  client: CdpClient,
  keys: string[],
): Promise<void> {
  if (keys.length === 0) return;

  // keyDown phase — accumulate modifiers as each key is pressed
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // The modifier bits reflect all modifier keys held so far (including this one)
    const heldModifiers = modifierBitsFor(keys.slice(0, i + 1));
    const keyCode = keyCodeFor(key);
    const code = codeFor(key);
    await (client.raw.Input as any).dispatchKeyEvent({
      type: 'keyDown',
      key,
      text: textFor(key),
      code,
      keyCode,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
      modifiers: heldModifiers,
    });
  }

  // keyUp phase — release in reverse order, unwinding modifier bits
  for (let i = keys.length - 1; i >= 0; i--) {
    const key = keys[i];
    // When releasing this key, it is no longer contributing its modifier bit
    const heldModifiers = modifierBitsFor(keys.slice(0, i));
    const keyCode = keyCodeFor(key);
    const code = codeFor(key);
    await (client.raw.Input as any).dispatchKeyEvent({
      type: 'keyUp',
      key,
      text: textFor(key),
      code,
      keyCode,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
      modifiers: heldModifiers,
    });
  }
}

// 4. Find the input/textarea associated with a <label> whose text content
//    matches `labelText` (case-insensitive trim), then set its value using the
//    native value setter + input/change event dispatch (React/Vue safe).
//    Searches both for- attribute association and parent-wrapping association.
export async function fillInputByLabel(
  client: CdpClient,
  labelText: string,
  value: string,
): Promise<void> {
  const expression = `(() => {
    const needle = ${JSON.stringify(labelText)}.trim().toLowerCase();
    let input = null;

    // Strategy 1: <label for="id"> association
    for (const label of document.querySelectorAll('label')) {
      if (label.textContent.trim().toLowerCase() === needle) {
        if (label.htmlFor) {
          input = document.getElementById(label.htmlFor);
          if (input) break;
        }
        // Strategy 2: label wraps the input as a descendant
        const child = label.querySelector('input, textarea, select');
        if (child) { input = child; break; }
      }
    }

    if (!input) return { ok: false, reason: 'label not found or no associated input' };

    const tag = input.tagName;
    let setter = null;
    if (tag === 'INPUT') {
      setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    } else if (tag === 'TEXTAREA') {
      setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    }
    if (setter) {
      setter.call(input, ${JSON.stringify(value)});
    } else {
      input.value = ${JSON.stringify(value)};
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, reason: null };
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `fillInputByLabel failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  const res = result.value as { ok: boolean; reason: string | null };
  if (!res.ok) throw new Error(`fillInputByLabel: ${res.reason} (label: ${JSON.stringify(labelText)})`);
}

// 5. Check a checkbox if it is currently unchecked. Clicks it only when
//    element.checked is false — avoids toggling an already-checked box.
export async function checkCheckbox(
  client: CdpClient,
  selector: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { ok: false, reason: 'not found' };
    if (el.checked) return { ok: true, reason: 'already checked' };
    const r = el.getBoundingClientRect();
    return { ok: true, reason: null, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `checkCheckbox failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  const res = result.value as { ok: boolean; reason: string | null; x?: number; y?: number };
  if (!res.ok) throw new Error(`checkCheckbox: ${res.reason} (selector: ${JSON.stringify(selector)})`);
  if (res.reason === 'already checked') return;

  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mousePressed', x: res.x!, y: res.y!, button: 'left', clickCount: 1 });
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseReleased', x: res.x!, y: res.y!, button: 'left', clickCount: 1 });
}

// 6. Uncheck a checkbox if it is currently checked. Clicks it only when
//    element.checked is true — avoids toggling an already-unchecked box.
export async function uncheckCheckbox(
  client: CdpClient,
  selector: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { ok: false, reason: 'not found' };
    if (!el.checked) return { ok: true, reason: 'already unchecked' };
    const r = el.getBoundingClientRect();
    return { ok: true, reason: null, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `uncheckCheckbox failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  const res = result.value as { ok: boolean; reason: string | null; x?: number; y?: number };
  if (!res.ok) throw new Error(`uncheckCheckbox: ${res.reason} (selector: ${JSON.stringify(selector)})`);
  if (res.reason === 'already unchecked') return;

  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mousePressed', x: res.x!, y: res.y!, button: 'left', clickCount: 1 });
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseReleased', x: res.x!, y: res.y!, button: 'left', clickCount: 1 });
}

// 7. Click a radio button to select it. Does not check current state — radio
//    buttons are idempotent when clicked (re-selecting the selected option is
//    harmless), so we always dispatch the click.
export async function selectRadio(
  client: CdpClient,
  selector: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `selectRadio failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  if (!result.value) throw new Error(`selectRadio: element not found (selector: ${JSON.stringify(selector)})`);

  const { x, y } = result.value as { x: number; y: number };
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

// 8. Focus a contenteditable element and type `text` into it using
//    document.execCommand('insertText'). This is the correct approach for
//    richtext editors (Draft.js, Quill, ProseMirror-lite, etc.) that listen
//    to execCommand rather than input events.
//    NOTE: execCommand is deprecated in the spec but remains functional in
//    Chrome's content-editable implementation and is the only reliable way to
//    trigger synthetic input in many frameworks. See input.ts typeText for the
//    alternative key-event approach.
export async function typeIntoContentEditable(
  client: CdpClient,
  selector: string,
  text: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { ok: false, reason: 'not found' };
    if (!el.isContentEditable) return { ok: false, reason: 'element is not contenteditable' };
    el.focus();
    // Place cursor at end of existing content
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const inserted = document.execCommand('insertText', false, ${JSON.stringify(text)});
    return { ok: true, inserted };
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(
    `typeIntoContentEditable failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
  );
  const res = result.value as { ok: boolean; reason?: string; inserted?: boolean };
  if (!res.ok) throw new Error(`typeIntoContentEditable: ${res.reason} (selector: ${JSON.stringify(selector)})`);
}
