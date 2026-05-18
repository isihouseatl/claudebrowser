// src/cdp/touch.ts
import { CdpClient } from './client';

/**
 * Dispatch a single tap: touchStart then touchEnd at (x, y) with a 50ms gap.
 */
export async function touchTap(client: CdpClient, x: number, y: number): Promise<void> {
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
  });
  await new Promise(r => setTimeout(r, 50));
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
}

/**
 * Dispatch two taps 100ms apart to simulate a double-tap.
 */
export async function touchDoubleTap(client: CdpClient, x: number, y: number): Promise<void> {
  await touchTap(client, x, y);
  await new Promise(r => setTimeout(r, 100));
  await touchTap(client, x, y);
}

/**
 * Simulate a long press: touchStart, wait durationMs, touchEnd.
 * @param durationMs How long to hold (default 600ms)
 */
export async function touchLongPress(
  client: CdpClient,
  x: number,
  y: number,
  durationMs: number = 600,
): Promise<void> {
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
  });
  await new Promise(r => setTimeout(r, durationMs));
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
}

/**
 * Simulate a swipe by interpolating touchMove events from start to end.
 * @param steps Number of intermediate move steps (default 10)
 */
export async function touchSwipe(
  client: CdpClient,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 10,
): Promise<void> {
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
  });

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    await (client.raw.Input as any).dispatchTouchEvent({
      type: 'touchMove',
      touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
    });
    await new Promise(r => setTimeout(r, 16));
  }

  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
}

/**
 * Simulate a pinch gesture with two fingers at centerX±50, centerY.
 * Fingers move to centerX±(50*scale) to zoom in (scale>1) or out (scale<1).
 * @param scale Scale factor — >1 zooms in, <1 zooms out
 */
export async function touchPinch(
  client: CdpClient,
  centerX: number,
  centerY: number,
  scale: number,
): Promise<void> {
  const initialOffset = 50;
  const finalOffset = initialOffset * scale;

  // touchStart with both fingers at their initial positions
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchStart',
    touchPoints: [
      { x: centerX - initialOffset, y: centerY, radiusX: 1, radiusY: 1, force: 1, id: 0 },
      { x: centerX + initialOffset, y: centerY, radiusX: 1, radiusY: 1, force: 1, id: 1 },
    ],
  });

  await new Promise(r => setTimeout(r, 16));

  // touchMove both fingers to their final positions
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchMove',
    touchPoints: [
      { x: centerX - finalOffset, y: centerY, radiusX: 1, radiusY: 1, force: 1, id: 0 },
      { x: centerX + finalOffset, y: centerY, radiusX: 1, radiusY: 1, force: 1, id: 1 },
    ],
  });

  await new Promise(r => setTimeout(r, 16));

  // touchEnd — lift both fingers
  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
}

/**
 * Scroll at (x, y) by (deltaX, deltaY) using the CDP synthesizeScrollGesture command.
 */
export async function touchScroll(
  client: CdpClient,
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  await (client.raw.Input as any).synthesizeScrollGesture({
    x,
    y,
    xDistance: deltaX,
    yDistance: deltaY,
    speed: 800,
  });
}

/**
 * Drag from start to end using touch events: touchStart, 5 touchMove steps, touchEnd.
 */
export async function touchDrag(
  client: CdpClient,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Promise<void> {
  const steps = 5;

  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
  });

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    await (client.raw.Input as any).dispatchTouchEvent({
      type: 'touchMove',
      touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 0 }],
    });
    await new Promise(r => setTimeout(r, 16));
  }

  await (client.raw.Input as any).dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
}

/**
 * Query the page for touch support capabilities via Runtime.evaluate.
 * Returns maxTouchPoints, ontouchstart presence, and PointerEvent presence.
 */
export async function getTouchSupport(
  client: CdpClient,
): Promise<{ maxTouchPoints: number; touchEventEnabled: boolean; pointerEnabled: boolean }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `({ maxTouchPoints: navigator.maxTouchPoints, touchEventEnabled: 'ontouchstart' in window, pointerEnabled: 'PointerEvent' in window })`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `getTouchSupport evaluate error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  const value = result.value as { maxTouchPoints: number; touchEventEnabled: boolean; pointerEnabled: boolean };
  return value;
}
