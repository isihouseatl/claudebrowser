// src/cdp/dom.ts
import { CdpClient } from './client';

// Set an attribute on an element
export async function setAttribute(
  client: CdpClient,
  selector: string,
  attribute: string,
  value: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const attrLiteral = JSON.stringify(attribute);
  const valLiteral = JSON.stringify(value);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.setAttribute(${attrLiteral}, ${valLiteral});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove an attribute from an element
export async function removeAttribute(
  client: CdpClient,
  selector: string,
  attribute: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const attrLiteral = JSON.stringify(attribute);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.removeAttribute(${attrLiteral});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Add a CSS class to an element
export async function addClass(
  client: CdpClient,
  selector: string,
  className: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const classLiteral = JSON.stringify(className);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.classList.add(${classLiteral});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Remove a CSS class from an element
export async function removeClass(
  client: CdpClient,
  selector: string,
  className: string,
): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const classLiteral = JSON.stringify(className);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.classList.remove(${classLiteral});
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Inject a <style> tag into the page. Returns a unique style ID so it can be removed later.
export async function injectCss(client: CdpClient, css: string): Promise<string> {
  const styleId = `cb-style-${Date.now()}`;
  const escapedCss = JSON.stringify(css);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const style = document.createElement('style');
  style.id = ${JSON.stringify(styleId)};
  style.textContent = ${escapedCss};
  document.head.appendChild(style);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return styleId;
}

// Remove a previously injected style by ID
export async function removeInjectedCss(client: CdpClient, styleId: string): Promise<void> {
  const idLiteral = JSON.stringify(styleId);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.getElementById(${idLiteral});
  if (el) el.remove();
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Submit a form element programmatically
export async function submitForm(client: CdpClient, selector: string): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  if (typeof el.requestSubmit === 'function') {
    el.requestSubmit();
  } else {
    el.submit();
  }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Reset a form to its default values
export async function resetForm(client: CdpClient, selector: string): Promise<void> {
  const selLiteral = JSON.stringify(selector);
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Not found: ' + ${selLiteral});
  el.reset();
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
