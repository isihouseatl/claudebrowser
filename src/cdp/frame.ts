// src/cdp/frame.ts
import { CdpClient } from './client';

export interface FrameInfo {
  id: string;       // CDP frameId
  url: string;
  name?: string;    // iframe name attribute
  parentId?: string;
}

// Per-client map: frameId -> contextId (for default execution contexts only)
const frameContextMaps = new WeakMap<CdpClient, Map<string, number>>();

// Per-client active frame state: frameId of the currently "active" frame, or undefined for main
const activeFrameMap = new WeakMap<CdpClient, string | undefined>();

function getFrameContextMap(client: CdpClient): Map<string, number> {
  let m = frameContextMaps.get(client);
  if (!m) {
    m = new Map();
    frameContextMaps.set(client, m);
  }
  return m;
}

// Start tracking execution contexts. Call once after CDP connects.
export function startFrameMonitor(client: CdpClient): void {
  const raw = client.raw;
  const map = getFrameContextMap(client);

  raw.Runtime.executionContextCreated(({ context }) => {
    // Only track default contexts — each frame gets exactly one default context
    if (context.auxData?.type === 'default' && context.auxData.frameId) {
      map.set(context.auxData.frameId as string, context.id);
    }
  });

  raw.Runtime.executionContextDestroyed(({ executionContextId }) => {
    for (const [frameId, ctxId] of map.entries()) {
      if (ctxId === executionContextId) {
        map.delete(frameId);
        // If this was the active frame, fall back to main
        if (activeFrameMap.get(client) === frameId) {
          activeFrameMap.set(client, undefined);
        }
        break;
      }
    }
  });
}

// Flatten the CDP frame tree into a list of FrameInfo
function flattenFrameTree(
  node: { frame: { id: string; url: string; name?: string; parentId?: string }; childFrames?: typeof node[] },
  results: FrameInfo[] = [],
): FrameInfo[] {
  const { frame, childFrames } = node;
  results.push({
    id: frame.id,
    url: frame.url,
    name: frame.name,
    parentId: frame.parentId,
  });
  if (childFrames) {
    for (const child of childFrames) {
      flattenFrameTree(child, results);
    }
  }
  return results;
}

// Returns all frames currently on the page
export async function getFrames(client: CdpClient): Promise<FrameInfo[]> {
  const raw = client.raw;
  const { frameTree } = await raw.Page.getFrameTree();
  return flattenFrameTree(frameTree);
}

// Resolve the frameId for an <iframe> element matched by a CSS selector.
// Uses DOM.describeNode which exposes node.frameId for iframe elements.
async function resolveFrameId(client: CdpClient, selector: string): Promise<string> {
  const raw = client.raw;

  const { root } = await raw.DOM.getDocument({ depth: 0 });
  const { nodeId } = await raw.DOM.querySelector({ nodeId: root.nodeId, selector });
  if (!nodeId) {
    throw new Error(`iframe not found for selector: ${selector}`);
  }

  const { node } = await raw.DOM.describeNode({ nodeId });
  const frameId = (node as unknown as { frameId?: string }).frameId;
  if (!frameId) {
    throw new Error(`No frameId on node matched by selector "${selector}". Is it an <iframe>?`);
  }

  return frameId;
}

// Execute JS in the frame containing the given iframe CSS selector.
// selector: a CSS selector for the <iframe> element in the parent document
// script: JS to execute inside that iframe's context
export async function evaluateInFrame(
  client: CdpClient,
  selector: string,
  script: string,
): Promise<unknown> {
  const raw = client.raw;
  const frameId = await resolveFrameId(client, selector);

  const map = getFrameContextMap(client);
  const contextId = map.get(frameId);
  if (contextId === undefined) {
    throw new Error(
      `No execution context found for frame "${frameId}" (selector: "${selector}"). ` +
      `Ensure startFrameMonitor() was called before the page loaded.`,
    );
  }

  const { result, exceptionDetails } = await raw.Runtime.evaluate({
    expression: script,
    contextId,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error in frame "${frameId}": ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  return result.value;
}

// Switch all subsequent evaluate/query operations to a frame.
// Returns the frameId for reference.
export async function switchToFrame(client: CdpClient, selector: string): Promise<string> {
  const frameId = await resolveFrameId(client, selector);

  const map = getFrameContextMap(client);
  if (!map.has(frameId)) {
    throw new Error(
      `No execution context found for frame "${frameId}" (selector: "${selector}"). ` +
      `Ensure startFrameMonitor() was called before the page loaded.`,
    );
  }

  activeFrameMap.set(client, frameId);
  return frameId;
}

// Switch back to the main frame context
export function switchToMainFrame(client: CdpClient): void {
  activeFrameMap.set(client, undefined);
}

// Get the current contextId to use for Runtime.evaluate
// Returns undefined for main frame (CDP uses main context by default)
export function getCurrentContextId(client: CdpClient): number | undefined {
  const frameId = activeFrameMap.get(client);
  if (frameId === undefined) return undefined;

  const map = getFrameContextMap(client);
  return map.get(frameId);
}
