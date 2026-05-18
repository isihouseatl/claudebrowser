// src/cdp/animation.ts
import { CdpClient } from './client';

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

export async function getAnimations(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return el.getAnimations().map(a => ({
    name: a.animationName || a.id || '',
    playState: a.playState,
    currentTime: a.currentTime,
    duration: a.effect && a.effect.getTiming ? a.effect.getTiming().duration : null,
  }));
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(JSON.stringify(result.value, null, 2));
}

export async function pauseAnimations(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const anims = el.getAnimations();
  anims.forEach(a => a.pause());
  return anims.length;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(`Paused ${result.value} animations`);
}

export async function playAnimations(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const anims = el.getAnimations();
  anims.forEach(a => a.play());
  return anims.length;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(`Playing ${result.value} animations`);
}

export async function getTransitions(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return getComputedStyle(el).transition;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(result.value as string);
}

export async function getAnimationCount(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return el.getAnimations().length;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(String(result.value));
}

export async function setAnimationPlaybackRate(client: CdpClient, selector: string, rate: number) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const anims = el.getAnimations();
  anims.forEach(a => a.updatePlaybackRate(${rate}));
  return anims.length;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(`Set playback rate to ${rate}`);
}

export async function getPageAnimationCount(client: CdpClient) {
  const expression = `[...document.querySelectorAll('*')].reduce((n, el) => n + el.getAnimations().length, 0)`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }

  return ok(String(result.value));
}

export async function cancelAnimations(client: CdpClient, selector: string) {
  const expression = `(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const anims = el.getAnimations();
  anims.forEach(a => a.cancel());
  return anims.length;
})()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  if (result.value === null) {
    return err('Element not found');
  }

  return ok(`Cancelled ${result.value} animations`);
}
