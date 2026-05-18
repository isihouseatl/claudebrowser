// src/cdp/element.ts
import { CdpClient } from './client';

// Returns true if element is not disabled
export async function isEnabled(client: CdpClient, selector: string): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return !el.disabled;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as boolean;
}

// Returns true if checkbox or radio is checked
export async function isChecked(client: CdpClient, selector: string): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return !!el.checked;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as boolean;
}

// Returns bounding box {x, y, width, height} of element
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getBoundingBox(client: CdpClient, selector: string): Promise<BoundingBox> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
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
  return result.value as BoundingBox;
}

// Returns count of elements matching selector
export async function countElements(client: CdpClient, selector: string): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.querySelectorAll(${JSON.stringify(selector)}).length`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

// Returns computed CSS property value for an element
export async function getComputedStyle(
  client: CdpClient,
  selector: string,
  property: string,
): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return window.getComputedStyle(el).getPropertyValue(${JSON.stringify(property)});
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

// Selects an option in a <select> element.
// value can be option value attribute, label text, or numeric index (as string).
// After selecting, dispatches change and input events.
export async function selectOption(
  client: CdpClient,
  selector: string,
  value: string,
): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { found: false, selected: false };
  const options = Array.from(el.options);
  // Try matching by value attribute
  let match = options.find(o => o.value === ${JSON.stringify(value)});
  // Try matching by visible label text
  if (!match) match = options.find(o => o.textContent.trim() === ${JSON.stringify(value)});
  // Try matching by numeric index
  if (!match) {
    const idx = parseInt(${JSON.stringify(value)}, 10);
    if (!isNaN(idx) && idx >= 0 && idx < options.length) match = options[idx];
  }
  if (!match) return { found: true, selected: false };
  el.value = match.value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return { found: true, selected: true };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const res = result.value as { found: boolean; selected: boolean };
  if (!res.found) {
    throw new Error(`Element not found: ${selector}`);
  }
  if (!res.selected) {
    throw new Error(`Option not found in select ${selector}: ${value}`);
  }
}

// Returns all options in a <select> element
export interface SelectOption {
  value: string;
  label: string;
  selected: boolean;
}

export async function getSelectOptions(
  client: CdpClient,
  selector: string,
): Promise<SelectOption[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return Array.from(el.options).map(o => ({
    value: o.value,
    label: o.textContent.trim(),
    selected: o.selected,
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as SelectOption[];
}
