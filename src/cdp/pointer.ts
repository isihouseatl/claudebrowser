// src/cdp/pointer.ts
import type { CdpClient } from './client';

// ── Tool-response helpers ─────────────────────────────────────────────────────
function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

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

// ── Pointer Events API tools ──────────────────────────────────────────────────

/**
 * List all elements with pointer event listeners or pointer-events CSS != 'none'.
 * Checks onpointerdown, onpointerup, onpointermove, onpointerenter, onpointerleave,
 * onpointerover, onpointerout attributes. Also includes elements whose computed
 * pointer-events CSS property is not 'none'. Returns up to 30 results as JSON.
 */
export async function getPointerEvents(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var attrs = ['onpointerdown','onpointerup','onpointermove','onpointerenter','onpointerleave','onpointerover','onpointerout'];
  var all = Array.from(document.querySelectorAll('*'));
  var results = [];
  for (var i = 0; i < all.length && results.length < 30; i++) {
    var el = all[i];
    var found = [];
    for (var j = 0; j < attrs.length; j++) {
      if (el[attrs[j]] !== null && el[attrs[j]] !== undefined) {
        found.push(attrs[j].replace('on',''));
      }
    }
    var pe = window.getComputedStyle(el).pointerEvents;
    if (found.length > 0 || (pe && pe !== 'none' && pe !== 'auto')) {
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        'class': (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0,3).join(' ') : null,
        events: found,
        pointerEventsCss: pe
      });
    }
  }
  return JSON.stringify(results);
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Evaluation returned no value');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a `pointerdown` PointerEvent on the element matched by selector.
 */
export async function simulatePointerDown(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 }));
  return 'pointerdown dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a `pointerup` PointerEvent on the element matched by selector.
 */
export async function simulatePointerUp(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1 }));
  return 'pointerup dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a `pointermove` PointerEvent with clientX/clientY on the element matched by selector.
 */
export async function simulatePointerMove(
  client: CdpClient,
  selector: string,
  x: number,
  y: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 1, clientX: ${x}, clientY: ${y} }));
  return 'pointermove dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a `pointercancel` PointerEvent on the element matched by selector.
 */
export async function simulatePointerCancel(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
  return 'pointercancel dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Dispatch a `pointerenter` PointerEvent on the element matched by selector.
 * Note: pointerenter does not bubble.
 */
export async function simulatePointerEnter(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false, cancelable: false, pointerId: 1 }));
  return 'pointerenter dispatched';
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Check pointer capture availability on the element matched by selector.
 * Returns JSON { hasSetPointerCapture, hasReleasePointerCapture }.
 */
export async function getPointerCapture(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({
    hasSetPointerCapture: typeof el.setPointerCapture === 'function',
    hasReleasePointerCapture: typeof el.releasePointerCapture === 'function'
  });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Get the computed `touch-action` CSS property for the element matched by selector.
 * Returns JSON { touchAction: <value> }.
 */
export async function getTouchActionStyle(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({ touchAction: window.getComputedStyle(el).touchAction });
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value as string);
}
