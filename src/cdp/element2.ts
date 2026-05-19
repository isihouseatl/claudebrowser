// src/cdp/element2.ts
import type { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// Count how many ancestor elements an element has (depth in DOM tree)
export async function getElementDepth(client: CdpClient, selector: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  let depth = 0;
  let node = el.parentElement;
  while (node !== null) {
    depth++;
    node = node.parentElement;
  }
  return depth;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok({ selector, depth: result.value });
}

// Build a CSS selector path from root to element using tag+nth-child
export async function getElementPath(client: CdpClient, selector: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1) {
    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === node.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(node) + 1;
        parts.unshift(tag + ':nth-child(' + Array.from(parent.children).indexOf(node) + 1 + ')');
      } else {
        parts.unshift(tag);
      }
    } else {
      parts.unshift(tag);
    }
    node = parent;
  }
  return parts.join(' > ');
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok({ selector, path: result.value });
}

// Get all sibling elements: tag, id, class, text snippet
export async function getSiblings(client: CdpClient, selector: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const parent = el.parentElement;
  if (!parent) return [];
  return Array.from(parent.children)
    .filter(c => c !== el)
    .map(c => ({
      tag: c.tagName.toLowerCase(),
      id: c.id || null,
      class: c.className || null,
      text: (c.textContent || '').trim().slice(0, 80) || null,
    }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok({ selector, siblings: result.value });
}

// Get parent element info: tag, id, class, childCount
export async function getParentElement(client: CdpClient, selector: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const parent = el.parentElement;
  if (!parent) return { noParent: true };
  return {
    tag: parent.tagName.toLowerCase(),
    id: parent.id || null,
    class: parent.className || null,
    childCount: parent.children.length,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  if (result.value === null || result.value === undefined) return err(`Element not found: ${selector}`);
  return ok({ selector, parent: result.value });
}

// Find all elements containing exact text (case-insensitive), return tag/id/class (max 10)
export async function getElementsByText(client: CdpClient, text: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const needle = ${JSON.stringify(text)}.toLowerCase();
  const all = Array.from(document.querySelectorAll('*'));
  const matches = [];
  for (const el of all) {
    if (matches.length >= 10) break;
    const t = (el.textContent || '').trim().toLowerCase();
    if (t === needle || t.includes(needle)) {
      matches.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: el.className || null,
        text: (el.textContent || '').trim().slice(0, 80),
      });
    }
  }
  return matches;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  return ok({ text, matches: result.value });
}

// Find all elements with a specific attribute name, return tag/id/value (max 20)
export async function getElementsWithAttribute(client: CdpClient, attribute: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const attr = ${JSON.stringify(attribute)};
  const all = Array.from(document.querySelectorAll('[' + attr + ']'));
  return all.slice(0, 20).map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    value: el.getAttribute(attr),
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  return ok({ attribute, matches: result.value });
}

// Count all element tags on page as {tag: count} object, sorted by count desc
export async function countElementsByTag(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const counts = {};
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [tag, count]) => { acc[tag] = count; return acc; }, {});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  return ok({ tagCounts: result.value });
}

// From all elements matching selector, return first one that is visible (not hidden/display:none)
export async function getFirstVisible(client: CdpClient, selector: string): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
  for (const el of els) {
    const style = window.getComputedStyle(el);
    if (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      el.offsetParent !== null
    ) {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class: el.className || null,
        text: (el.textContent || '').trim().slice(0, 80),
        rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      };
    }
  }
  return null;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  if (result.value === null || result.value === undefined) return err(`No visible element found for selector: ${selector}`);
  return ok({ selector, element: result.value });
}
