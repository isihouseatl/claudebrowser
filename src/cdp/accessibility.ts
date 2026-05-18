// src/cdp/accessibility.ts
import { CdpClient } from './client';

export interface AXNode {
  nodeId: string;
  role: string;
  name: string;
  description?: string;
  value?: string;
  level?: number;      // for headings
  checked?: boolean;   // for checkboxes
  expanded?: boolean;  // for comboboxes/trees
  focused?: boolean;
  required?: boolean;
  disabled?: boolean;
  children: AXNode[];
}

// Raw CDP AX node shape returned by getFullAXTree
interface RawAXNode {
  nodeId: string;
  role?: { value?: string };
  name?: { value?: string };
  description?: { value?: string };
  value?: { value?: string };
  properties?: Array<{ name: string; value: { value?: unknown } }>;
  childIds?: string[];
  parentId?: string;
  backendDOMNodeId?: number;
}

// Pluck a named property value from the CDP properties array
function getProp(node: RawAXNode, propName: string): unknown {
  return node.properties?.find(p => p.name === propName)?.value?.value;
}

// Convert a flat list of RawAXNodes into a map keyed by nodeId
function buildNodeMap(rawNodes: RawAXNode[]): Map<string, RawAXNode> {
  const map = new Map<string, RawAXNode>();
  for (const n of rawNodes) {
    map.set(n.nodeId, n);
  }
  return map;
}

// Convert one RawAXNode (and its descendants) into our AXNode tree
function toAXNode(raw: RawAXNode, nodeMap: Map<string, RawAXNode>): AXNode {
  const role = raw.role?.value ?? 'unknown';
  const name = raw.name?.value ?? '';

  const node: AXNode = {
    nodeId: raw.nodeId,
    role,
    name,
    children: [],
  };

  const description = raw.description?.value;
  if (description) node.description = description;

  const value = raw.value?.value;
  if (value !== undefined && value !== null) node.value = String(value);

  const level = getProp(raw, 'level');
  if (typeof level === 'number') node.level = level;

  const checked = getProp(raw, 'checked');
  if (checked !== undefined) node.checked = checked === 'true' || checked === true;

  const expanded = getProp(raw, 'expanded');
  if (expanded !== undefined) node.expanded = expanded === 'true' || expanded === true;

  const focused = getProp(raw, 'focused');
  if (focused !== undefined) node.focused = focused === 'true' || focused === true;

  const required = getProp(raw, 'required');
  if (required !== undefined) node.required = required === 'true' || required === true;

  const disabled = getProp(raw, 'disabled');
  if (disabled !== undefined) node.disabled = disabled === 'true' || disabled === true;

  if (raw.childIds && raw.childIds.length > 0) {
    for (const childId of raw.childIds) {
      const childRaw = nodeMap.get(childId);
      if (childRaw) {
        node.children.push(toAXNode(childRaw, nodeMap));
      }
    }
  }

  return node;
}

// Fetch the full AX tree as a map and the root node id
async function fetchFullTree(client: CdpClient): Promise<{ nodeMap: Map<string, RawAXNode>; roots: RawAXNode[] }> {
  const { nodes } = await (client.raw.Accessibility as any).getFullAXTree();
  const rawNodes = nodes as RawAXNode[];
  const nodeMap = buildNodeMap(rawNodes);

  // Root nodes are those with no parent in the tree (parentId absent or not in map)
  const childIds = new Set<string>();
  for (const n of rawNodes) {
    if (n.childIds) {
      for (const id of n.childIds) childIds.add(id);
    }
  }
  const roots = rawNodes.filter(n => !childIds.has(n.nodeId));

  return { nodeMap, roots };
}

// Flatten a tree of AXNodes into a list (depth-first)
function flattenAXTree(node: AXNode): AXNode[] {
  const result: AXNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenAXTree(child));
  }
  return result;
}

// Get a focused subtree rooted at the element matching selector.
// Returns the AX subtree for that element, or null if not found.
export async function getAxSubtree(client: CdpClient, selector: string): Promise<AXNode | null> {
  // Resolve the backendNodeId for the selector via DOM
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return true; // just confirm existence
})()`,
    returnByValue: true,
  });

  if (exceptionDetails || result.value === null || result.value === undefined) {
    return null;
  }

  // Try Accessibility.queryAXTree first (Chrome 92+), fall back to full tree filter
  try {
    const domResult = await client.raw.DOM.querySelector({
      nodeId: (await client.raw.DOM.getDocument({ depth: 0 })).root.nodeId,
      selector,
    });
    const backendNodeId = domResult.nodeId;

    const queryResult = await (client.raw.Accessibility as any).queryAXTree({ backendNodeId });
    const rawNodes = queryResult.nodes as RawAXNode[];
    if (rawNodes && rawNodes.length > 0) {
      const nodeMap = buildNodeMap(rawNodes);
      const childIds = new Set<string>();
      for (const n of rawNodes) {
        if (n.childIds) {
          for (const id of n.childIds) childIds.add(id);
        }
      }
      const root = rawNodes.find(n => !childIds.has(n.nodeId));
      if (root) return toAXNode(root, nodeMap);
    }
  } catch {
    // queryAXTree not available — fall through to full tree search
  }

  // Fallback: get full tree and find by selector match via name/role heuristic
  // We use DOM.getDocument + performSearch to get the backendNodeId then match
  const { nodeMap, roots } = await fetchFullTree(client);
  const allNodes = roots.flatMap(r => {
    const tree = toAXNode(r, nodeMap);
    return flattenAXTree(tree);
  });

  // Try to match by evaluating the selector and checking backendDOMNodeId
  const { result: nodeResult } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  // Return a unique marker we can match: tag + id + class + text snippet
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    text: (el.textContent || '').trim().slice(0, 60),
    role: el.getAttribute('role') || '',
    ariaLabel: el.getAttribute('aria-label') || '',
  };
})()`,
    returnByValue: true,
  });

  if (!nodeResult.value) return null;

  const hint = nodeResult.value as { tag: string; id: string; text: string; role: string; ariaLabel: string };

  // Use ariaLabel or id as the best name match
  const targetName = hint.ariaLabel || hint.id || hint.text;
  if (targetName) {
    const matched = allNodes.find(n => n.name === targetName);
    if (matched) return matched;
  }

  // Last resort: match by role derived from tag/role attribute
  const roleGuess = hint.role || hint.tag;
  const byRole = allNodes.filter(n => n.role.toLowerCase() === roleGuess.toLowerCase());
  if (byRole.length === 1) return byRole[0];

  return null;
}

// Get the currently focused element's accessibility info.
// Returns null if no focused element or the focused element has no AX node.
export async function getFocusedElement(client: CdpClient): Promise<AXNode | null> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  return {
    tag: el.tagName.toLowerCase(),
    ariaLabel: el.getAttribute('aria-label') || '',
    id: el.id || '',
    text: (el.textContent || el.value || '').trim().slice(0, 80),
    role: el.getAttribute('role') || '',
  };
})()`,
    returnByValue: true,
  });

  if (exceptionDetails || !result.value) return null;

  const hint = result.value as { tag: string; ariaLabel: string; id: string; text: string; role: string };

  // Try getFocusedContext CDP method if available
  try {
    const focusResult = await (client.raw.Accessibility as any).getAXNodeAndAncestors({ objectId: undefined });
    const rawNodes = focusResult?.nodes as RawAXNode[] | undefined;
    if (rawNodes && rawNodes.length > 0) {
      const nodeMap = buildNodeMap(rawNodes);
      const childIds = new Set<string>();
      for (const n of rawNodes) {
        if (n.childIds) for (const id of n.childIds) childIds.add(id);
      }
      // The focused node is the leaf (has no children that are also in the result set)
      const leaf = rawNodes.find(n => !n.childIds?.some(id => nodeMap.has(id)));
      if (leaf) return toAXNode(leaf, nodeMap);
    }
  } catch {
    // Not available — fall through
  }

  // Fallback: scan full tree for a focused node
  const { nodeMap, roots } = await fetchFullTree(client);
  const allTrees = roots.map(r => toAXNode(r, nodeMap));
  const allNodes = allTrees.flatMap(flattenAXTree);

  // Look for nodes marked focused=true
  const focused = allNodes.find(n => n.focused === true);
  if (focused) return focused;

  // Match by name from hint
  const targetName = hint.ariaLabel || hint.id || hint.text;
  if (targetName) {
    const matched = allNodes.find(n => n.name === targetName);
    if (matched) return matched;
  }

  return null;
}

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'searchbox',
  'checkbox',
  'radio',
  'combobox',
  'listbox',
  'option',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'switch',
  'tab',
  'treeitem',
  'slider',
  'spinbutton',
  'scrollbar',
  'columnheader',
  'rowheader',
]);

// Get all interactive AX nodes (buttons, links, textboxes, checkboxes, etc.)
// Excludes disabled nodes by default.
export async function getInteractiveAxNodes(client: CdpClient): Promise<AXNode[]> {
  const { nodes } = await (client.raw.Accessibility as any).getFullAXTree();
  const rawNodes = nodes as RawAXNode[];
  const nodeMap = buildNodeMap(rawNodes);

  const childIds = new Set<string>();
  for (const n of rawNodes) {
    if (n.childIds) for (const id of n.childIds) childIds.add(id);
  }
  const roots = rawNodes.filter(n => !childIds.has(n.nodeId));

  const allNodes = roots.flatMap(r => flattenAXTree(toAXNode(r, nodeMap)));

  return allNodes.filter(n => INTERACTIVE_ROLES.has(n.role) && !n.disabled);
}

// Get ARIA live region content (role: 'status', 'alert', 'log')
export async function getLiveRegions(client: CdpClient): Promise<Array<{ role: string; text: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const selectors = '[role="alert"],[role="status"],[role="log"]';
  const elements = Array.from(document.querySelectorAll(selectors));
  return elements.map(el => ({
    role: el.getAttribute('role') || '',
    text: (el.textContent || '').trim(),
  })).filter(item => item.text.length > 0);
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  if (!Array.isArray(result.value)) return [];

  return result.value as Array<{ role: string; text: string }>;
}
