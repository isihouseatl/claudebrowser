// src/cdp/page.ts
import CDP from 'chrome-remote-interface';
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

export async function setViewport(
  client: CdpClient,
  width: number,
  height: number,
  deviceScaleFactor = 1,
  mobile = false,
): Promise<void> {
  await client.raw.Emulation.setDeviceMetricsOverride({
    width,
    height,
    deviceScaleFactor,
    mobile,
  });
  await client.raw.Emulation.setVisibleSize({ width, height });
}

// Returns base64-encoded PDF of the current page
export async function printToPDF(
  client: CdpClient,
  options?: {
    landscape?: boolean;
    printBackground?: boolean;
    scale?: number;
  }
): Promise<string> {
  const result = await client.raw.Page.printToPDF({
    landscape: options?.landscape,
    printBackground: options?.printBackground,
    scale: options?.scale,
  });
  return result.data;
}

// Wait for a new browser tab to open (e.g. after clicking a link that opens in a new window/tab).
// Returns the new tab's targetId.
export async function waitForNewTab(
  client: CdpClient,
  timeoutMs = 10000,
): Promise<string> {
  const before = await CDP.List({ port: client.port });
  const beforeIds = new Set(before.map((t: CDP.Target) => t.id));

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 300));
    const current = await CDP.List({ port: client.port });
    const newTab = current.find(
      (t: CDP.Target) => t.type === 'page' && !beforeIds.has(t.id)
    );
    if (newTab) return newTab.id;
  }
  throw new Error(`waitForNewTab: no new tab appeared within ${timeoutMs}ms`);
}

export interface PageMetrics {
  url: string;
  title: string;
  domNodes: number;
  jsEventListeners: number;
  jsHeapSizeBytes: number;
}

export async function getPageMetrics(client: CdpClient): Promise<PageMetrics> {
  await client.raw.Performance.enable({});

  const { metrics } = await client.raw.Performance.getMetrics();

  const find = (name: string): number => {
    const entry = (metrics as Array<{ name: string; value: number }>).find(m => m.name === name);
    return entry ? entry.value : 0;
  };

  const domNodes = find('Nodes');
  const jsEventListeners = find('JSEventListeners');
  const jsHeapSizeBytes = find('JSHeapUsedSize');

  const { result: urlResult } = await client.raw.Runtime.evaluate({
    expression: 'location.href',
    returnByValue: true,
  });
  const { result: titleResult } = await client.raw.Runtime.evaluate({
    expression: 'document.title',
    returnByValue: true,
  });

  return {
    url: urlResult.value as string,
    title: titleResult.value as string,
    domNodes,
    jsEventListeners,
    jsHeapSizeBytes,
  };
}

export async function getUrl(client: CdpClient): Promise<string> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: 'location.href',
    returnByValue: true,
  });
  return result.value as string;
}

export async function getTitle(client: CdpClient): Promise<string> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: 'document.title',
    returnByValue: true,
  });
  return result.value as string;
}

export async function goForward(client: CdpClient): Promise<string> {
  await client.raw.Runtime.evaluate({ expression: 'history.go(1)' });
  await new Promise(r => setTimeout(r, 300));
  const { result } = await client.raw.Runtime.evaluate({
    expression: 'location.href',
    returnByValue: true,
  });
  return result.value as string;
}

export async function waitForElementRemoved(
  client: CdpClient,
  selector: string,
  timeoutMs = 10000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `document.querySelector(${JSON.stringify(selector)}) === null`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Element "${selector}" still present after ${timeoutMs}ms`);
}

export async function waitForText(
  client: CdpClient,
  selector: string,
  text: string,
  timeoutMs = 10000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  return el !== null && el.textContent.includes(${JSON.stringify(text)});
})()`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Text "${text}" not found in "${selector}" within ${timeoutMs}ms`);
}

export async function getScrollPosition(client: CdpClient): Promise<{ x: number; y: number }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({ x: window.scrollX, y: window.scrollY })',
    returnByValue: true,
  });
  return JSON.parse(result.value as string);
}

export async function scrollToCoords(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Runtime.evaluate({ expression: `window.scrollTo(${x}, ${y})` });
}

export async function scrollToTop(client: CdpClient): Promise<void> {
  await client.raw.Runtime.evaluate({ expression: 'window.scrollTo(0, 0)' });
}

export async function scrollToBottom(client: CdpClient): Promise<void> {
  await client.raw.Runtime.evaluate({ expression: 'window.scrollTo(0, document.body.scrollHeight)' });
}

export async function waitForAttribute(
  client: CdpClient,
  selector: string,
  attribute: string,
  value: string,
  timeoutMs = 10000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  return el !== null && el.getAttribute(${JSON.stringify(attribute)}) === ${JSON.stringify(value)};
})()`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Attribute "${attribute}" on "${selector}" did not equal "${value}" within ${timeoutMs}ms`);
}

export async function waitForElementCount(
  client: CdpClient,
  selector: string,
  count: number,
  timeoutMs = 10000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `document.querySelectorAll(${JSON.stringify(selector)}).length === ${count}`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Expected ${count} elements matching "${selector}" but count did not match within ${timeoutMs}ms`);
}

export async function getPageSource(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'document.documentElement.outerHTML',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

export async function getHistoryLength(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'history.length',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

export async function goToHistoryIndex(client: CdpClient, n: number): Promise<string> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `history.go(${n})`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  await new Promise(r => setTimeout(r, 300));
  const { result, exceptionDetails: hrefEx } = await client.raw.Runtime.evaluate({
    expression: 'location.href',
    returnByValue: true,
  });
  if (hrefEx) {
    throw new Error(`JS error: ${hrefEx.exception?.description ?? hrefEx.text}`);
  }
  return result.value as string;
}

export async function scrollIntoView(client: CdpClient, x: number, y: number): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.scrollTo({ left: ${x} - window.innerWidth / 2, top: ${y} - window.innerHeight / 2, behavior: 'instant' })`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get all <meta> tags as array of {name, property, content, httpEquiv}
export async function getMetaTags(
  client: CdpClient,
): Promise<Array<{ name?: string; property?: string; content?: string; httpEquiv?: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('meta')).map(m => ({
  name: m.getAttribute('name') ?? undefined,
  property: m.getAttribute('property') ?? undefined,
  content: m.getAttribute('content') ?? undefined,
  httpEquiv: m.getAttribute('http-equiv') ?? undefined,
})))`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

// Get all <link rel="..."> tags as array of {rel, href, type, media}
export async function getLinkTags(
  client: CdpClient,
): Promise<Array<{ rel?: string; href?: string; type?: string; media?: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify(Array.from(document.querySelectorAll('link')).map(l => ({
  rel: l.getAttribute('rel') ?? undefined,
  href: l.getAttribute('href') ?? undefined,
  type: l.getAttribute('type') ?? undefined,
  media: l.getAttribute('media') ?? undefined,
})))`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}

// Get the document ready state: 'loading' | 'interactive' | 'complete'
export async function getReadyState(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'document.readyState',
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string;
}

// Wait for document readyState to become 'complete' (or timeout)
export async function waitForDOMContentLoaded(client: CdpClient, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `document.readyState === 'complete'`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`waitForDOMContentLoaded: readyState did not reach 'complete' within ${timeoutMs}ms`);
}
