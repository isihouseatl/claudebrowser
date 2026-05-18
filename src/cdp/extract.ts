// src/cdp/extract.ts
import { CdpClient } from './client';

// Get innerHTML of an element (vs outerHTML from getDom)
export async function getInnerHtml(client: CdpClient, selector: string): Promise<string> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return null;
  return el.innerHTML;
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

// Extract a table as an array of row objects.
// Uses first row's <th> or <td> text as keys.
// Returns [] if table not found or has no rows.
export async function getTableData(
  client: CdpClient,
  selector: string,
): Promise<Record<string, string>[]> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return [];
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return [];
  const headers = Array.from(rows[0].querySelectorAll('th, td')).map(h => h.textContent?.trim() ?? '');
  return rows.slice(1).map(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i]?.textContent?.trim() ?? ''; });
    return obj;
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as Record<string, string>[];
}

// Take a screenshot clipped to a single element's bounding box.
// Returns base64-encoded PNG (same format as takeScreenshot).
export async function screenshotElement(client: CdpClient, selector: string): Promise<string> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  const rect = result.value as { x: number; y: number; width: number; height: number };
  if (rect.width === 0 || rect.height === 0) {
    throw new Error(`Element has zero area: ${selector}`);
  }
  const { data } = await client.raw.Page.captureScreenshot({
    clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
    format: 'png',
  });
  return data as string;
}
