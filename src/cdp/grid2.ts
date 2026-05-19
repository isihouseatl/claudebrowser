// src/cdp/grid2.ts
// CSS Grid and Flexbox layout inspection functions.
//
// Naming notes:
//   getFlexContainers2 — getFlexContainers already exported from an existing cdp module
//   getLayoutShift2    — getLayoutShift already exported from an existing cdp module

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getGridContainers — Find elements with display:grid:
 * tag, id, class, gridTemplateColumns, gridTemplateRows, childCount (max 20).
 */
export async function getGridContainers(
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
    if (s.display === 'grid' || s.display === 'inline-grid') {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, class: (all[i].className||'').slice(0,30), gridTemplateColumns: s.gridTemplateColumns.slice(0,60), gridTemplateRows: s.gridTemplateRows.slice(0,60), childCount: all[i].children.length });
    }
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
 * getFlexContainers2 — Find elements with display:flex (extended info):
 * tag, id, flexDirection, flexWrap, justifyContent, alignItems, childCount (max 20).
 * (Renamed from getFlexContainers to avoid collision with existing export.)
 */
export async function getFlexContainers2(
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
    if (s.display === 'flex' || s.display === 'inline-flex') {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, flexDirection: s.flexDirection, flexWrap: s.flexWrap, justifyContent: s.justifyContent, alignItems: s.alignItems, childCount: all[i].children.length });
    }
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
 * getGridAreas — Find elements with grid-area or grid-column/grid-row set:
 * tag, id, gridArea, gridColumn, gridRow (max 20).
 */
export async function getGridAreas(
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
    if (s.gridArea && s.gridArea !== 'auto / auto / auto / auto') {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, gridArea: s.gridArea, gridColumn: s.gridColumn, gridRow: s.gridRow });
    }
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
 * getFlexItems — Find direct children of flex containers with non-default flex
 * properties: tag, id, flexGrow, flexShrink, flexBasis, order (max 30).
 */
export async function getFlexItems(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var flexParents = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var d = getComputedStyle(all[i]).display;
    if (d === 'flex' || d === 'inline-flex') flexParents.push(all[i]);
  }
  var items = [];
  for (var j = 0; j < flexParents.length && items.length < 30; j++) {
    Array.from(flexParents[j].children).forEach(function(c) {
      if (items.length < 30) {
        var s = getComputedStyle(c);
        if (s.flexGrow !== '0' || s.flexShrink !== '1' || s.order !== '0') items.push({ tag: c.tagName.toLowerCase(), id: c.id, flexGrow: s.flexGrow, flexShrink: s.flexShrink, flexBasis: s.flexBasis, order: s.order });
      }
    });
  }
  return JSON.stringify(items);
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
 * getGridCount — Count grid and flex containers:
 * { gridContainers, flexContainers, inlineGrid, inlineFlex }.
 */
export async function getGridCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var counts = { gridContainers: 0, flexContainers: 0, inlineGrid: 0, inlineFlex: 0 };
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var d = getComputedStyle(all[i]).display;
    if (d === 'grid') counts.gridContainers++;
    else if (d === 'inline-grid') counts.inlineGrid++;
    else if (d === 'flex') counts.flexContainers++;
    else if (d === 'inline-flex') counts.inlineFlex++;
  }
  return JSON.stringify(counts);
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
 * getGridGaps — Find grid/flex containers with gap/column-gap/row-gap set:
 * tag, id, gap, columnGap, rowGap (max 20).
 */
export async function getGridGaps(
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
    var d = s.display;
    if ((d === 'grid' || d === 'flex' || d === 'inline-grid' || d === 'inline-flex') && (s.gap !== 'normal' || s.columnGap !== 'normal' || s.rowGap !== 'normal')) {
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, gap: s.gap, columnGap: s.columnGap, rowGap: s.rowGap });
    }
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
 * getAbsoluteElements — Find all position:absolute elements:
 * tag, id, top, left, width, height (max 20).
 */
export async function getAbsoluteElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 20; i++) {
    if (getComputedStyle(all[i]).position === 'absolute') {
      var r = all[i].getBoundingClientRect();
      result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) });
    }
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
 * getLayoutShift2 — Get cumulative layout shift score and largest shift sources
 * using LayoutShift PerformanceObserver (or 0 if not observed):
 * { cls, shiftCount, observed }.
 * (Renamed from getLayoutShift to avoid collision with existing export.)
 */
export async function getLayoutShift2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  if (window.__clsScore !== undefined) return JSON.stringify({ cls: window.__clsScore, shiftCount: window.__clsCount || 0, observed: true });
  if (!window.__clsObserving) {
    window.__clsScore = 0; window.__clsCount = 0;
    try {
      var obs = new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(e) { if (!e.hadRecentInput) { window.__clsScore += e.value; window.__clsCount++; } });
      });
      obs.observe({ type: 'layout-shift', buffered: true });
      window.__clsObserving = true;
    } catch(e) {}
  }
  return JSON.stringify({ cls: window.__clsScore || 0, shiftCount: window.__clsCount || 0, observed: !!window.__clsObserving });
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
