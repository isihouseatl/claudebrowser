// src/cdp/xpathquery.ts
import { CdpClient } from './client';

export interface XPathNode {
  tagName: string;
  text: string;
  selector: string;
}

export async function xpathFirst(
  client: CdpClient,
  xpath: string,
): Promise<XPathNode | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(xpath)};
  const result = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const node = result.singleNodeValue;
  if (!node) return null;
  const el = node;
  const tagName = el.tagName ? el.tagName.toLowerCase() : el.nodeName.toLowerCase();
  const text = (el.textContent || '').slice(0, 100);
  let selector = tagName;
  if (el.id) {
    selector = '#' + el.id;
  } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
    selector = tagName + '.' + el.className.trim().split(/\s+/).join('.');
  }
  return { tagName, text, selector };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return null;
  }
  return result.value as XPathNode;
}

export async function xpathAll(
  client: CdpClient,
  xpath: string,
): Promise<XPathNode[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(xpath)};
  const iter = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  const nodes = [];
  let node;
  while ((node = iter.iterateNext()) !== null && nodes.length < 50) {
    const el = node;
    const tagName = el.tagName ? el.tagName.toLowerCase() : el.nodeName.toLowerCase();
    const text = (el.textContent || '').slice(0, 100);
    let selector = tagName;
    if (el.id) {
      selector = '#' + el.id;
    } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
      selector = tagName + '.' + el.className.trim().split(/\s+/).join('.');
    }
    nodes.push({ tagName, text, selector });
  }
  return nodes;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (!Array.isArray(result.value)) {
    return [];
  }
  return result.value as XPathNode[];
}

export async function xpathCount(
  client: CdpClient,
  xpath: string,
): Promise<number> {
  const countExpr = `count(${xpath})`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(countExpr)};
  const result = document.evaluate(xp, document, null, XPathResult.NUMBER_TYPE, null);
  return result.numberValue;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

export async function xpathText(
  client: CdpClient,
  xpath: string,
): Promise<string | null> {
  const stringExpr = `string(${xpath})`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(stringExpr)};
  const result = document.evaluate(xp, document, null, XPathResult.STRING_TYPE, null);
  return result.stringValue;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as string;
  if (val === '' || val === null || val === undefined) {
    return null;
  }
  return val;
}

export async function xpathExists(
  client: CdpClient,
  xpath: string,
): Promise<boolean> {
  const node = await xpathFirst(client, xpath);
  return node !== null;
}

export async function xpathClick(
  client: CdpClient,
  xpath: string,
): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(xpath)};
  const result = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const node = result.singleNodeValue;
  if (!node) return { found: false };
  node.click();
  return { found: true };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const res = result.value as { found: boolean };
  if (!res.found) {
    throw new Error(`xpathClick: no element found for xpath: ${xpath}`);
  }
}

export async function xpathGetAttribute(
  client: CdpClient,
  xpath: string,
  attributeName: string,
): Promise<string | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const xp = ${JSON.stringify(xpath)};
  const attr = ${JSON.stringify(attributeName)};
  const result = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const node = result.singleNodeValue;
  if (!node) return { found: false, value: null };
  const value = node.getAttribute ? node.getAttribute(attr) : null;
  return { found: true, value };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const res = result.value as { found: boolean; value: string | null };
  if (!res.found) {
    return null;
  }
  return res.value;
}

export async function xpathWaitFor(
  client: CdpClient,
  xpath: string,
  timeoutMs: number = 10000,
): Promise<XPathNode> {
  const interval = 300;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const node = await xpathFirst(client, xpath);
    if (node !== null) {
      return node;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(interval, remaining)));
  }
  throw new Error(`xpathWaitFor: timed out after ${timeoutMs}ms waiting for xpath: ${xpath}`);
}
