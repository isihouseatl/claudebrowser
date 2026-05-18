// src/cdp/dom2.ts
import { CdpClient } from './client';

// Create a new element with given tag, optional attributes, optional text content,
// and append it to the parent element matched by parentSelector.
export async function createElement(
  client: CdpClient,
  parentSelector: string,
  tag: string,
  attrs?: Record<string, string>,
  text?: string,
): Promise<void> {
  const parentSelLiteral = JSON.stringify(parentSelector);
  const tagLiteral = JSON.stringify(tag);
  const attrsLiteral = JSON.stringify(attrs ?? {});
  const textLiteral = JSON.stringify(text ?? null);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const parent = document.querySelector(${parentSelLiteral});
  if (!parent) throw new Error('Parent not found: ' + ${parentSelLiteral});
  const el = document.createElement(${tagLiteral});
  const attrs = ${attrsLiteral};
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  const text = ${textLiteral};
  if (text !== null) {
    el.textContent = text;
  }
  parent.appendChild(el);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove the first element matching selector from the DOM.
// Returns true if found and removed, false if no matching element exists.
export async function removeElement(
  client: CdpClient,
  selector: string,
): Promise<boolean> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return false;
  el.remove();
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

// Wrap the first element matching selector in a new wrapper element of wrapperTag,
// with an optional class applied to the wrapper.
export async function wrapElement(
  client: CdpClient,
  selector: string,
  wrapperTag: string,
  wrapperClass?: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const tagLiteral = JSON.stringify(wrapperTag);
  const classLiteral = JSON.stringify(wrapperClass ?? null);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const wrapper = document.createElement(${tagLiteral});
  const cls = ${classLiteral};
  if (cls !== null) {
    wrapper.className = cls;
  }
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Unwrap element: replace the parent of the first matching element with all of
// the parent's children (i.e. move all siblings before the parent, then remove it).
export async function unwrapElement(
  client: CdpClient,
  selector: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const parent = el.parentNode;
  if (!parent) throw new Error('Element has no parent');
  const grandparent = parent.parentNode;
  if (!grandparent) throw new Error('Parent has no parent');
  while (parent.firstChild) {
    grandparent.insertBefore(parent.firstChild, parent);
  }
  grandparent.removeChild(parent);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Clone the first element matching selector (deep clone) and append it to
// the element matching targetParentSelector.
export async function cloneElement(
  client: CdpClient,
  selector: string,
  targetParentSelector: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const targetLiteral = JSON.stringify(targetParentSelector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const target = document.querySelector(${targetLiteral});
  if (!target) throw new Error('Target not found: ' + ${targetLiteral});
  target.appendChild(el.cloneNode(true));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Move (not clone) the first element matching selector to targetParentSelector
// using appendChild.
export async function moveElement(
  client: CdpClient,
  selector: string,
  targetParentSelector: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const targetLiteral = JSON.stringify(targetParentSelector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  const target = document.querySelector(${targetLiteral});
  if (!target) throw new Error('Target not found: ' + ${targetLiteral});
  target.appendChild(el);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Set the textContent of the first element matching selector.
export async function setElementText(
  client: CdpClient,
  selector: string,
  text: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const textLiteral = JSON.stringify(text);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.textContent = ${textLiteral};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Return the count of all elements in the document matching selector
// (equivalent to document.querySelectorAll(selector).length).
export async function getElementCount(
  client: CdpClient,
  selector: string,
): Promise<number> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.querySelectorAll(${selLiteral}).length`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}
