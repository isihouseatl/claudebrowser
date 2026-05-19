// src/cdp/shadow.ts
import type { CdpClient } from './client';

// ---------------------------------------------------------------------------
// Legacy helpers (used by server.ts tool cases browser_query_shadow,
// browser_get_shadow_html, browser_evaluate_in_shadow)
// ---------------------------------------------------------------------------

// querySelector inside a shadow root.
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

// ---------------------------------------------------------------------------
// New inspection API (8 exported functions)
// ---------------------------------------------------------------------------

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. Find all elements with shadow roots. Returns array of {tag, id, class, mode}.
export async function getShadowHosts(client: CdpClient): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const all = Array.from(document.querySelectorAll('*'));
  const hosts = [];
  for (const el of all) {
    if (el.shadowRoot) {
      hosts.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || '',
        mode: el.shadowRoot.mode
      });
    }
  }
  return hosts;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  return ok(result.value ?? []);
}

// 2. Get shadow root info for a given host element: mode, delegatesFocus, childCount.
export async function getShadowRoot(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return { error: 'Element not found: ' + ${sel} };
  if (!el.shadowRoot) return { error: 'Element has no shadow root: ' + ${sel} };
  const sr = el.shadowRoot;
  return {
    mode: sr.mode,
    delegatesFocus: sr.delegatesFocus,
    childCount: sr.childNodes.length
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? null);
}

// 3. querySelector inside a shadow root. Returns {found, tag, id, class, text}.
export async function queryShadowRoot(client: CdpClient, selector: string, innerSelector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const inner = JSON.stringify(innerSelector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const host = document.querySelector(${sel});
  if (!host) return { found: false, error: 'Host not found: ' + ${sel} };
  if (!host.shadowRoot) return { found: false, error: 'No shadow root on: ' + ${sel} };
  const el = host.shadowRoot.querySelector(${inner});
  if (!el) return { found: false };
  return {
    found: true,
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    class: el.className || '',
    text: (el.textContent || '').trim().slice(0, 100)
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? { found: false });
}

// 4. List direct children of a shadow root: tag, id, class, text snippet.
export async function getShadowChildren(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const host = document.querySelector(${sel});
  if (!host) return { error: 'Element not found: ' + ${sel} };
  if (!host.shadowRoot) return { error: 'No shadow root on: ' + ${sel} };
  const children = Array.from(host.shadowRoot.children);
  return children.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    class: el.className || '',
    text: (el.textContent || '').trim().slice(0, 80)
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && !Array.isArray(val) && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? []);
}

// 5. Check if an element has a shadow root. Returns {isShadowHost, mode}.
export async function isShadowHost(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return { error: 'Element not found: ' + ${sel} };
  if (!el.shadowRoot) return { isShadowHost: false, mode: null };
  return { isShadowHost: true, mode: el.shadowRoot.mode };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? { isShadowHost: false, mode: null });
}

// 6. List <slot> elements inside a shadow root: name, assigned count.
export async function getShadowSlots(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const host = document.querySelector(${sel});
  if (!host) return { error: 'Element not found: ' + ${sel} };
  if (!host.shadowRoot) return { error: 'No shadow root on: ' + ${sel} };
  const slots = Array.from(host.shadowRoot.querySelectorAll('slot'));
  return slots.map(slot => ({
    name: slot.getAttribute('name') || '(default)',
    assignedCount: slot.assignedNodes({ flatten: false }).length
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && !Array.isArray(val) && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? []);
}

// 7. Get CSS custom properties (--var) computed on the shadow host element.
export async function getShadowCssVars(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return { error: 'Element not found: ' + ${sel} };
  const style = window.getComputedStyle(el);
  const vars = {};
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    if (prop.startsWith('--')) {
      vars[prop] = style.getPropertyValue(prop).trim();
    }
  }
  return vars;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && 'error' in val && !Object.keys(val).some(k => k.startsWith('--'))) {
    return err(val.error as string);
  }
  return ok(result.value ?? {});
}

// 8. Count how many shadow DOM levels deep an element is (0 = not in any shadow root).
export async function getShadowDepth(client: CdpClient, selector: string): Promise<ToolResult> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${sel});
  if (!el) return { error: 'Element not found: ' + ${sel} };
  let depth = 0;
  let node = el;
  while (node) {
    const root = node.getRootNode();
    if (root instanceof ShadowRoot) {
      depth++;
      node = root.host;
    } else {
      break;
    }
  }
  return { depth };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown JS error');
  }
  const val = result.value as { error?: string } | null;
  if (val && typeof val === 'object' && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value ?? { depth: 0 });
}
