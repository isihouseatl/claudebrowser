// src/cdp/iframe.ts
import { CdpClient } from './client';

export interface IframeInfo {
  frameId: string;
  url: string;
  name?: string;
  parentFrameId?: string;
}

// Internal shape from CDP Page.getFrameTree
interface FrameNode {
  frame: {
    id: string;
    url: string;
    name?: string;
    parentId?: string;
  };
  childFrames?: FrameNode[];
}

// Internal shape from Runtime.executionContexts
interface ExecutionContextDescription {
  id: number;
  auxData?: {
    frameId?: string;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Walk the frame tree recursively, collecting all non-root frames as IframeInfo
function collectIframes(node: FrameNode, results: IframeInfo[] = []): IframeInfo[] {
  const { frame, childFrames } = node;
  // Only include frames that have a parent (i.e. not the main/root frame)
  if (frame.parentId !== undefined) {
    results.push({
      frameId: frame.id,
      url: frame.url,
      name: frame.name,
      parentFrameId: frame.parentId,
    });
  }
  if (childFrames) {
    for (const child of childFrames) {
      collectIframes(child, results);
    }
  }
  return results;
}

// Walk the frame tree looking for a frame whose id === frameIdOrUrl
// or whose url contains frameIdOrUrl as a substring
function searchFrame(node: FrameNode, frameIdOrUrl: string): FrameNode | null {
  if (node.frame.id === frameIdOrUrl || node.frame.url.includes(frameIdOrUrl)) {
    return node;
  }
  if (node.childFrames) {
    for (const child of node.childFrames) {
      const found = searchFrame(child, frameIdOrUrl);
      if (found) return found;
    }
  }
  return null;
}

// Find a frame node by frameId or URL substring
async function findFrame(client: CdpClient, frameIdOrUrl: string): Promise<FrameNode | null> {
  const { frameTree } = await (client.raw.Page as any).getFrameTree() as { frameTree: FrameNode };
  return searchFrame(frameTree, frameIdOrUrl);
}

// Resolve the execution contextId for a given frameId.
// Prefers the "default" context type; falls back to any context for that frame.
async function getContextIdForFrame(
  client: CdpClient,
  frameId: string,
): Promise<number> {
  const { executionContexts } = await (client.raw.Runtime as any).executionContexts() as {
    executionContexts: ExecutionContextDescription[];
  };

  // Prefer default context
  let contextId: number | undefined;
  for (const ctx of executionContexts) {
    if (ctx.auxData?.frameId === frameId) {
      if (ctx.auxData?.type === 'default') {
        return ctx.id;
      }
      // Keep as fallback
      contextId = ctx.id;
    }
  }

  if (contextId !== undefined) return contextId;

  throw new Error(
    `No execution context found for frame "${frameId}". ` +
    `Make sure the iframe is fully loaded and Runtime is enabled.`,
  );
}

// --- Public API ---

/**
 * Returns metadata for all iframes on the page (excludes the main frame).
 */
export async function listIframes(client: CdpClient): Promise<IframeInfo[]> {
  const { frameTree } = await (client.raw.Page as any).getFrameTree() as { frameTree: FrameNode };
  return collectIframes(frameTree);
}

/**
 * Evaluate a JS expression inside a specific iframe identified by frameId or URL substring.
 * Returns the result value.
 */
export async function evaluateInIframe(
  client: CdpClient,
  frameIdOrUrl: string,
  expression: string,
): Promise<unknown> {
  const node = await findFrame(client, frameIdOrUrl);
  if (!node) {
    throw new Error(`iframe not found: "${frameIdOrUrl}"`);
  }

  const contextId = await getContextIdForFrame(client, node.frame.id);

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    contextId,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error in iframe "${frameIdOrUrl}": ` +
      (exceptionDetails.exception?.description ?? exceptionDetails.text),
    );
  }

  return result.value;
}

/**
 * Returns the full outer HTML of an iframe's document.
 */
export async function getIframeContent(
  client: CdpClient,
  frameIdOrUrl: string,
): Promise<string> {
  const html = await evaluateInIframe(
    client,
    frameIdOrUrl,
    'document.documentElement.outerHTML',
  );
  return html as string;
}

/**
 * Click an element matching `selector` inside a specific iframe.
 */
export async function clickInIframe(
  client: CdpClient,
  frameIdOrUrl: string,
  selector: string,
): Promise<void> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
    el.click();
  })()`;

  await evaluateInIframe(client, frameIdOrUrl, expression);
}

/**
 * Focus an input element and set its value via native setter + synthetic events,
 * then use Input.insertText to simulate realistic typing.
 */
export async function typeInIframe(
  client: CdpClient,
  frameIdOrUrl: string,
  selector: string,
  text: string,
): Promise<void> {
  // Step 1: focus the element inside the iframe context
  const focusExpression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
    el.focus();
    return true;
  })()`;

  await evaluateInIframe(client, frameIdOrUrl, focusExpression);

  // Step 2: insert the text via Input.insertText (works on the focused element)
  await (client.raw.Input as any).insertText({ text });
}

/**
 * Poll until an iframe whose URL matches `urlPattern` (substring) appears.
 * Resolves with the IframeInfo once found, or rejects after `timeoutMs` (default 10000ms).
 */
export async function waitForIframe(
  client: CdpClient,
  urlPattern: string,
  timeoutMs: number = 10000,
): Promise<IframeInfo> {
  const interval = 300;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const iframes = await listIframes(client);
    const match = iframes.find(f => f.url.includes(urlPattern));
    if (match) return match;
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error(
    `waitForIframe: no iframe matching "${urlPattern}" appeared within ${timeoutMs}ms`,
  );
}
