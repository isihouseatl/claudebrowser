import type CRI from 'chrome-remote-interface';

export async function getIframeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const iframes = Array.from(document.querySelectorAll('iframe')).slice(0, 20);
    return iframes.map(f => ({
      id: f.id || null,
      src_preview: (f.src || f.getAttribute('src') || '').slice(0, 120),
      name: f.name || null,
      width: f.width || f.getAttribute('width') || null,
      height: f.height || f.getAttribute('height') || null,
      sandbox: f.getAttribute('sandbox'),
      loading: f.getAttribute('loading') || null
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEmbedElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const embeds = Array.from(document.querySelectorAll('embed')).slice(0, 20);
    return embeds.map(e => ({
      id: e.id || null,
      src_preview: (e.src || e.getAttribute('src') || '').slice(0, 120),
      type: e.type || e.getAttribute('type') || null,
      width: e.width || e.getAttribute('width') || null,
      height: e.height || e.getAttribute('height') || null
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getObjectElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const objects = Array.from(document.querySelectorAll('object')).slice(0, 20);
    return objects.map(o => ({
      id: o.id || null,
      data_preview: (o.data || o.getAttribute('data') || '').slice(0, 120),
      type: o.type || o.getAttribute('type') || null,
      width: o.width || o.getAttribute('width') || null,
      height: o.height || o.getAttribute('height') || null
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCrossOriginFrames(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const pageOrigin = location.origin;
    const iframes = Array.from(document.querySelectorAll('iframe'));
    const crossOrigin = iframes.filter(f => {
      try {
        const src = f.src || f.getAttribute('src') || '';
        if (!src || src.startsWith('about:') || src.startsWith('javascript:')) return false;
        const url = new URL(src, location.href);
        return url.origin !== pageOrigin;
      } catch (e) { return false; }
    });
    const origins = [...new Set(crossOrigin.map(f => {
      try { return new URL(f.src, location.href).origin.slice(0, 80); } catch(e) { return 'unknown'; }
    }))].slice(0, 20);
    return { count: crossOrigin.length, origins };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getSameOriginFrames(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const pageOrigin = location.origin;
    const iframes = Array.from(document.querySelectorAll('iframe')).slice(0, 20);
    return iframes.filter(f => {
      try {
        const src = f.src || f.getAttribute('src') || '';
        if (!src || src.startsWith('about:') || src.startsWith('javascript:')) return true;
        const url = new URL(src, location.href);
        return url.origin === pageOrigin;
      } catch (e) { return false; }
    }).map(f => ({
      id: f.id || null,
      src_preview: (f.src || f.getAttribute('src') || '').slice(0, 120),
      name: f.name || null
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getFrameSandbox(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const iframes = Array.from(document.querySelectorAll('iframe')).slice(0, 20);
    return iframes.map(f => {
      const sandbox = f.getAttribute('sandbox');
      const allowed = sandbox === null ? null : (sandbox === '' ? [] : sandbox.trim().split(/\\s+/));
      return {
        id: f.id || null,
        sandbox,
        allowedFeatures: allowed
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getFramePermissions(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const iframes = Array.from(document.querySelectorAll('iframe')).slice(0, 20);
    return iframes.map(f => ({
      id: f.id || null,
      allow_preview: (f.getAttribute('allow') || '').slice(0, 200) || null,
      src_preview: (f.src || f.getAttribute('src') || '').slice(0, 120)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getThirdPartyScripts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const pageHost = location.hostname.replace(/^www\\./, '');
    const scripts = Array.from(document.querySelectorAll('script[src]')).slice(0, 30);
    return scripts
      .map(s => {
        const src = s.getAttribute('src') || '';
        let domain = null;
        try {
          const url = new URL(src, location.href);
          domain = url.hostname.replace(/^www\\./, '');
        } catch(e) {}
        return {
          src_preview: src.slice(0, 120),
          async: s.hasAttribute('async'),
          defer: s.hasAttribute('defer'),
          domain
        };
      })
      .filter(s => s.domain && s.domain !== pageHost);
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
