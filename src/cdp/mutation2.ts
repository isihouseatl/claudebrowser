// src/cdp/mutation2.ts
// DOM mutation observation and dynamic page change tracking functions.
//
// Naming notes:
//   getMutationLog2   — getMutationLog already exported from observer.ts
//   clearMutationLog2 — clearMutationLog already exported from observer.ts

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * injectMutationObserver — Inject a MutationObserver that records DOM changes
 * to window.__mutationLog (circular buffer of 50 entries).
 * Returns { injected: true }.
 */
export async function injectMutationObserver(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  window.__mutationLog = window.__mutationLog || [];
  if (!window.__mutationObserver) {
    window.__mutationObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        window.__mutationLog.push({ type: m.type, target: m.target.tagName, added: m.addedNodes.length, removed: m.removedNodes.length, attr: m.attributeName, ts: Date.now() });
        if (window.__mutationLog.length > 50) window.__mutationLog.shift();
      });
    });
    window.__mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
  }
  return JSON.stringify({ injected: true });
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
 * getMutationLog2 — Get recorded mutation log from window.__mutationLog.
 * Returns { events: [...], count }.
 * (Renamed from getMutationLog to avoid collision with observer.ts export.)
 */
export async function getMutationLog2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify({ events: (window.__mutationLog || []), count: (window.__mutationLog || []).length });
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
 * clearMutationLog2 — Clear window.__mutationLog.
 * Returns { cleared: true }.
 * (Renamed from clearMutationLog to avoid collision with observer.ts export.)
 */
export async function clearMutationLog2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  window.__mutationLog = [];
  return JSON.stringify({ cleared: true });
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
 * getRecentlyAddedElements — Find elements that have data-dynamic, data-loaded,
 * or aria-live attributes: tag, id, text_preview (max 20).
 */
export async function getRecentlyAddedElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var candidates = document.querySelectorAll('[data-dynamic],[data-loaded],[aria-live]');
  return JSON.stringify(Array.from(candidates).slice(0, 20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, text: el.textContent.trim().slice(0, 80) };
  }));
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
 * getHiddenElements — Find elements with display:none or visibility:hidden:
 * tag, id, class (max 30).
 */
export async function getHiddenElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var all = document.querySelectorAll('*');
  var result = [];
  for (var i = 0; i < all.length && result.length < 30; i++) {
    var s = getComputedStyle(all[i]);
    if (s.display === 'none' || s.visibility === 'hidden') result.push({ tag: all[i].tagName.toLowerCase(), id: all[i].id, class: (all[i].className || '').slice(0, 30) });
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
 * getDOMNodeCount — Count total DOM nodes by type:
 * { elements, textNodes, commentNodes, total }.
 */
export async function getDOMNodeCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var walker = document.createTreeWalker(document, 0xFFFFFFFF);
  var elements = 0, text = 0, comments = 0;
  while (walker.nextNode()) {
    var n = walker.currentNode.nodeType;
    if (n === 1) elements++;
    else if (n === 3) text++;
    else if (n === 8) comments++;
  }
  return JSON.stringify({ elements: elements, textNodes: text, commentNodes: comments, total: elements + text + comments });
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
 * getDeepestElement — Find the deepest nested DOM element and its depth:
 * { tag, id, depth, path }.
 */
export async function getDeepestElement(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var deepest = document.body, maxDepth = 0;
  function traverse(el, depth) {
    if (depth > maxDepth) { maxDepth = depth; deepest = el; }
    for (var i = 0; i < el.children.length; i++) traverse(el.children[i], depth + 1);
  }
  traverse(document.body, 0);
  var path = []; var el = deepest;
  while (el && el !== document) { path.unshift(el.tagName ? el.tagName.toLowerCase() : '#'); el = el.parentElement; }
  return JSON.stringify({ tag: deepest.tagName ? deepest.tagName.toLowerCase() : '#text', id: deepest.id || '', depth: maxDepth, path: path.join(' > ') });
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
 * getOrphanedNodes — Find text nodes at body level not inside any element
 * (direct text children of body): { count, previews }.
 */
export async function getOrphanedNodes(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var orphans = [];
  for (var i = 0; i < document.body.childNodes.length; i++) {
    var n = document.body.childNodes[i];
    if (n.nodeType === 3 && n.textContent.trim()) orphans.push(n.textContent.trim().slice(0, 50));
  }
  return JSON.stringify({ count: orphans.length, previews: orphans.slice(0, 10) });
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
