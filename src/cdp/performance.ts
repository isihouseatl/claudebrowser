// src/cdp/performance.ts
import { CdpClient } from './client';

export interface PaintTiming {
  firstPaint: number | null;           // ms from navigation start
  firstContentfulPaint: number | null; // ms from navigation start
}

export interface NavigationTiming {
  domContentLoaded: number; // ms
  domInteractive: number;   // ms
  loadEvent: number;        // ms
  ttfb: number;             // time to first byte in ms
  dnsLookup: number;        // ms
  tcpConnect: number;       // ms
}

export interface ResourceTiming {
  name: string;
  duration: number; // ms
  size: number;     // bytes (transferSize)
  type: string;     // initiatorType
}

// Get paint timing (FP, FCP) from the PerformanceObserver API
export async function getPaintTiming(client: CdpClient): Promise<PaintTiming> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const entries = performance.getEntriesByType('paint');
  const fp = entries.find(e => e.name === 'first-paint');
  const fcp = entries.find(e => e.name === 'first-contentful-paint');
  return { firstPaint: fp ? fp.startTime : null, firstContentfulPaint: fcp ? fcp.startTime : null };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as PaintTiming;
}

// Get navigation timing breakdown
export async function getNavigationTiming(client: CdpClient): Promise<NavigationTiming> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const t = performance.getEntriesByType('navigation')[0];
  if (!t) return null;
  return {
    domContentLoaded: t.domContentLoadedEventEnd - t.startTime,
    domInteractive: t.domInteractive - t.startTime,
    loadEvent: t.loadEventEnd - t.startTime,
    ttfb: t.responseStart - t.startTime,
    dnsLookup: t.domainLookupEnd - t.domainLookupStart,
    tcpConnect: t.connectEnd - t.connectStart,
  };
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error('Navigation timing not available');
  }
  return result.value as NavigationTiming;
}

// Get all resource timings (scripts, stylesheets, images, XHR, etc.)
export async function getResourceTimings(client: CdpClient): Promise<ResourceTiming[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `performance.getEntriesByType('resource').map(e => ({
  name: e.name,
  duration: e.duration,
  size: e.transferSize ?? 0,
  type: e.initiatorType,
}))`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as ResourceTiming[];
}

// Clear the performance buffer (performance.clearResourceTimings())
export async function clearPerformanceBuffer(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'performance.clearResourceTimings()',
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
