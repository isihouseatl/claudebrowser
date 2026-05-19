// src/cdp/animation2.ts
// CSS animation and transition inspection functions.
//
// Naming notes:
//   pauseAllAnimations2  — pauseAllAnimations already exported from animations.ts
//   resumeAllAnimations2 — resumeAllAnimations already exported from animations.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getAnimatingElements — Find elements currently being animated via
 * getAnimations(): tag, id, class, animationName, playState (max 20).
 */
export async function getAnimatingElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = Array.from(document.querySelectorAll('*')).filter(function(el) {
    return el.getAnimations && el.getAnimations().length > 0;
  });
  return JSON.stringify(els.slice(0, 20).map(function(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id,
      class: (el.className || '').toString().slice(0, 30),
      animations: el.getAnimations().map(function(a) {
        return {
          name: a.animationName || a.constructor.name,
          playState: a.playState,
          currentTime: a.currentTime
        };
      })
    };
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

/**
 * getCssAnimations — Get all CSS @keyframes rules defined in stylesheets:
 * name, keyframesCount (max 20).
 */
export async function getCssAnimations(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var rules = [];
  Array.from(document.styleSheets).forEach(function(ss) {
    try {
      Array.from(ss.cssRules).forEach(function(r) {
        if (r.constructor.name === 'CSSKeyframesRule') {
          rules.push({ name: r.name, keyframesCount: r.cssRules.length });
        }
      });
    } catch(e) {}
  });
  return JSON.stringify(rules.slice(0, 20));
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
 * getCssTransitions — Find elements with CSS transition property set:
 * tag, id, transition value (max 20).
 */
export async function getCssTransitions(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = Array.from(document.querySelectorAll('*'));
  var result = [];
  for (var i = 0; i < els.length; i++) {
    var t = getComputedStyle(els[i]).transition;
    if (t && t !== 'all 0s ease 0s' && t !== 'none') {
      result.push({ tag: els[i].tagName.toLowerCase(), id: els[i].id, transition: t.slice(0, 80) });
    }
    if (result.length >= 20) break;
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
 * getAnimationDuration — Get CSS animation-duration and animation-name for
 * animated elements (max 20).
 */
export async function getAnimationDuration(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = Array.from(document.querySelectorAll('*'));
  var result = [];
  for (var i = 0; i < els.length; i++) {
    var s = getComputedStyle(els[i]);
    if (s.animationName && s.animationName !== 'none') {
      result.push({
        tag: els[i].tagName.toLowerCase(),
        id: els[i].id,
        animationName: s.animationName,
        duration: s.animationDuration,
        iterationCount: s.animationIterationCount
      });
    }
    if (result.length >= 20) break;
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
 * getAnimationPlayState — Check play state of all active Web Animations API
 * animations: effect type, playState, progress (max 20).
 */
export async function getAnimationPlayState(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var anims = document.getAnimations ? document.getAnimations() : [];
  return JSON.stringify(anims.slice(0, 20).map(function(a) {
    return {
      type: a.constructor.name,
      playState: a.playState,
      currentTime: a.currentTime,
      duration: a.effect ? a.effect.getTiming().duration : null
    };
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

/**
 * pauseAllAnimations2 — Pause all Web Animations API animations.
 * Returns { paused, count }.
 * (Renamed from pauseAllAnimations to avoid collision with animations.ts export.)
 */
export async function pauseAllAnimations2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var anims = document.getAnimations ? document.getAnimations() : [];
  anims.forEach(function(a) { a.pause(); });
  return JSON.stringify({ paused: true, count: anims.length });
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
 * resumeAllAnimations2 — Resume all paused Web Animations API animations.
 * Returns { resumed, count }.
 * (Renamed from resumeAllAnimations to avoid collision with animations.ts export.)
 */
export async function resumeAllAnimations2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var anims = document.getAnimations ? document.getAnimations() : [];
  anims.forEach(function(a) { if (a.playState === 'paused') a.play(); });
  return JSON.stringify({ resumed: true, count: anims.length });
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
 * getScrollAnimations — Find elements with scroll-behavior, scroll-snap, or
 * sticky positioning: tag, id, scrollBehavior, snapType, position (max 20).
 */
export async function getScrollAnimations(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = Array.from(document.querySelectorAll('*'));
  var result = [];
  for (var i = 0; i < els.length; i++) {
    var s = getComputedStyle(els[i]);
    if (s.scrollBehavior === 'smooth' || s.scrollSnapType !== 'none' || s.position === 'sticky') {
      result.push({
        tag: els[i].tagName.toLowerCase(),
        id: els[i].id,
        scrollBehavior: s.scrollBehavior,
        scrollSnapType: s.scrollSnapType,
        position: s.position
      });
    }
    if (result.length >= 20) break;
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
