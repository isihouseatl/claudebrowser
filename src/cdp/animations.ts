// src/cdp/animations.ts
import { CdpClient } from './client';

export interface AnimationInfo {
  id: string;
  name: string;
  type: 'CSSTransition' | 'CSSAnimation' | 'WebAnimation';
  duration: number;
  delay: number;
  playState: string;
  currentTime: number;
}

export async function getAnimations(client: CdpClient): Promise<AnimationInfo[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(document.getAnimations().map(a => ({
  id: a.id || '',
  name: a instanceof CSSAnimation ? a.animationName : (a instanceof CSSTransition ? a.transitionProperty : (a.id || '')),
  type: a instanceof CSSAnimation ? 'CSSAnimation' : (a instanceof CSSTransition ? 'CSSTransition' : 'WebAnimation'),
  duration: (a.effect && a.effect.getTiming ? a.effect.getTiming().duration : 0) || 0,
  delay: (a.effect && a.effect.getTiming ? a.effect.getTiming().delay : 0) || 0,
  playState: a.playState,
  currentTime: typeof a.currentTime === 'number' ? a.currentTime : 0,
})))`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as AnimationInfo[];
}

export async function getElementAnimations(client: CdpClient, selector: string): Promise<AnimationInfo[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  return el.getAnimations().map(a => ({
    id: a.id || '',
    name: a instanceof CSSAnimation ? a.animationName : (a instanceof CSSTransition ? a.transitionProperty : (a.id || '')),
    type: a instanceof CSSAnimation ? 'CSSAnimation' : (a instanceof CSSTransition ? 'CSSTransition' : 'WebAnimation'),
    duration: (a.effect && a.effect.getTiming ? a.effect.getTiming().duration : 0) || 0,
    delay: (a.effect && a.effect.getTiming ? a.effect.getTiming().delay : 0) || 0,
    playState: a.playState,
    currentTime: typeof a.currentTime === 'number' ? a.currentTime : 0,
  }));
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string) as AnimationInfo[];
}

export async function pauseAllAnimations(client: CdpClient): Promise<void> {
  try {
    await (client.raw.Animation as any).setPlaybackRate({ playbackRate: 0 });
  } catch {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.getAnimations().forEach(a => a.pause()); undefined`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
  }
}

export async function resumeAllAnimations(client: CdpClient): Promise<void> {
  try {
    await (client.raw.Animation as any).setPlaybackRate({ playbackRate: 1 });
  } catch {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.getAnimations().forEach(a => a.play()); undefined`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
  }
}

export async function setAnimationSpeed(client: CdpClient, rate: number): Promise<void> {
  const { exceptionDetails } = await (async () => {
    try {
      await (client.raw.Animation as any).setPlaybackRate({ playbackRate: rate });
      return { exceptionDetails: undefined };
    } catch {
      return client.raw.Runtime.evaluate({
        expression: `document.getAnimations().forEach(a => { a.updatePlaybackRate(${rate}); }); undefined`,
        returnByValue: true,
        awaitPromise: false,
      });
    }
  })();
  if (exceptionDetails) {
    throw new Error(`JS error: ${(exceptionDetails as any).exception?.description ?? (exceptionDetails as any).text}`);
  }
}

export async function finishAllAnimations(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.getAnimations().forEach(a => { try { a.finish(); } catch {} }); undefined`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function cancelElementAnimations(client: CdpClient, selector: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  el.getAnimations().forEach(a => a.cancel());
})(); undefined`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function waitForAnimationsFinished(
  client: CdpClient,
  selector?: string,
  timeoutMs: number = 10000,
): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + timeoutMs;

  const checkExpression = selector
    ? `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return true;
  return el.getAnimations().filter(a => a.playState !== 'finished' && a.playState !== 'idle').length === 0;
})()`
    : `document.getAnimations().filter(a => a.playState !== 'finished' && a.playState !== 'idle').length === 0`;

  while (Date.now() < deadline) {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: checkExpression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
    if (result.value === true) return;
    await new Promise<void>(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`waitForAnimationsFinished timed out after ${timeoutMs}ms`);
}
