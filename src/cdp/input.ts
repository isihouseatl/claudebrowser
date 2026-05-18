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

export async function pressKey(client: CdpClient, key: string): Promise<void> {
  await client.raw.Input.dispatchKeyEvent({ type: 'keyDown', key });
  await client.raw.Input.dispatchKeyEvent({ type: 'keyUp', key });
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
