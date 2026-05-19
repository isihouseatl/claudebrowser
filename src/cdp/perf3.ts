// src/cdp/perf3.ts
// JavaScript performance, memory, and runtime metric inspection functions.
//
// Naming notes:
//   getJsHeapSize2        — getJsHeapSize already exported from perf2.ts
//   getPerformanceMarks3  — getPerformanceMarks already exported from perf2.ts and events.ts
//   getConsoleErrors2     — getConsoleErrors already exported from debug2.ts
//   getStylesheetCount2   — getStylesheetCount already exported from css2.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ---------------------------------------------------------------------------
// 1. getJsHeapSize2
//    Get JS heap memory info (Chrome only): usedJSHeapSize, totalJSHeapSize,
//    jsHeapSizeLimit, or { supported: false } if unavailable.
//    (Renamed from getJsHeapSize — already exported from perf2.ts.)
// ---------------------------------------------------------------------------

export async function getJsHeapSize2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!performance.memory) return { supported: false };
  return { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. getPerformanceMarks3
//    Get user-defined performance marks: { marks: [{name, startTime}], count }.
//    (Renamed from getPerformanceMarks — already exported from perf2.ts and events.ts.)
// ---------------------------------------------------------------------------

export async function getPerformanceMarks3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var marks = performance.getEntriesByType('mark');
  return { marks: marks.slice(0,20).map(function(m) { return { name: m.name, startTime: Math.round(m.startTime) }; }), count: marks.length };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. getPerformanceMeasures
//    Get user-defined performance measures:
//    { measures: [{name, startTime, duration}], count }.
// ---------------------------------------------------------------------------

export async function getPerformanceMeasures(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var measures = performance.getEntriesByType('measure');
  return { measures: measures.slice(0,20).map(function(m) { return { name: m.name, startTime: Math.round(m.startTime), duration: Math.round(m.duration) }; }), count: measures.length };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. getScriptCount
//    Count <script> tags by type:
//    { total, inline, external, module, nomodule, async, defer }.
// ---------------------------------------------------------------------------

export async function getScriptCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var scripts = document.querySelectorAll('script');
  var result = { total: scripts.length, inline: 0, external: 0, module: 0, nomodule: 0, async: 0, defer: 0 };
  Array.from(scripts).forEach(function(s) {
    if (s.src) result.external++; else result.inline++;
    if (s.type === 'module') result.module++;
    if (s.hasAttribute('nomodule')) result.nomodule++;
    if (s.async) result.async++;
    if (s.defer) result.defer++;
  });
  return result;
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. getConsoleErrors2
//    Get console errors recorded in window.__consoleErrors (patches console.error
//    on first call). Returns { errors, count, patched }.
//    (Renamed from getConsoleErrors — already exported from debug2.ts.)
// ---------------------------------------------------------------------------

export async function getConsoleErrors2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (!window.__consolePatched) {
    window.__consoleErrors = [];
    var origError = console.error;
    console.error = function() { window.__consoleErrors.push(Array.from(arguments).join(' ').slice(0,100)); if (window.__consoleErrors.length > 20) window.__consoleErrors.shift(); origError.apply(console, arguments); };
    window.__consolePatched = true;
  }
  return { errors: window.__consoleErrors || [], count: (window.__consoleErrors||[]).length, patched: true };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. getResourceTiming
//    Get resource timing for last 20 resources:
//    name_preview, initiatorType, duration (ms), transferSize.
// ---------------------------------------------------------------------------

export async function getResourceTiming(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var entries = performance.getEntriesByType('resource');
  return entries.slice(-20).map(function(e) { return { name: e.name.split('/').pop().slice(0,50), initiatorType: e.initiatorType, duration: Math.round(e.duration), transferSize: e.transferSize || 0 }; });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as unknown[];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. getNavigationEntries
//    Get navigation timing entries: navigationType, redirectCount, transferSize,
//    encodedBodySize, decodedBodySize. Returns { supported: false } if unavailable.
// ---------------------------------------------------------------------------

export async function getNavigationEntries(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var nav = performance.getEntriesByType('navigation');
  if (!nav.length) return { supported: false };
  var e = nav[0];
  return { navigationType: e.type, redirectCount: e.redirectCount, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 8. getStylesheetCount2
//    Count stylesheets by type: { total, external, inline, disabled }.
//    (Renamed from getStylesheetCount — already exported from css2.ts.)
// ---------------------------------------------------------------------------

export async function getStylesheetCount2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var sheets = document.styleSheets;
  var total = sheets.length, external = 0, inline = 0, disabled = 0;
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].href) external++; else inline++;
    if (sheets[i].disabled) disabled++;
  }
  return { total: total, external: external, inline: inline, disabled: disabled };
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = result.value as Record<string, unknown>;
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
