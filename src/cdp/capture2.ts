// src/cdp/capture2.ts
import { CdpClient } from './client';

// Screenshot the full page by setting captureBeyondViewport: true.
// Returns base64-encoded PNG.
export async function takeFullPageScreenshot(client: CdpClient): Promise<string> {
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'png',
    captureBeyondViewport: true,
  });
  return data as string;
}

// Screenshot the current viewport only (no clip, captureBeyondViewport: false).
// Returns base64-encoded PNG.
export async function takeViewportScreenshot(client: CdpClient): Promise<string> {
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'png',
    captureBeyondViewport: false,
  });
  return data as string;
}

// Screenshot a specific rectangular region using clip.
// Returns base64-encoded PNG.
export async function takeRegionScreenshot(
  client: CdpClient,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'png',
    clip: { x, y, width, height, scale: 1 },
  });
  return data as string;
}

// Screenshot in JPEG format with configurable quality (default 85).
// Returns base64-encoded JPEG.
export async function takeJpegScreenshot(client: CdpClient, quality = 85): Promise<string> {
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'jpeg',
    quality,
  });
  return data as string;
}

// Compare two base64 PNG strings via string equality.
// Returns {same: true, note: 'pixel-perfect match'} or {same: false, note: 'screenshots differ'}.
export async function compareScreenshots(
  client: CdpClient,
  base64a: string,
  base64b: string,
): Promise<{ same: boolean; note: string }> {
  const same = base64a === base64b;
  return {
    same,
    note: same ? 'pixel-perfect match' : 'screenshots differ',
  };
}

// Return {width, height, devicePixelRatio} for the full page.
// width = scrollWidth, height = scrollHeight.
// Named getFullPageDimensions2 to avoid conflict with getPageDimensions in layout.ts.
export async function getFullPageDimensions2(
  client: CdpClient,
): Promise<{ width: number; height: number; devicePixelRatio: number }> {
  const expression = `({
  width: document.documentElement.scrollWidth,
  height: document.documentElement.scrollHeight,
  devicePixelRatio: window.devicePixelRatio,
})`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as { width: number; height: number; devicePixelRatio: number };
}

// Wait delayMs milliseconds on the server side, then take a full viewport screenshot.
// Returns base64-encoded PNG.
export async function takeScreenshotAfterDelay(
  client: CdpClient,
  delayMs: number,
): Promise<string> {
  const expression = `new Promise(resolve => setTimeout(resolve, ${Math.max(0, Math.floor(delayMs))}))`;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'png',
    captureBeyondViewport: false,
  });
  return data as string;
}

// Screenshot the element matching selector using its bounding box as the clip region.
// Returns base64-encoded PNG. Throws if element not found.
// Named screenshotSelector to avoid conflict with screenshotElement in extract.ts.
export async function screenshotSelector(client: CdpClient, selector: string): Promise<string> {
  const sel = JSON.stringify(selector);
  const expression = `(() => {
  const el = document.querySelector(${sel});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  const rect = result.value as { x: number; y: number; width: number; height: number };
  if (rect.width === 0 || rect.height === 0) {
    throw new Error(`Element has zero area: ${selector}`);
  }
  const { data } = await (client.raw.Page as any).captureScreenshot({
    format: 'png',
    clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
  });
  return data as string;
}
