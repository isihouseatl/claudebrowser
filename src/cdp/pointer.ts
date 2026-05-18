// src/cdp/pointer.ts
import { CdpClient } from './client';

// Module-level tracking of last known mouse position.
let _lastX = 0;
let _lastY = 0;

function trackPosition(x: number, y: number): void {
  _lastX = x;
  _lastY = y;
}

/**
 * Move the mouse through a series of points with a small delay between each.
 * Only dispatches mouseMoved events; does not click.
 * @param delayMs Milliseconds between each point (default 16ms ≈ 60fps)
 */
export async function mousePath(
  client: CdpClient,
  points: Array<{ x: number; y: number }>,
  delayMs: number = 16,
): Promise<void> {
  for (const { x, y } of points) {
    await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseMoved', x, y });
    trackPosition(x, y);
    await new Promise(r => setTimeout(r, delayMs));
  }
}

/**
 * Drag from one point to another in a smooth straight line.
 * Sequence: mousePressed at from → N mouseMoved steps → mouseReleased at to.
 * @param steps Number of intermediate move steps (default 20)
 */
export async function smoothDrag(
  client: CdpClient,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  steps: number = 20,
): Promise<void> {
  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mousePressed',
    x: fromX,
    y: fromY,
    button: 'left',
    buttons: 1,
    clickCount: 1,
  });
  trackPosition(fromX, fromY);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    await (client.raw.Input as any).dispatchMouseEvent({
      type: 'mouseMoved',
      x,
      y,
      button: 'left',
      buttons: 1,
    });
    trackPosition(x, y);
  }

  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mouseReleased',
    x: toX,
    y: toY,
    button: 'left',
    buttons: 0,
    clickCount: 1,
  });
  trackPosition(toX, toY);
}

/**
 * Drag from the center of sourceSelector to the center of targetSelector.
 * Uses getBoundingClientRect via Runtime.evaluate to locate both elements.
 */
export async function dragSelector(
  client: CdpClient,
  sourceSelector: string,
  targetSelector: string,
): Promise<void> {
  const { result: srcResult } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(sourceSelector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true,
  });
  if (!srcResult.value) throw new Error(`Source element not found: ${sourceSelector}`);

  const { result: tgtResult } = await client.raw.Runtime.evaluate({
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(targetSelector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true,
  });
  if (!tgtResult.value) throw new Error(`Target element not found: ${targetSelector}`);

  const src = srcResult.value as { x: number; y: number };
  const tgt = tgtResult.value as { x: number; y: number };

  await smoothDrag(client, src.x, src.y, tgt.x, tgt.y);
}

/**
 * Hover over each selector in sequence with delayMs between each hover.
 * Moves the mouse to the element center, waits delayMs, then moves to the next.
 * @param delayMs Milliseconds to wait after hovering each element (default 300ms)
 */
export async function hoverSequence(
  client: CdpClient,
  selectors: string[],
  delayMs: number = 300,
): Promise<void> {
  for (const selector of selectors) {
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

    await (client.raw.Input as any).dispatchMouseEvent({ type: 'mouseMoved', x, y });
    trackPosition(x, y);
    await new Promise(r => setTimeout(r, delayMs));
  }
}

/**
 * Dispatch `count` clicks at (x, y) with delayMs between each.
 * Each click = mousePressed + mouseReleased.
 * @param delayMs Milliseconds between clicks (default 100ms)
 */
export async function multiClick(
  client: CdpClient,
  x: number,
  y: number,
  count: number,
  delayMs: number = 100,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await (client.raw.Input as any).dispatchMouseEvent({
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await (client.raw.Input as any).dispatchMouseEvent({
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    trackPosition(x, y);
    if (i < count - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

/**
 * Right-click (context menu click) at (x, y).
 * Named contextClickAt to avoid conflict with rightClickAt in input.ts.
 */
export async function contextClickAt(
  client: CdpClient,
  x: number,
  y: number,
): Promise<void> {
  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mousePressed',
    x,
    y,
    button: 'right',
    clickCount: 1,
  });
  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mouseReleased',
    x,
    y,
    button: 'right',
    clickCount: 1,
  });
  trackPosition(x, y);
}

/**
 * Middle-click at (x, y) — typically triggers open-in-new-tab in browsers.
 */
export async function middleClickAt(
  client: CdpClient,
  x: number,
  y: number,
): Promise<void> {
  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mousePressed',
    x,
    y,
    button: 'middle',
    clickCount: 1,
  });
  await (client.raw.Input as any).dispatchMouseEvent({
    type: 'mouseReleased',
    x,
    y,
    button: 'middle',
    clickCount: 1,
  });
  trackPosition(x, y);
}

/**
 * Return the last known mouse position from the module-level tracker.
 * Returns {x: 0, y: 0} if no mouse event has been dispatched yet.
 */
export async function getMousePosition(
  _client: CdpClient,
): Promise<{ x: number; y: number }> {
  return { x: _lastX, y: _lastY };
}
