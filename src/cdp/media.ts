// src/cdp/media.ts
import { CdpClient } from './client';

export interface MediaInfo {
  selector: string;       // best-effort selector
  tagName: 'VIDEO' | 'AUDIO';
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  volume: number;        // 0-1
  playbackRate: number;
  readyState: number;    // 0-4 (HAVE_NOTHING to HAVE_ENOUGH_DATA)
  networkState: number;
}

// Get info for all media elements on the page
export async function getMediaElements(client: CdpClient): Promise<MediaInfo[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('audio,video'));
  return els.map((el, i) => {
    const tag = el.tagName;
    // Build a best-effort selector
    let selector = tag.toLowerCase();
    if (el.id) {
      selector = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      selector = tag.toLowerCase() + '.' + el.className.trim().split(/\\s+/).join('.');
    } else {
      // nth-of-type fallback
      const siblings = Array.from(document.querySelectorAll(tag.toLowerCase()));
      const idx = siblings.indexOf(el);
      selector = tag.toLowerCase() + ':nth-of-type(' + (idx + 1) + ')';
    }
    return {
      selector,
      tagName: tag,
      src: el.currentSrc || el.src || '',
      currentTime: el.currentTime,
      duration: isNaN(el.duration) ? 0 : el.duration,
      paused: el.paused,
      muted: el.muted,
      volume: el.volume,
      playbackRate: el.playbackRate,
      readyState: el.readyState,
      networkState: el.networkState,
    };
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as MediaInfo[];
}

// Play a media element
export async function playMedia(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  const result = el.play();
  if (result && typeof result.catch === 'function') result.catch(() => {});
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Pause a media element
export async function pauseMedia(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  el.pause();
  el.dispatchEvent(new Event('pause', { bubbles: true }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Seek a media element to a time in seconds
export async function seekMedia(
  client: CdpClient,
  selector: string,
  timeSeconds: number,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  el.currentTime = ${timeSeconds};
  el.dispatchEvent(new Event('seeking', { bubbles: true }));
  el.dispatchEvent(new Event('seeked', { bubbles: true }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Set volume (0-1) on a media element
export async function setMediaVolume(
  client: CdpClient,
  selector: string,
  volume: number,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  const clamped = Math.max(0, Math.min(1, ${volume}));
  el.volume = clamped;
  el.dispatchEvent(new Event('volumechange', { bubbles: true }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Mute or unmute a media element
export async function setMediaMuted(
  client: CdpClient,
  selector: string,
  muted: boolean,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  el.muted = ${muted};
  el.dispatchEvent(new Event('volumechange', { bubbles: true }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Set playback rate (e.g. 0.5 = half speed, 2 = double speed)
export async function setPlaybackRate(
  client: CdpClient,
  selector: string,
  rate: number,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  el.playbackRate = ${rate};
  el.dispatchEvent(new Event('ratechange', { bubbles: true }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Wait for a media element to reach a specific readyState (default 4 = HAVE_ENOUGH_DATA)
export async function waitForMediaReady(
  client: CdpClient,
  selector: string,
  readyState: number = 4,
  timeoutMs: number = 30000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const selLiteral = JSON.stringify(selector);

  while (Date.now() < deadline) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return null;
  return el.readyState;
})()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }

    if (result.value === null || result.value === undefined) {
      throw new Error(`Element not found: ${selector}`);
    }

    if ((result.value as number) >= readyState) {
      return;
    }

    await new Promise<void>(resolve => setTimeout(resolve, 300));
  }

  throw new Error(
    `Timeout waiting for media element ${selector} to reach readyState ${readyState} within ${timeoutMs}ms`,
  );
}
