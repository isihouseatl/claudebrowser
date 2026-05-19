// src/cdp/layout2.ts
// Layout inspection: grid, flex, sticky, fixed, absolute, overflow, z-index, viewport.
//
// Naming notes:
//   getGridContainers2  — getGridContainers already exported from cdp/grid2.ts
//   getFlexContainers3  — getFlexContainers already exported from cdp/responsive2.ts
//   getStickyElements2  — getStickyElements already exported from cdp/viewport2.ts
//   getAbsoluteElements2 — getAbsoluteElements already exported from cdp/grid2.ts
//   getZIndexStack2     — getZIndexStack already exported from cdp/viewport2.ts

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getGridContainers2 — elements with display:grid.
 * Returns [{tag, id, class, columns, rows}] (max 20).
 * (Renamed from getGridContainers to avoid collision with cdp/grid2.ts export.)
 */
export async function getGridContainers2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.display === 'grid' || s.display === 'inline-grid') {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        columns: s.gridTemplateColumns.slice(0, 80),
        rows: s.gridTemplateRows.slice(0, 80)
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getFlexContainers3 — elements with display:flex or display:inline-flex.
 * Returns [{tag, id, class, flexDirection, flexWrap}] (max 20).
 * (Renamed from getFlexContainers to avoid collision with cdp/responsive2.ts export.)
 */
export async function getFlexContainers3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.display === 'flex' || s.display === 'inline-flex') {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        flexDirection: s.flexDirection,
        flexWrap: s.flexWrap
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getStickyElements2 — elements with position:sticky.
 * Returns [{tag, id, class, top}] (max 20).
 * (Renamed from getStickyElements to avoid collision with cdp/viewport2.ts export.)
 */
export async function getStickyElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.position === 'sticky') {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        top: s.top
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getFixedElements — elements with position:fixed.
 * Returns [{tag, id, class, top, left, zIndex}] (max 20).
 */
export async function getFixedElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.position === 'fixed') {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        top: s.top,
        left: s.left,
        zIndex: s.zIndex
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getAbsoluteElements2 — elements with position:absolute.
 * Returns [{tag, id, class, top, left}] (max 20).
 * (Renamed from getAbsoluteElements to avoid collision with cdp/grid2.ts export.)
 */
export async function getAbsoluteElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var s = getComputedStyle(all[i]);
    if (s.position === 'absolute') {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        top: s.top,
        left: s.left
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getOverflowElements — elements with overflow:scroll, overflow:auto, or overflow:hidden (non-body).
 * Returns [{tag, id, class, overflow, overflowX, overflowY}] (max 20).
 */
export async function getOverflowElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  var overflowVals = ['scroll', 'auto', 'hidden'];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    if (all[i].tagName.toLowerCase() === 'body') continue;
    var s = getComputedStyle(all[i]);
    if (overflowVals.indexOf(s.overflow) !== -1 ||
        overflowVals.indexOf(s.overflowX) !== -1 ||
        overflowVals.indexOf(s.overflowY) !== -1) {
      out.push({
        tag: all[i].tagName.toLowerCase(),
        id: all[i].id || '',
        class: (all[i].className || '').toString().slice(0, 40),
        overflow: s.overflow,
        overflowX: s.overflowX,
        overflowY: s.overflowY
      });
    }
  }
  return JSON.stringify(out);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getZIndexStack2 — elements with non-auto z-index > 0, sorted descending.
 * Returns [{tag, id, class, zIndex}] (max 20).
 * (Renamed from getZIndexStack to avoid collision with cdp/viewport2.ts export.)
 */
export async function getZIndexStack2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var s = getComputedStyle(all[i]);
    if (s.zIndex !== 'auto') {
      var z = parseInt(s.zIndex, 10);
      if (!isNaN(z) && z > 0) {
        out.push({
          tag: all[i].tagName.toLowerCase(),
          id: all[i].id || '',
          class: (all[i].className || '').toString().slice(0, 40),
          zIndex: z
        });
      }
    }
  }
  out.sort(function(a, b) { return b.zIndex - a.zIndex; });
  return JSON.stringify(out.slice(0, 20));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getViewportInfo — window dimensions and scroll state.
 * Returns {innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio, scrollX, scrollY}.
 */
export async function getViewportInfo(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `
JSON.stringify({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  outerWidth: window.outerWidth,
  outerHeight: window.outerHeight,
  devicePixelRatio: window.devicePixelRatio,
  scrollX: window.scrollX,
  scrollY: window.scrollY
})
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
