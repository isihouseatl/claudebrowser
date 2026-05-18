// src/cdp/debug.ts
import { CdpClient } from './client';

// ---- Interfaces ----

export interface ObstructionInfo {
  obscured: boolean;
  topElement?: {
    tagName: string;
    selector: string;
    zIndex?: string;
    text?: string;
  };
}

export interface ClickableState {
  exists: boolean;
  visible: boolean;
  inViewport: boolean;
  enabled: boolean;
  obscured: boolean;
  pointerEvents: string;
}

export interface EventListenerInfo {
  type: string;
  useCapture: boolean;
  passive: boolean;
  once: boolean;
  scriptId?: string;
  lineNumber?: number;
}

export interface PageDiagnostic {
  url: string;
  title: string;
  readyState: string;
  jsErrorCount: number;
  consoleErrorCount: number;
  visibleElementCount: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface VisibilityState {
  exists: boolean;
  hasSize: boolean;
  cssVisible: boolean;
  cssDisplay: string;
  opacity: string;
  overflowHidden: boolean;
  parentHidden: boolean;
}

// ---- Helpers ----

function throwOnException(
  exceptionDetails: { exception?: { description?: string }; text?: string } | undefined,
  label: string,
): void {
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    throw new Error(`${label}: ${msg}`);
  }
}

// ---- Functions ----

/**
 * Check if an element at `selector` is obscured by another element.
 * Gets the element's center point, calls document.elementFromPoint, and checks
 * whether the topmost element is the target or a descendant of it.
 */
export async function getElementObstruction(
  client: CdpClient,
  selector: string,
): Promise<ObstructionInfo> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const target = document.querySelector(${JSON.stringify(selector)});
  if (!target) return { found: false };
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const top = document.elementFromPoint(cx, cy);
  if (!top) return { found: true, obscured: false };
  // not obscured if top IS the target or a descendant of it
  if (top === target || target.contains(top)) return { found: true, obscured: false };
  // build a simple CSS selector for the obstructor
  let topSel = top.tagName.toLowerCase();
  if (top.id) {
    topSel = '#' + top.id;
  } else if (top.className && typeof top.className === 'string') {
    const first = top.className.trim().split(/\\s+/)[0];
    if (first) topSel = top.tagName.toLowerCase() + '.' + first;
  }
  const zIndex = window.getComputedStyle(top).zIndex;
  const text = (top.textContent || '').trim().slice(0, 80);
  return {
    found: true,
    obscured: true,
    topElement: {
      tagName: top.tagName,
      selector: topSel,
      zIndex: zIndex !== 'auto' ? zIndex : undefined,
      text: text || undefined,
    },
  };
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getElementObstruction');
  const val = result.value as {
    found: boolean;
    obscured?: boolean;
    topElement?: { tagName: string; selector: string; zIndex?: string; text?: string };
  };
  if (!val.found) {
    return { obscured: false };
  }
  if (!val.obscured) {
    return { obscured: false };
  }
  return { obscured: true, topElement: val.topElement };
}

/**
 * Comprehensive check of whether an element can be clicked.
 */
export async function getClickableState(
  client: CdpClient,
  selector: string,
): Promise<ClickableState> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { exists: false, visible: false, inViewport: false, enabled: false, obscured: false, pointerEvents: 'none' };
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const visible =
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0;
  const inViewport =
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0;
  const enabled = !el.disabled;
  const pointerEvents = style.pointerEvents;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const top = document.elementFromPoint(cx, cy);
  const obscured = top !== null && top !== el && !el.contains(top);
  return { exists: true, visible, inViewport, enabled, obscured, pointerEvents };
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getClickableState');
  return result.value as ClickableState;
}

/**
 * Get event listeners registered on the element matching `selector`.
 * Uses the DOMDebugger CDP domain which is not included in chrome-remote-interface typings.
 */
export async function getEventListeners(
  client: CdpClient,
  selector: string,
): Promise<EventListenerInfo[]> {
  // Step 1: evaluate to get the remote objectId for the element
  const evalResult = await client.raw.Runtime.evaluate({
    expression: `document.querySelector(${JSON.stringify(selector)})`,
    objectGroup: 'debug-listeners',
  });
  throwOnException(evalResult.exceptionDetails, 'getEventListeners/evaluate');
  const objectId = evalResult.result.objectId;
  if (!objectId) return [];

  // Step 2: use DOMDebugger to fetch listeners
  const { listeners } = await (client.raw.DOMDebugger as unknown as {
    getEventListeners: (params: {
      objectId: string;
      depth?: number;
      pierce?: boolean;
    }) => Promise<{
      listeners: Array<{
        type: string;
        useCapture: boolean;
        passive: boolean;
        once: boolean;
        scriptId?: string;
        lineNumber?: number;
      }>;
    }>;
  }).getEventListeners({ objectId, depth: 0, pierce: false });

  return listeners.map((l) => ({
    type: l.type,
    useCapture: l.useCapture,
    passive: l.passive,
    once: l.once,
    scriptId: l.scriptId,
    lineNumber: l.lineNumber,
  }));
}

/**
 * Quick page health check in a single Runtime.evaluate round-trip.
 */
export async function getPageDiagnostic(client: CdpClient): Promise<PageDiagnostic> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const jsErrorCount = (window.__cbJsErrors && window.__cbJsErrors.length) ? window.__cbJsErrors.length : 0;
  const consoleErrorCount = (window.__cbConsoleErrors && window.__cbConsoleErrors.length) ? window.__cbConsoleErrors.length : 0;
  let visibleElementCount = 0;
  const all = document.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    const r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) visibleElementCount++;
  }
  return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    jsErrorCount,
    consoleErrorCount,
    visibleElementCount,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getPageDiagnostic');
  return result.value as PageDiagnostic;
}

/**
 * Given an array of CSS selectors, return those that no longer match any element in the DOM.
 */
export async function findStaleElements(
  client: CdpClient,
  selectors: string[],
): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sels = ${JSON.stringify(selectors)};
  return sels.filter(s => document.querySelector(s) === null);
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'findStaleElements');
  return result.value as string[];
}

/**
 * Get multiple computed CSS properties for a single element in one round-trip.
 * Returns an object mapping each requested property to its computed value.
 */
export async function getComputedProperties(
  client: CdpClient,
  selector: string,
  properties: string[],
): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const props = ${JSON.stringify(properties)};
  const style = window.getComputedStyle(el);
  const out = {};
  for (let i = 0; i < props.length; i++) {
    out[props[i]] = style.getPropertyValue(props[i]);
  }
  return out;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getComputedProperties');
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as Record<string, string>;
}

/**
 * Detailed visibility breakdown for a single element.
 */
export async function checkVisibility(
  client: CdpClient,
  selector: string,
): Promise<VisibilityState> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return {
    exists: false,
    hasSize: false,
    cssVisible: false,
    cssDisplay: 'none',
    opacity: '0',
    overflowHidden: false,
    parentHidden: false,
  };
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const hasSize = rect.width > 0 && rect.height > 0;
  const cssDisplay = style.display;
  const cssVisibilityProp = style.visibility;
  const opacity = style.opacity;
  const cssVisible = cssDisplay !== 'none' && cssVisibilityProp !== 'hidden' && opacity !== '0';

  // Walk ancestors to check for parentHidden and overflowHidden
  let parentHidden = false;
  let overflowHidden = false;
  let node = el.parentElement;
  while (node && node !== document.documentElement) {
    const ps = window.getComputedStyle(node);
    if (ps.display === 'none' || ps.visibility === 'hidden') {
      parentHidden = true;
    }
    if (!overflowHidden) {
      const ov = ps.overflow + ' ' + ps.overflowX + ' ' + ps.overflowY;
      if (ov.indexOf('hidden') !== -1) {
        // only flag if the element is actually clipped: its rect falls outside the ancestor's rect
        const ar = node.getBoundingClientRect();
        if (
          rect.right < ar.left ||
          rect.left > ar.right ||
          rect.bottom < ar.top ||
          rect.top > ar.bottom
        ) {
          overflowHidden = true;
        }
      }
    }
    node = node.parentElement;
  }

  return { exists: true, hasSize, cssVisible, cssDisplay, opacity, overflowHidden, parentHidden };
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'checkVisibility');
  return result.value as VisibilityState;
}
