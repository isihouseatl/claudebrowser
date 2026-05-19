// src/cdp/embed2.ts — Embedded content inspection (iframes, embeds, objects, video, audio)

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. All <video> elements (max 20)
export async function getVideoElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('video');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var src = el.src || '';
    var csrc = el.currentSrc || '';
    out.push({
      id: el.id || null,
      src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
      currentSrc_preview: csrc.length > 80 ? csrc.slice(0, 80) + '...' : csrc,
      autoplay: el.autoplay,
      controls: el.controls,
      muted: el.muted,
      loop: el.loop,
      width: el.width,
      height: el.height,
      duration: isFinite(el.duration) ? el.duration : null,
      paused: el.paused
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. All <audio> elements (max 20)
export async function getAudioElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('audio');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var src = el.src || '';
    out.push({
      id: el.id || null,
      src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
      autoplay: el.autoplay,
      controls: el.controls,
      muted: el.muted,
      loop: el.loop,
      paused: el.paused,
      currentTime: el.currentTime
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. All <embed> elements (max 20)
export async function getEmbedElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('embed');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var src = el.src || '';
    out.push({
      id: el.id || null,
      src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
      type: el.type || null,
      width: el.width || null,
      height: el.height || null
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. All <object> elements (max 20)
export async function getObjectElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('object');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var data = el.data || '';
    out.push({
      id: el.id || null,
      data_preview: data.length > 80 ? data.slice(0, 80) + '...' : data,
      type: el.type || null,
      width: el.width || null,
      height: el.height || null
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. YouTube iframes (max 20)
export async function getYouTubeEmbeds(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var ytFrames = [];
  var all = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
  var limit = Math.min(all.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = all[i];
    var src = el.src || '';
    var title = el.title || '';
    ytFrames.push({
      src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
      id: el.id || null,
      width: el.width || null,
      height: el.height || null,
      title_preview: title.length > 80 ? title.slice(0, 80) + '...' : title
    });
  }
  return { total: all.length, items: ytFrames };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. <source> elements inside <video> (max 20)
export async function getVideoSources(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var all = [];
  var videos = document.querySelectorAll('video');
  for (var v = 0; v < videos.length; v++) {
    var sources = videos[v].querySelectorAll('source');
    for (var s = 0; s < sources.length; s++) {
      if (all.length >= 20) break;
      var el = sources[s];
      var src = el.src || '';
      all.push({
        src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
        type: el.type || null,
        media: el.media || null
      });
    }
    if (all.length >= 20) break;
  }
  var totalVideos = videos.length;
  return { totalVideos: totalVideos, items: all };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. <track> elements (subtitles/captions) (max 20)
export async function getMediaTracks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('track');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var src = el.src || '';
    out.push({
      src_preview: src.length > 80 ? src.slice(0, 80) + '...' : src,
      kind: el.kind || null,
      srclang: el.srclang || null,
      label: el.label || null,
      default: el.default
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. <picture> elements with source count and inner <img> info (max 20)
export async function getPictureElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
  var els = document.querySelectorAll('picture');
  var out = [];
  var limit = Math.min(els.length, 20);
  for (var i = 0; i < limit; i++) {
    var el = els[i];
    var sources = el.querySelectorAll('source');
    var img = el.querySelector('img');
    var imgSrc = img ? (img.src || '') : '';
    var imgAlt = img ? (img.alt || '') : '';
    out.push({
      id: el.id || null,
      sourceCount: sources.length,
      imgSrc_preview: imgSrc.length > 80 ? imgSrc.slice(0, 80) + '...' : imgSrc,
      imgAlt_preview: imgAlt.length > 80 ? imgAlt.slice(0, 80) + '...' : imgAlt
    });
  }
  return { total: els.length, items: out };
})()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS exception');
    }
    return ok(result.value);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
