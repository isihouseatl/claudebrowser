// src/cdp/media2.ts
import { CdpClient } from './client';

// Return-value helpers matching the MCP tool response format used in server.ts.
function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text }] };
}

function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${text}` }] };
}

// ─── getMediaElements ────────────────────────────────────────────────────────
// Find all video/audio elements on the page and return a summary of each.
export async function getMediaElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      const els = [...document.querySelectorAll('video, audio')];
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          src: el.src || el.currentSrc || '',
          currentTime: el.currentTime,
          duration: isNaN(el.duration) ? 0 : el.duration,
          paused: el.paused,
          muted: el.muted,
          volume: el.volume,
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
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── getVideoState ───────────────────────────────────────────────────────────
// Return detailed state for a specific media element identified by CSS selector.
export async function getVideoState(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      var bufferedRanges = [];
      for (var i = 0; i < el.buffered.length; i++) {
        bufferedRanges.push({ start: el.buffered.start(i), end: el.buffered.end(i) });
      }
      return {
        src: el.src || el.currentSrc || '',
        currentTime: el.currentTime,
        duration: isNaN(el.duration) ? 0 : el.duration,
        paused: el.paused,
        muted: el.muted,
        volume: el.volume,
        buffered: bufferedRanges,
        playbackRate: el.playbackRate,
        readyState: el.readyState,
        networkState: el.networkState,
        error: el.error ? { code: el.error.code, message: el.error.message } : null
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
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── playMedia ───────────────────────────────────────────────────────────────
// Call .play() on a media element. Returns {ok: true} on success.
export async function playMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return Promise.resolve('Element not found');
      return el.play().then(function() { return 'ok'; }, function(e) { return String(e); });
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  const value = result.value as string;
  if (value === 'Element not found') {
    return err('Element not found');
  }
  if (value !== 'ok') {
    return err(value);
  }
  return ok(JSON.stringify({ ok: true }));
}

// ─── pauseMedia ──────────────────────────────────────────────────────────────
// Call .pause() on a media element.
export async function pauseMedia(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.pause();
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
  return ok(JSON.stringify({ ok: true }));
}

// ─── seekMedia ───────────────────────────────────────────────────────────────
// Set currentTime on a media element to the given time in seconds.
export async function seekMedia(
  client: CdpClient,
  selector: string,
  timeSeconds: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.currentTime = ${timeSeconds};
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
  return ok(JSON.stringify({ ok: true, currentTime: timeSeconds }));
}

// ─── setMediaVolume ──────────────────────────────────────────────────────────
// Set volume (0.0–1.0) on a media element. Values outside range are clamped.
export async function setMediaVolume(
  client: CdpClient,
  selector: string,
  volume: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const clamped = Math.max(0, Math.min(1, volume));
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.volume = ${clamped};
      return el.volume;
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
  return ok(JSON.stringify({ ok: true, volume: result.value }));
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
  return ok(JSON.stringify({ ok: true, muted: true }));
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
  return ok(JSON.stringify({ ok: true, muted: false }));
}
