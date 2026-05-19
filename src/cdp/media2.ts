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

// ─── getVideoElements2 ───────────────────────────────────────────────────────
// Get all <video> elements with state: src, currentTime, duration, paused,
// muted, autoplay, loop, readyState, width, height (max 10).
// Renamed from getVideoElements to avoid collision with server.ts / video.ts.
export async function getVideoElements2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('video')).slice(0,10).map(function(v) {
    return { src: (v.src || v.currentSrc || '').slice(0,80), currentTime: v.currentTime, duration: v.duration, paused: v.paused, muted: v.muted, autoplay: v.autoplay, loop: v.loop, readyState: v.readyState, width: v.videoWidth, height: v.videoHeight };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getAudioElements ────────────────────────────────────────────────────────
// Get all <audio> elements with state: src, currentTime, duration, paused,
// muted, autoplay, loop, readyState (max 10).
export async function getAudioElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('audio')).slice(0,10).map(function(a) {
    return { src: (a.src || a.currentSrc || '').slice(0,80), currentTime: a.currentTime, duration: a.duration, paused: a.paused, muted: a.muted, autoplay: a.autoplay, loop: a.loop, readyState: a.readyState };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getMediaCount ───────────────────────────────────────────────────────────
// Count media elements on the page: videos, audios, iframes, embeds, objects.
export async function getMediaCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ videos: document.querySelectorAll('video').length, audios: document.querySelectorAll('audio').length, iframes: document.querySelectorAll('iframe').length, embeds: document.querySelectorAll('embed').length, objects: document.querySelectorAll('object').length });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getPlayingMedia ─────────────────────────────────────────────────────────
// Find currently playing video/audio elements: tag, src, currentTime,
// duration (max 10).
export async function getPlayingMedia(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('video,audio').forEach(function(el) {
    if (!el.paused && result.length < 10) result.push({ tag: el.tagName.toLowerCase(), src: (el.src||el.currentSrc||'').slice(0,80), currentTime: el.currentTime, duration: el.duration });
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── pauseAllMedia ───────────────────────────────────────────────────────────
// Pause all currently playing video and audio elements.
// Returns { paused: true, count: N }.
export async function pauseAllMedia(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var count = 0;
  document.querySelectorAll('video,audio').forEach(function(el) { if (!el.paused) { el.pause(); count++; } });
  return JSON.stringify({ paused: true, count: count });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── muteAllMedia ────────────────────────────────────────────────────────────
// Mute all video and audio elements on the page.
// Returns { muted: true, count: N }.
export async function muteAllMedia(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var count = 0;
  document.querySelectorAll('video,audio').forEach(function(el) { if (!el.muted) { el.muted = true; count++; } });
  return JSON.stringify({ muted: true, count: count });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getVideoSubtitles ───────────────────────────────────────────────────────
// Find <track> elements inside <video> elements: kind, src, srclang, label,
// default (max 20).
export async function getVideoSubtitles(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('video track')).slice(0,20).map(function(t) {
    return { kind: t.kind, src: (t.src||'').slice(0,80), srclang: t.srclang, label: t.label, default: t.default };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getEmbedSources ─────────────────────────────────────────────────────────
// Find all embed/object/iframe src sources: tag, src, type (max 20).
export async function getEmbedSources(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('embed,object,[src]').forEach(function(el) {
    if (result.length < 20) {
      var src = el.src || el.getAttribute('data') || el.getAttribute('src') || '';
      if (src) result.push({ tag: el.tagName.toLowerCase(), src: src.slice(0,100), type: el.type || el.getAttribute('type') || null });
    }
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
