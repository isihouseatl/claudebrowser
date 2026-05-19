// src/cdp/pwa2.ts
// Progressive Web App inspection functions

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify({ error: msg }) }] };
}

// 1. Get link[rel="manifest"]: { href, exists }
export async function getWebAppManifest(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector('link[rel="manifest"]');
  return JSON.stringify({ exists: !!el, href: el ? el.href : null });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 2. Get meta[name="theme-color"]: { color, exists }
export async function getThemeColorMeta(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector('meta[name="theme-color"]');
  return JSON.stringify({ exists: !!el, color: el ? el.getAttribute('content') : null });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 3. Get link[rel="apple-touch-icon"]: [{ href_preview, sizes, rel }] (max 10)
export async function getAppleTouchIcons(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var els = Array.from(document.querySelectorAll('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')).slice(0, 10);
  return JSON.stringify(els.map(function(el) {
    var href = el.href || el.getAttribute('href') || '';
    return {
      rel: el.getAttribute('rel') || '',
      href_preview: href.length > 80 ? href.slice(0, 80) + '...' : href,
      sizes: el.getAttribute('sizes') || null
    };
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 4. Check if beforeinstallprompt was deferred: { promptDeferred, standalone }
export async function getPwaInstallPrompt(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var standalone = window.matchMedia('(display-mode: standalone)').matches;
  var promptDeferred = typeof window._pwaPrompt !== 'undefined';
  return JSON.stringify({ promptDeferred: promptDeferred, standalone: standalone });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 5. All icon links (manifest, apple-touch, shortcut icon, icon): [{ rel, href_preview, sizes, type }] (max 20)
export async function getAppIcons(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var els = Array.from(document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]')).slice(0, 20);
  return JSON.stringify(els.map(function(el) {
    var href = el.href || el.getAttribute('href') || '';
    return {
      rel: el.getAttribute('rel') || '',
      href_preview: href.length > 80 ? href.slice(0, 80) + '...' : href,
      sizes: el.getAttribute('sizes') || null,
      type: el.getAttribute('type') || null
    };
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 6. Current display mode check: { standalone, fullscreen, minimalUi, browser }
export async function getPwaDisplayMode(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  return JSON.stringify({
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
    minimalUi: window.matchMedia('(display-mode: minimal-ui)').matches,
    browser: window.matchMedia('(display-mode: browser)').matches
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 7. Service worker and cache API presence: { hasServiceWorker, hasCacheAPI, registrationCount }
export async function getOfflineReadiness(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var hasServiceWorker = 'serviceWorker' in navigator;
  var hasCacheAPI = 'caches' in window;
  if (hasServiceWorker) {
    return navigator.serviceWorker.getRegistrations().then(function(regs) {
      return JSON.stringify({
        hasServiceWorker: true,
        hasCacheAPI: hasCacheAPI,
        registrationCount: regs.length
      });
    });
  }
  return Promise.resolve(JSON.stringify({
    hasServiceWorker: false,
    hasCacheAPI: hasCacheAPI,
    registrationCount: 0
  }));
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}

// 8. Web Share API support: { shareSupported, shareFilesSupported, shareTargetSupported }
export async function getWebShareSupport(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var shareSupported = 'share' in navigator;
  var shareFilesSupported = 'canShare' in navigator;
  var shareTargetSupported = !!document.querySelector('meta[name="share-target"]');
  return JSON.stringify({
    shareSupported: shareSupported,
    shareFilesSupported: shareFilesSupported,
    shareTargetSupported: shareTargetSupported
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok(result.value);
  }
}
