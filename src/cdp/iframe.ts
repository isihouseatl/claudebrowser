// src/cdp/iframe.ts
import { CdpClient } from './client';

// ── Legacy types (used by listIframes / evaluateInIframe / waitForIframe) ─────

export interface IframeInfo {
  frameId: string;
  url: string;
  name?: string;
  parentFrameId?: string;
}

interface FrameNode {
  frame: {
    id: string;
    url: string;
    name?: string;
    parentId?: string;
  };
  childFrames?: FrameNode[];
}

interface ExecutionContextDescription {
  id: number;
  auxData?: {
    frameId?: string;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function collectIframes(node: FrameNode, results: IframeInfo[] = []): IframeInfo[] {
  const { frame, childFrames } = node;
  if (frame.parentId !== undefined) {
    results.push({ frameId: frame.id, url: frame.url, name: frame.name, parentFrameId: frame.parentId });
  }
  if (childFrames) {
    for (const child of childFrames) collectIframes(child, results);
  }
  return results;
}

function searchFrame(node: FrameNode, frameIdOrUrl: string): FrameNode | null {
  if (node.frame.id === frameIdOrUrl || node.frame.url.includes(frameIdOrUrl)) return node;
  if (node.childFrames) {
    for (const child of node.childFrames) {
      const found = searchFrame(child, frameIdOrUrl);
      if (found) return found;
    }
  }
  return null;
}

async function findFrame(client: CdpClient, frameIdOrUrl: string): Promise<FrameNode | null> {
  const { frameTree } = await (client.raw.Page as any).getFrameTree() as { frameTree: FrameNode };
  return searchFrame(frameTree, frameIdOrUrl);
}

async function getContextIdForFrame(client: CdpClient, frameId: string): Promise<number> {
  const { executionContexts } = await (client.raw.Runtime as any).executionContexts() as {
    executionContexts: ExecutionContextDescription[];
  };
  let contextId: number | undefined;
  for (const ctx of executionContexts) {
    if (ctx.auxData?.frameId === frameId) {
      if (ctx.auxData?.type === 'default') return ctx.id;
      contextId = ctx.id;
    }
  }
  if (contextId !== undefined) return contextId;
  throw new Error(`No execution context found for frame "${frameId}".`);
}

// ── Legacy exports (consumed by server.ts) ────────────────────────────────────

export async function listIframes(client: CdpClient): Promise<IframeInfo[]> {
  const { frameTree } = await (client.raw.Page as any).getFrameTree() as { frameTree: FrameNode };
  return collectIframes(frameTree);
}

export async function evaluateInIframe(
  client: CdpClient,
  frameIdOrUrl: string,
  expression: string,
): Promise<unknown> {
  const node = await findFrame(client, frameIdOrUrl);
  if (!node) throw new Error(`iframe not found: "${frameIdOrUrl}"`);
  const contextId = await getContextIdForFrame(client, node.frame.id);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    contextId,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in iframe "${frameIdOrUrl}": ` + (exceptionDetails.exception?.description ?? exceptionDetails.text));
  }
  return result.value;
}

export async function getIframeContent(client: CdpClient, frameIdOrUrl: string): Promise<string> {
  return evaluateInIframe(client, frameIdOrUrl, 'document.documentElement.outerHTML') as Promise<string>;
}

export async function clickInIframe(client: CdpClient, frameIdOrUrl: string, selector: string): Promise<void> {
  await evaluateInIframe(client, frameIdOrUrl, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
    el.click();
  })()`);
}

export async function typeInIframe(client: CdpClient, frameIdOrUrl: string, selector: string, text: string): Promise<void> {
  await evaluateInIframe(client, frameIdOrUrl, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
    el.focus();
    return true;
  })()`);
  await (client.raw.Input as any).insertText({ text });
}

export async function waitForIframe(client: CdpClient, urlPattern: string, timeoutMs = 10000): Promise<IframeInfo> {
  const interval = 300;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const iframes = await listIframes(client);
    const match = iframes.find(f => f.url.includes(urlPattern));
    if (match) return match;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`waitForIframe: no iframe matching "${urlPattern}" appeared within ${timeoutMs}ms`);
}

// ── New MCP tool helpers ───────────────────────────────────────────────────────

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

/**
 * List all iframes on the page with index, src, name, id, width, height, sandbox.
 */
export async function getIframes(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  return JSON.stringify([...document.querySelectorAll('iframe')].map(function(f, i) {
    return {
      index: i,
      src: f.src,
      name: f.name,
      id: f.id,
      width: f.width,
      height: f.height,
      sandbox: f.sandbox.toString()
    };
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Return the count of iframes on the page.
 */
export async function getIframeCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  return JSON.stringify({ count: document.querySelectorAll('iframe').length });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as string);
}

/**
 * Check whether the iframe matching `selector` has a sandbox attribute.
 */
export async function isIframeSandboxed(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({ sandboxed: el.hasAttribute('sandbox'), value: el.getAttribute('sandbox') || '' });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Get the src of the iframe matching `selector`.
 */
export async function getIframeSrc(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({ src: el.src });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Set the src of the iframe matching `selector`.
 */
export async function setIframeSrc(
  client: CdpClient,
  selector: string,
  src: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.src = ${JSON.stringify(src)};
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok('Source set');
}

/**
 * Scroll the iframe matching `selector` into view.
 */
export async function scrollIframeIntoView(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok('Scrolled into view');
}

/**
 * Get the bounding rect position of the iframe matching `selector`.
 */
export async function getIframePosition(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var r = el.getBoundingClientRect();
  return JSON.stringify({ x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok(result.value as string);
}

/**
 * Check whether the iframe matching `selector` is visible in the page.
 */
export async function isIframeVisible(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return JSON.stringify({
    visible: el.offsetParent !== null &&
             el.offsetWidth > 0 &&
             el.offsetHeight > 0 &&
             getComputedStyle(el).visibility !== 'hidden' &&
             getComputedStyle(el).display !== 'none'
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  if (result.value === null) {
    return err('Element not found');
  }
  return ok(result.value as string);
}
