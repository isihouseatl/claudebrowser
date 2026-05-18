// src/cdp/shadow.ts
import { CdpClient } from './client';

// querySelector inside a shadow root.
// hostSelector: CSS selector for the host element (the element with shadow DOM)
// shadowSelector: CSS selector to run inside the shadow root
// Returns the outer HTML of the found element, or null if not found.
export async function queryShadow(
  client: CdpClient,
  hostSelector: string,
  shadowSelector: string,
): Promise<string | null> {
  const hostSel = JSON.stringify(hostSelector);
  const shadowSel = JSON.stringify(shadowSelector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const host = document.querySelector(${hostSel});
  if (!host || !host.shadowRoot) return null;
  const el = host.shadowRoot.querySelector(${shadowSel});
  return el ? el.outerHTML : null;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? null) as string | null;
}

// Get the innerHTML of a shadow root.
export async function getShadowHtml(client: CdpClient, hostSelector: string): Promise<string> {
  const hostSel = JSON.stringify(hostSelector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const host = document.querySelector(${hostSel});
  if (!host) throw new Error('Host element not found: ' + ${hostSel});
  if (!host.shadowRoot) throw new Error('Element has no shadow root: ' + ${hostSel});
  return host.shadowRoot.innerHTML;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Shadow root returned no content for host: ${hostSelector}`);
  }
  return result.value as string;
}

// Evaluate JavaScript inside a shadow root context.
// The script is expected to be a function expression or arrow function that accepts
// (shadowRoot: ShadowRoot, host: Element) as arguments.
// Example: `(shadowRoot, host) => shadowRoot.querySelector('input')?.value`
export async function evaluateInShadow(
  client: CdpClient,
  hostSelector: string,
  script: string,
): Promise<unknown> {
  const hostEsc = JSON.stringify(hostSelector);
  const expr = `(() => { const host = document.querySelector(${hostEsc}); if (!host || !host.shadowRoot) return null; const shadowRoot = host.shadowRoot; return (${script})(shadowRoot, host); })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: expr,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value ?? null;
}
