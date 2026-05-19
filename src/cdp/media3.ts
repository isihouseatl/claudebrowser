import type CRI from 'chrome-remote-interface';

export async function getVideoElements4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const videos = Array.from(document.querySelectorAll('video')).slice(0, 20);
    return videos.map(v => ({
      id: v.id || null,
      src_preview: (v.src || v.currentSrc || '').slice(0, 80) || null,
      paused: v.paused,
      currentTime: v.currentTime,
      duration: isFinite(v.duration) ? v.duration : null,
      width: v.videoWidth,
      height: v.videoHeight
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAudioElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const audios = Array.from(document.querySelectorAll('audio')).slice(0, 20);
    return audios.map(a => ({
      id: a.id || null,
      src_preview: (a.src || a.currentSrc || '').slice(0, 80) || null,
      paused: a.paused,
      currentTime: a.currentTime,
      duration: isFinite(a.duration) ? a.duration : null,
      muted: a.muted
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getMediaPlayers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('video, audio'));
    const videos = all.filter(el => el.tagName === 'VIDEO');
    const audios = all.filter(el => el.tagName === 'AUDIO');
    const playing = all.filter(el => !(el as HTMLMediaElement).paused);
    const paused = all.filter(el => (el as HTMLMediaElement).paused);
    const muted = all.filter(el => (el as HTMLMediaElement).muted);
    return {
      videoCount: videos.length,
      audioCount: audios.length,
      playingCount: playing.length,
      pausedCount: paused.length,
      mutedCount: muted.length
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getVideoSources2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const sources = Array.from(document.querySelectorAll('video source')).slice(0, 20);
    return sources.map(s => {
      const src = s as HTMLSourceElement;
      const parent = src.parentElement;
      return {
        src_preview: (src.src || '').slice(0, 80) || null,
        type: src.type || null,
        parentId: parent ? (parent.id || null) : null
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAudioSources(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const sources = Array.from(document.querySelectorAll('audio source')).slice(0, 20);
    return sources.map(s => {
      const src = s as HTMLSourceElement;
      const parent = src.parentElement;
      return {
        src_preview: (src.src || '').slice(0, 80) || null,
        type: src.type || null,
        parentId: parent ? (parent.id || null) : null
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getMediaControls(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll(
      'button[class*="play"], button[class*="pause"], button[class*="mute"], button[class*="volume"], ' +
      'button[aria-label*="play" i], button[aria-label*="pause" i], button[aria-label*="mute" i], ' +
      'button[aria-label*="volume" i], button[aria-label*="fullscreen" i], ' +
      '[role="button"][class*="play"], [role="button"][class*="pause"]'
    )).slice(0, 20);
    return candidates.map(el => {
      const btn = el as HTMLElement;
      return {
        tag: btn.tagName.toLowerCase(),
        id: btn.id || null,
        class_preview: (btn.className || '').toString().slice(0, 60) || null,
        text_preview: (btn.textContent || btn.getAttribute('aria-label') || '').trim().slice(0, 40) || null,
        type: btn.getAttribute('type') || null
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getStreamElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('video, audio'));
    const streams = all.filter(el => {
      const media = el as HTMLMediaElement;
      const src = media.src || media.currentSrc || '';
      return media.srcObject !== null || src.startsWith('blob:') || src.startsWith('mediastream:');
    }).slice(0, 10);
    return streams.map(el => {
      const media = el as HTMLMediaElement;
      const src = media.src || media.currentSrc || '';
      let srcObject_preview = null;
      if (media.srcObject) {
        const obj = media.srcObject as any;
        srcObject_preview = obj.id ? 'MediaStream:' + obj.id.slice(0, 20) : 'srcObject present';
      } else if (src.startsWith('blob:')) {
        srcObject_preview = 'blob: ' + src.slice(0, 60);
      }
      return {
        tag: el.tagName.toLowerCase(),
        id: (el as HTMLElement).id || null,
        srcObject_preview: srcObject_preview
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getMediaState2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const videos = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
    const audios = Array.from(document.querySelectorAll('audio')) as HTMLAudioElement[];
    const all = [...videos, ...audios] as HTMLMediaElement[];
    return {
      hasVideo: videos.length > 0,
      hasAudio: audios.length > 0,
      anyPlaying: all.some(el => !el.paused),
      anyMuted: all.some(el => el.muted),
      hasAutoplay: all.some(el => el.autoplay),
      hasPictureInPicture: videos.some(v => document.pictureInPictureElement === v)
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
