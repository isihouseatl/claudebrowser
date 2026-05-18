// src/cdp/query.ts
import { CdpClient } from './client';

export async function getText(client: CdpClient, selector: string): Promise<string> {
  const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector('${escaped}');
  if (!el) return null;
  return el.innerText;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as string;
}

export async function getAttribute(
  client: CdpClient,
  selector: string,
  attribute: string,
): Promise<string | null> {
  const escapedSel = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedAttr = attribute.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector('${escapedSel}');
  if (!el) return { found: false, value: null };
  const val = el.getAttribute('${escapedAttr}');
  return { found: true, value: val };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const res = result.value as { found: boolean; value: string | null };
  if (!res.found) {
    throw new Error(`Element not found: ${selector}`);
  }
  return res.value;
}

export async function isVisible(client: CdpClient, selector: string): Promise<boolean> {
  const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector('${escaped}');
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

export interface TextMatch {
  tag: string;
  text: string;
  x: number;
  y: number;
}

export async function findText(client: CdpClient, text: string): Promise<TextMatch[]> {
  const escaped = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const needle = '${escaped}'.toLowerCase();
  const matches = [];
  const elements = document.querySelectorAll('*');
  for (const el of elements) {
    if (matches.length >= 20) break;
    if (!el.innerText?.toLowerCase().includes(needle)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    matches.push({
      tag: el.tagName.toLowerCase(),
      text: el.innerText,
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    });
  }
  return matches;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as TextMatch[];
}
