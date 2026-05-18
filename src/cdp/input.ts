// src/cdp/input.ts
import { CdpClient } from './client';

export async function clickAt(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

export async function clickSelector(client: CdpClient, selector: string): Promise<void> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true,
  });
  if (!result.value) throw new Error(`Element not found: ${selector}`);
  const { x, y } = result.value as { x: number; y: number };
  await clickAt(client, x, y);
}

export async function typeText(client: CdpClient, text: string): Promise<void> {
  for (const char of text) {
    await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', text: char });
    await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', text: char });
  }
}

const MODIFIER_BITS: Record<string, number> = {
  alt: 1,
  ctrl: 2,
  control: 2,
  meta: 4,
  shift: 8,
};

function resolveModifiers(modifiers?: string[]): number {
  if (!modifiers || modifiers.length === 0) return 0;
  return modifiers.reduce((bits, name) => bits | (MODIFIER_BITS[name.toLowerCase()] ?? 0), 0);
}

export async function pressKey(
  client: CdpClient,
  key: string,
  modifiers?: string[],
): Promise<void> {
  const modifierBits = resolveModifiers(modifiers);
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key, modifiers: modifierBits });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key, modifiers: modifierBits });
}

export async function keyChord(
  client: CdpClient,
  modifiers: string[],
  key: string,
): Promise<void> {
  const modifierBits = resolveModifiers(modifiers);
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key, modifiers: modifierBits });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key, modifiers: modifierBits });
}

export async function selectOption(client: CdpClient, selector: string, value: string): Promise<void> {
  await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found');
      el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()`,
  });
}

// React/Vue safe: native value setter + synthetic events
export async function setValue(client: CdpClient, selector: string, value: string): Promise<void> {
  await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        ?? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(el, ${JSON.stringify(value)});
      else el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()`,
  });
}

export async function hoverAt(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
}

export async function hoverSelector(client: CdpClient, selector: string): Promise<void> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true,
  });
  if (!result.value) throw new Error(`Element not found: ${selector}`);
  const { x, y } = result.value as { x: number; y: number };
  await hoverAt(client, x, y);
}

export async function handleDialog(client: CdpClient, accept: boolean, promptText?: string): Promise<void> {
  await client.raw.Page.handleJavaScriptDialog({ accept, promptText });
}

export async function uploadFile(client: CdpClient, selector: string, filePaths: string[]): Promise<void> {
  const { root } = await client.raw.DOM.getDocument({ depth: 0 });
  const { nodeId } = await client.raw.DOM.querySelector({ nodeId: root.nodeId, selector });
  if (!nodeId) throw new Error(`File input not found: ${selector}`);
  await client.raw.DOM.setFileInputFiles({ nodeId, files: filePaths });
}

export async function doubleClickAt(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 2 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 2 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 2 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 2 });
}

export async function clearInput(client: CdpClient, selector: string): Promise<void> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true,
  });
  if (!result.value) throw new Error(`Element not found: ${selector}`);
  const { x, y } = result.value as { x: number; y: number };
  await clickAt(client, x, y);
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key: 'a', modifiers: 2 }); // modifier 2 = Ctrl
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key: 'a', modifiers: 2 });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key: 'Backspace' });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Backspace' });
}

export async function rightClickAt(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'right', clickCount: 1 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'right', clickCount: 1 });
}

export async function dragAndDrop(
  client: CdpClient,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 10,
): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    await client.raw.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  }
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x: endX, y: endY, button: 'left', buttons: 0, clickCount: 1 });
}

export async function focusElement(client: CdpClient, selector: string): Promise<void> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.focus();
      return true;
    })()`,
    returnByValue: true,
  });
  if (!result.value) throw new Error(`Element not found: ${selector}`);
}

export async function blurActiveElement(client: CdpClient): Promise<void> {
  await client.raw.Runtime.evaluate({
    expression: `document.activeElement?.blur()`,
  });
}

export interface FormValues {
  [fieldName: string]: string | boolean | string[];
}

export async function getFormValues(
  client: CdpClient,
  formSelector: string,
): Promise<FormValues> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const form = document.querySelector(${JSON.stringify(formSelector)});
      if (!form) return null;
      const values = {};
      for (const el of form.elements) {
        if (!el.name) continue;
        if (el.type === 'checkbox') {
          values[el.name] = el.checked;
        } else if (el.tagName === 'SELECT' && el.multiple) {
          values[el.name] = Array.from(el.selectedOptions).map(o => o.value);
        } else {
          values[el.name] = el.value;
        }
      }
      return values;
    })()`,
    returnByValue: true,
  });
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as FormValues;
}
