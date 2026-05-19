// src/cdp/history.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// Returns the number of entries in the browser's session history stack.
export async function getHistoryLength(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ length: window.history.length })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Navigates the browser one step back in the session history.
export async function goBack(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.history.back()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('Navigated back');
}

// Navigates the browser one step forward in the session history.
export async function goForward(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.history.forward()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('Navigated forward');
}

// Navigates the browser by delta steps in the session history.
// Positive values go forward, negative values go back.
export async function goTo(
  client: CdpClient,
  delta: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.history.go(${delta})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('Navigated by ' + delta);
}

// Returns the current page URL as { url: string }.
export async function getCurrentUrl(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ url: window.location.href })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the current page title as { title: string }.
export async function getPageTitle(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ title: document.title })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Pushes a new entry onto the session history stack without navigating.
export async function pushHistoryState(
  client: CdpClient,
  url: string,
  title: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.history.pushState({}, ${JSON.stringify(title)}, ${JSON.stringify(url)})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('State pushed');
}

// Replaces the current entry in the session history stack without navigating.
export async function replaceHistoryState(
  client: CdpClient,
  url: string,
  title: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.history.replaceState({}, ${JSON.stringify(title)}, ${JSON.stringify(url)})`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok('State replaced');
}
