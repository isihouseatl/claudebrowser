// src/cdp/page.ts
import { CdpClient } from './client';

export async function navigate(
  client: CdpClient,
  url: string,
  timeoutMs = 10000
): Promise<{ url: string; title: string }> {
  const raw = client.raw;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Navigation timeout after ${timeoutMs}ms`)), timeoutMs);
    const done = () => { clearTimeout(timer); resolve(); };
    raw.Page.loadEventFired(done);
    raw.Page.frameNavigated(done);
    // Fallback: resolve 2s after navigation call regardless
    raw.Page.navigate({ url }).then(() => setTimeout(done, 2000)).catch(reject);
  });
  await new Promise(r => setTimeout(r, 300)); // DOM stabilize
  const { result } = await raw.Runtime.evaluate({
    expression: 'JSON.stringify({ url: location.href, title: document.title })',
    returnByValue: true,
  });
  return JSON.parse(result.value as string);
}

export async function reload(client: CdpClient, timeoutMs = 10000): Promise<void> {
  const loadPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Reload timeout')), timeoutMs);
    client.raw.Page.loadEventFired(() => { clearTimeout(timer); resolve(); });
  });
  await client.raw.Page.reload({});
  await loadPromise;
}

export async function goBack(client: CdpClient): Promise<string> {
  await client.raw.Runtime.evaluate({ expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 500));
  const { result } = await client.raw.Runtime.evaluate({ expression: 'location.href', returnByValue: true });
  return result.value as string;
}

export async function scroll(
  client: CdpClient,
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number
): Promise<void> {
  const x = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
  const y = direction === 'up' ? -amount : direction === 'down' ? amount : 0;
  await client.raw.Runtime.evaluate({ expression: `window.scrollBy(${x}, ${y})` });
}

export async function waitForSelector(
  client: CdpClient,
  selector: string,
  timeoutMs = 10000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Element "${selector}" not found within ${timeoutMs}ms`);
}

export async function waitForNetworkIdle(
  client: CdpClient,
  idleMs = 500,
  timeoutMs = 15000
): Promise<void> {
  const raw = client.raw;
  await raw.Network.enable({});

  return new Promise<void>((resolve, reject) => {
    let inFlight = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const cleanup = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };

    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve();
    };

    const startIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => done(), idleMs);
    };

    const cancelIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    timeoutTimer = setTimeout(() => done(new Error(`waitForNetworkIdle timeout after ${timeoutMs}ms`)), timeoutMs);

    raw.Network.requestWillBeSent(() => {
      if (settled) return;
      inFlight++;
      cancelIdleTimer();
    });

    raw.Network.responseReceived(() => {
      if (settled) return;
      inFlight = Math.max(0, inFlight - 1);
      if (inFlight === 0) startIdleTimer();
    });

    raw.Network.loadingFailed(() => {
      if (settled) return;
      inFlight = Math.max(0, inFlight - 1);
      if (inFlight === 0) startIdleTimer();
    });

    // Start idle timer immediately in case there are no in-flight requests
    startIdleTimer();
  });
}

export async function scrollToElement(
  client: CdpClient,
  selector: string,
): Promise<{ x: number; y: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.scrollIntoView({ behavior: 'instant', block: 'center' });
  const rect = el.getBoundingClientRect();
  return {
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2),
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as { x: number; y: number };
}

export async function waitForUrl(
  client: CdpClient,
  pattern: string,
  timeoutMs = 10000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: 'location.href',
      returnByValue: true,
    });
    const href = result.value as string;
    if (href.includes(pattern)) return href;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`URL matching "${pattern}" not seen within ${timeoutMs}ms`);
}
