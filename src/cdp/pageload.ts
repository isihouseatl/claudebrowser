// src/cdp/pageload.ts
import { CdpClient } from './client';

export interface WebVitals {
  lcp: number | null;       // Largest Contentful Paint (ms)
  fid: number | null;       // First Input Delay (ms)
  cls: number | null;       // Cumulative Layout Shift
  fcp: number | null;       // First Contentful Paint (ms)
  ttfb: number | null;      // Time to First Byte (ms)
  domContentLoaded: number; // DOMContentLoaded time (ms from navigationStart)
  load: number;             // load event time (ms from navigationStart)
}

// Get Web Vitals for the current page
export async function getWebVitals(client: CdpClient): Promise<WebVitals> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  const fcp = fcpEntry ? fcpEntry.startTime : null;

  const navEntries = performance.getEntriesByType('navigation');
  const nav = navEntries.length > 0 ? navEntries[0] : null;
  const ttfb = nav ? nav.responseStart - nav.startTime : null;
  const domContentLoaded = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
  const load = nav ? nav.loadEventEnd - nav.startTime : 0;

  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  const lcpEntry = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1] : null;
  const lcp = lcpEntry ? lcpEntry.startTime : null;

  const fidEntries = performance.getEntriesByType('first-input');
  const fidEntry = fidEntries.length > 0 ? fidEntries[0] : null;
  const fid = fidEntry ? fidEntry.processingStart - fidEntry.startTime : null;

  const layoutShifts = performance.getEntriesByType('layout-shift');
  const cls = layoutShifts.length > 0
    ? layoutShifts.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : e.value), 0)
    : null;

  return { lcp, fid, cls, fcp, ttfb, domContentLoaded, load };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as WebVitals;
}

// Get full Navigation Timing API data
export async function getNavigationTiming2(client: CdpClient): Promise<Record<string, number>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length === 0) return {};
  const nav = navEntries[0];
  const raw = nav.toJSON();
  const navStart = raw.startTime;
  const absoluteKeys = new Set([
    'fetchStart', 'domainLookupStart', 'domainLookupEnd', 'connectStart', 'connectEnd',
    'secureConnectionStart', 'requestStart', 'responseStart', 'responseEnd',
    'domInteractive', 'domContentLoadedEventStart', 'domContentLoadedEventEnd',
    'domComplete', 'loadEventStart', 'loadEventEnd',
  ]);
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'number') {
      out[key] = absoluteKeys.has(key) && val > 0 ? val - navStart : val;
    }
  }
  return out;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Record<string, number>;
}

// Get resource load times (top 20 by duration, descending)
export async function getSlowResources(
  client: CdpClient,
  minDurationMs = 0,
): Promise<Array<{ name: string; duration: number; type: string; size: number }>> {
  const minMs = JSON.stringify(minDurationMs);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const min = ${minMs};
  return performance.getEntriesByType('resource')
    .filter(e => e.duration >= min)
    .map(e => ({ name: e.name, duration: e.duration, type: e.initiatorType, size: e.transferSize ?? 0 }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 20);
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ name: string; duration: number; type: string; size: number }>;
}

// Get the Time to Interactive estimate (when main thread is idle for 5s)
export async function getTimeToInteractive(client: CdpClient): Promise<number | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const t = performance.timing;
  if (!t || !t.domInteractive || !t.navigationStart) return null;
  const tti = t.domInteractive - t.navigationStart;
  return tti > 0 ? tti : null;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number | null;
}

// Check if the page has any render-blocking resources
export async function getRenderBlockingResources(
  client: CdpClient,
): Promise<Array<{ url: string; type: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const head = document.head;
  if (!head) return [];
  const results = [];
  const links = head.querySelectorAll('link[rel="stylesheet"]');
  for (const el of links) {
    const href = el.href;
    if (href) results.push({ url: href, type: 'stylesheet' });
  }
  const scripts = head.querySelectorAll('script');
  for (const el of scripts) {
    if (!el.async && !el.defer && el.type !== 'module' && el.src) {
      results.push({ url: el.src, type: 'script' });
    }
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ url: string; type: string }>;
}

// Get memory usage info from performance.memory (Chrome only)
export async function getMemoryUsage(
  client: CdpClient,
): Promise<{ usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (!performance.memory) return null;
  return {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
  };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null;
}

// Count DOM nodes on the page
export async function getDomNodeCount(
  client: CdpClient,
): Promise<{ total: number; elements: number; text: number; comments: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const walker = document.createTreeWalker(document, 0xFFFFFFFF);
  let total = 0, elements = 0, text = 0, comments = 0;
  let node = walker.nextNode();
  while (node) {
    total++;
    const t = node.nodeType;
    if (t === 1) elements++;
    else if (t === 3) text++;
    else if (t === 8) comments++;
    node = walker.nextNode();
  }
  return { total, elements, text, comments };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { total: number; elements: number; text: number; comments: number };
}

// Get the document's load phase events timeline
export async function getLoadTimeline(
  client: CdpClient,
): Promise<Array<{ event: string; time: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length === 0) return [];
  const nav = navEntries[0];
  const start = nav.startTime;
  const milestones = [
    { event: 'fetchStart',                 time: nav.fetchStart },
    { event: 'domainLookupStart',          time: nav.domainLookupStart },
    { event: 'connectStart',               time: nav.connectStart },
    { event: 'requestStart',               time: nav.requestStart },
    { event: 'responseStart',              time: nav.responseStart },
    { event: 'responseEnd',                time: nav.responseEnd },
    { event: 'domInteractive',             time: nav.domInteractive },
    { event: 'domContentLoadedEventEnd',   time: nav.domContentLoadedEventEnd },
    { event: 'domComplete',                time: nav.domComplete },
    { event: 'loadEventEnd',               time: nav.loadEventEnd },
  ];
  return milestones
    .filter(m => typeof m.time === 'number' && m.time > 0)
    .map(m => ({ event: m.event, time: m.time - start }))
    .sort((a, b) => a.time - b.time);
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ event: string; time: number }>;
}
