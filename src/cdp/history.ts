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

// Returns history length and a preview of the current history state object.
// Renamed getHistoryLength3 to avoid collision with existing getHistoryLength (no state_preview)
// and getHistoryLength2 in url2.ts.
export async function getHistoryLength3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ length: window.history.length, state_preview: JSON.stringify(window.history.state).slice(0, 80) })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns session history metadata: length, scrollRestoration mode, and whether a state object exists.
export async function getSessionHistory(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ length: window.history.length, scrollRestoration: window.history.scrollRestoration, stateExists: window.history.state !== null })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the document referrer and whether one is present.
export async function getReferrer(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ referrer: document.referrer.slice(0, 80), hasReferrer: document.referrer.length > 0 })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the current page visibility state and hidden flag.
export async function getVisibilityState(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ visibilityState: document.visibilityState, hidden: document.hidden })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns page lifecycle indicators: readyState, navigation type, and loading phase flags.
export async function getPageLifecycle(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function(){ var rs = document.readyState; var navType = (performance.navigation && performance.navigation.type !== undefined) ? performance.navigation.type : null; return JSON.stringify({ readyState: rs, loading: rs === "loading", interactive: rs === "interactive", complete: rs === "complete", unloadPending: navType === 1, navigationType: navType }); })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns hints about back/forward cache eligibility based on unload and beforeunload listeners.
// Pages with these listeners set on window are typically ineligible for bfcache.
export async function getBfcacheEligibility(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ hasUnloadListener: typeof window.onunload === "function", hasBeforeUnloadListener: typeof window.onbeforeunload === "function", bfcacheBlocked: typeof window.onunload === "function" || typeof window.onbeforeunload === "function" })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns the current URL hash, count of hash-based anchor links, and whether the current hash target exists in the DOM.
export async function getHashNavigation(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function(){ var hash = window.location.hash; var hashLinks = document.querySelectorAll('a[href^="#"]').length; var targetExists = hash.length > 1 ? document.querySelector(hash) !== null : false; return JSON.stringify({ currentHash: hash.slice(0, 80), hashLinks_count: hashLinks, currentHashTarget: targetExists }); })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}

// Returns information about pushState API usage: availability, popstate listener, and current state type.
export async function getPushStateUsage(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ historyApiUsed: typeof window.history.pushState !== "undefined", hasPopstateListener: window.onpopstate !== null, stateType: window.history.state === null ? "null" : typeof window.history.state })`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return ok(result.value as string);
}
