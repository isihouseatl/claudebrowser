// src/cdp/media2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ─── getAllMediaElements ──────────────────────────────────────────────────────
// List all audio and video elements on page. Returns JSON array.
export async function getAllMediaElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('audio, video'), 0, 20);
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          src: el.currentSrc || el.src || '',
          paused: el.paused,
          muted: el.muted,
          duration: isNaN(el.duration) ? 0 : el.duration,
          currentTime: el.currentTime,
          readyState: el.readyState
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value);
}

// ─── playMedia ───────────────────────────────────────────────────────────────
// Call .play() on a media element matching selector.
export async function playMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.querySelector(${JSON.stringify(selector)})?.play().then(function() { return 'playing'; }).catch(function(e) { return 'error:' + e.message; })`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  const value = result.value as string | undefined;
  if (value === undefined || value === null) {
    return err('Element not found');
  }
  if (typeof value === 'string' && value.startsWith('error:')) {
    return err(value.slice(6));
  }
  return ok(value);
}

// ─── pauseMedia ──────────────────────────────────────────────────────────────
// Call .pause() on a media element matching selector.
export async function pauseMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return 'not-found';
      el.pause();
      return 'paused';
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === 'not-found') {
    return err('Element not found');
  }
  return ok(result.value);
}

// ─── setMediaVolume ──────────────────────────────────────────────────────────
// Set volume (0.0–1.0) on a media element. Clamped inside the expression.
export async function setMediaVolume(
  client: CdpClient,
  selector: string,
  volume: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      var v = Math.min(1, Math.max(0, ${volume}));
      el.volume = v;
      return 'set';
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value);
}

// ─── muteMedia ───────────────────────────────────────────────────────────────
// Set muted=true on a media element.
export async function muteMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.muted = true;
      return el.muted;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok('Muted');
}

// ─── unmuteMedia ─────────────────────────────────────────────────────────────
// Set muted=false on a media element.
export async function unmuteMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.muted = false;
      return el.muted;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok('Unmuted');
}

// ─── seekMedia ───────────────────────────────────────────────────────────────
// Set currentTime on a media element.
export async function seekMedia(
  client: CdpClient,
  selector: string,
  time: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.currentTime = ${time};
      return true;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok('Seeked to ' + time);
}

// ─── getVideoState ───────────────────────────────────────────────────────────
// Alias kept for backward compatibility with server.ts imports.
export { getMediaState as getVideoState };

// ─── getMediaState ───────────────────────────────────────────────────────────
// Get detailed state of a specific media element identified by CSS selector.
export async function getMediaState(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return {
        paused: el.paused,
        muted: el.muted,
        volume: el.volume,
        currentTime: el.currentTime,
        duration: isNaN(el.duration) ? 0 : el.duration,
        playbackRate: el.playbackRate,
        readyState: el.readyState,
        networkState: el.networkState,
        src: el.currentSrc || el.src || '',
        ended: el.ended,
        loop: el.loop
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(result.value);
}
