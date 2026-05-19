// src/cdp/perf2.ts
// Additional performance and memory measurement tools via CDP.
// No DOM lib — all DOM access is inside Runtime.evaluate expression strings.
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// ---------------------------------------------------------------------------
// 1. getCdpMetrics
//    Get Chrome performance metrics via CDP Performance domain.
// ---------------------------------------------------------------------------

export async function getCdpMetrics(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Performance as any).enable({});
    const { metrics } = await (client.raw.Performance as any).getMetrics();
    return ok(JSON.stringify(metrics));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. getJsHeapSize
//    Get JS heap size from performance.memory (Chrome-only).
// ---------------------------------------------------------------------------

export async function getJsHeapSize(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `typeof performance.memory !== 'undefined' ? JSON.stringify({ usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit }) : null`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    if (result.value === null || result.value === undefined) {
      return err('performance.memory not available');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 3. getDomNodeCount
//    Count total DOM nodes in the page.
// ---------------------------------------------------------------------------

export async function getDomNodeCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `document.querySelectorAll('*').length`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ count: result.value as number }));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 4. getEventListenerTotal
//    Approximate count of event listeners by checking on* properties across
//    up to 500 elements.
// ---------------------------------------------------------------------------

export async function getEventListenerTotal(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var props = ['onclick','onchange','oninput','onkeydown','onkeyup','onkeypress',
                     'onmousedown','onmouseup','onmousemove','onmouseover','onmouseout',
                     'onfocus','onblur','onsubmit','onload','onerror','ontouchstart',
                     'ontouchend','onscroll','ondblclick'];
        var all = document.querySelectorAll('*');
        var limit = Math.min(all.length, 500);
        var count = 0;
        for (var i = 0; i < limit; i++) {
          var el = all[i];
          for (var j = 0; j < props.length; j++) {
            if (el[props[j]] !== null && el[props[j]] !== undefined) {
              count++;
            }
          }
        }
        return count;
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(JSON.stringify({ approximate: result.value as number }));
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 5. markPerformance
//    Create a named performance mark.
// ---------------------------------------------------------------------------

export async function markPerformance(
  client: CdpClient,
  name: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.mark(${JSON.stringify(name)}); 'marked'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance mark created: ' + name);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 6. measurePerformance
//    Create a named performance measure between two marks.
// ---------------------------------------------------------------------------

export async function measurePerformance(
  client: CdpClient,
  name: string,
  startMark: string,
  endMark: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.measure(${JSON.stringify(name)}, ${JSON.stringify(startMark)}, ${JSON.stringify(endMark)}); 'measured'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance measure created: ' + name);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 7. clearPerformanceMarks
//    Clear all performance marks and measures.
// ---------------------------------------------------------------------------

export async function clearPerformanceMarks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `performance.clearMarks(); performance.clearMeasures(); 'cleared'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok('Performance marks and measures cleared');
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ---------------------------------------------------------------------------
// 8. getPerformanceMarks
//    Get all performance marks and measures.
// ---------------------------------------------------------------------------

export async function getPerformanceMarks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `JSON.stringify({ marks: performance.getEntriesByType('mark').map(e => ({name: e.name, startTime: e.startTime})), measures: performance.getEntriesByType('measure').map(e => ({name: e.name, startTime: e.startTime, duration: e.duration})) })`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
    }
    return ok(result.value as string);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
