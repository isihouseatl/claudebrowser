// src/cdp/touch2.ts
// Touch/gesture support, virtual keyboard, and mobile-specific inspection functions.
//
// Naming notes:
//   getTouchSupport3 — getTouchSupport already exported from touch.ts,
//                      getTouchSupport2 already registered in server.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getTouchSupport3 — Check touch support:
 * { maxTouchPoints, touchEventSupport, pointerEventSupport, isMobileUA }
 */
export async function getTouchSupport3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ maxTouchPoints: navigator.maxTouchPoints, touchEventSupport: 'ontouchstart' in window, pointerEventSupport: !!window.PointerEvent, isMobileUA: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) });
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

/**
 * getViewportMeta — Get <meta name="viewport"> content:
 * { content, hasViewport, isMobileOptimized }
 */
export async function getViewportMeta(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var vp = document.querySelector('meta[name="viewport"]');
  var content = vp ? vp.getAttribute('content') : null;
  return JSON.stringify({ content: content, hasViewport: !!vp, isMobileOptimized: !!(content && content.includes('width=device-width')) });
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

/**
 * getOrientationInfo — Get screen orientation:
 * { type, angle, width, height, isPortrait }
 */
export async function getOrientationInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var orientation = screen.orientation || {};
  return JSON.stringify({ type: orientation.type || 'unknown', angle: orientation.angle || 0, width: screen.width, height: screen.height, isPortrait: screen.height > screen.width });
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

/**
 * getVirtualKeyboardElements — Find elements that trigger virtual keyboards
 * (inputs with appropriate types): tag, id, type, inputmode (max 20).
 */
export async function getVirtualKeyboardElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var inputs = document.querySelectorAll('input,textarea,[contenteditable]');
  return JSON.stringify(Array.from(inputs).slice(0,20).map(function(el) { return { tag: el.tagName.toLowerCase(), id: el.id, type: el.getAttribute('type') || 'text', inputmode: el.getAttribute('inputmode') }; }));
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

/**
 * getTouchActionElements — Find elements with touch-action CSS property set:
 * tag, id, touchAction (max 20).
 */
export async function getTouchActionElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var ta = getComputedStyle(all[i]).touchAction;
    if (ta && ta !== 'auto') result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, touchAction: ta });
  }
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

/**
 * getScrollSnapElements — Find elements with scroll-snap-type set:
 * tag, id, snapType, snapAlign (max 20).
 */
export async function getScrollSnapElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.scrollSnapType && s.scrollSnapType !== 'none') result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, snapType: s.scrollSnapType });
  }
  for (var j = 0; j < all.length && result.length < 20; j++) {
    var sa = getComputedStyle(all[j]).scrollSnapAlign;
    if (sa && sa !== 'none') result.push({ tag: all[j].tagName.toLowerCase(), id: all[j].id, snapAlign: sa });
  }
  return JSON.stringify(result.slice(0,20));
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

/**
 * getAppleMobileMetaTags — Find Apple-specific mobile meta tags
 * (apple-mobile-web-app-*): name, content (max 10).
 */
export async function getAppleMobileMetaTags(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('meta[name^="apple-"]')).slice(0,10).map(function(m) { return { name: m.getAttribute('name'), content: m.getAttribute('content') }; }));
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

/**
 * getPWAManifest — Get <link rel="manifest"> and theme-color:
 * { manifestHref, themeColor, backgroundColor }
 */
export async function getPWAManifest(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var manifest = document.querySelector('link[rel="manifest"]');
  var theme = document.querySelector('meta[name="theme-color"]');
  var bg = document.querySelector('meta[name="background-color"]');
  return JSON.stringify({ manifestHref: manifest ? manifest.getAttribute('href') : null, themeColor: theme ? theme.getAttribute('content') : null, backgroundColor: bg ? bg.getAttribute('content') : null });
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
