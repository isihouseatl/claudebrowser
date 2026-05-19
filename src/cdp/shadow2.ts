// src/cdp/shadow2.ts
// Shadow DOM and iframe structure inspection via CDP Runtime.evaluate.
// No DOM lib — all DOM APIs are confined inside evaluate expression strings.
import { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ─── getShadowHosts2 ──────────────────────────────────────────────────────────
// Find all elements that have a shadow root: tag, id, class, shadowMode
// (open/closed). Max 20.
export async function getShadowHosts2(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var hosts = [];
      for (var i = 0; i < all.length && hosts.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          hosts.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class: el.className ? el.className.toString().slice(0, 30) : '',
            shadowMode: el.shadowRoot.mode
          });
        }
      }
      return hosts;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getShadowDOMContent ──────────────────────────────────────────────────────
// For each shadow host, get innerHTML preview of shadow root.
// Max 10 hosts, 200 chars each.
export async function getShadowDOMContent(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var hosts = [];
      for (var i = 0; i < all.length && hosts.length < 10; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          hosts.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            innerHTML_preview: el.shadowRoot.innerHTML.slice(0, 200)
          });
        }
      }
      return hosts;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getShadowDepth2 ──────────────────────────────────────────────────────────
// Get maximum shadow DOM nesting depth on the page.
// Returns { maxDepth, hostCount }.
export async function getShadowDepth2(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      function depth(root, d) {
        var hosts = Array.prototype.slice.call(root.querySelectorAll('*')).filter(function(el) { return el.shadowRoot; });
        var max = d;
        for (var i = 0; i < hosts.length; i++) {
          var sub = depth(hosts[i].shadowRoot, d + 1);
          if (sub > max) max = sub;
        }
        return max;
      }
      var hostCount = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function(el) { return el.shadowRoot; }).length;
      return { maxDepth: depth(document, 0), hostCount: hostCount };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { maxDepth: 0, hostCount: 0 });
}

// ─── getIframes3 ──────────────────────────────────────────────────────────────
// Find all iframes: src, id, name, width, height, isVisible, sandbox. Max 20.
export async function getIframes3(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'), 0, 20);
      return frames.map(function(f) {
        var r = f.getBoundingClientRect();
        return {
          src: f.src,
          id: f.id || '',
          name: f.name || '',
          width: Math.round(r.width),
          height: Math.round(r.height),
          isVisible: r.width > 0 && r.height > 0,
          sandbox: f.sandbox.toString() || null
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getIframeCount3 ──────────────────────────────────────────────────────────
// Count iframes: { total, visible, crossOrigin, sandboxed }.
export async function getIframeCount3(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
      var origin = location.origin;
      var visible = 0;
      var crossOrigin = 0;
      var sandboxed = 0;
      for (var i = 0; i < frames.length; i++) {
        var f = frames[i];
        var r = f.getBoundingClientRect();
        if (r.width > 0) visible++;
        try {
          if (f.src && !f.src.startsWith(origin) && !f.src.startsWith('/')) crossOrigin++;
        } catch(e) { crossOrigin++; }
        if (f.sandbox.length > 0) sandboxed++;
      }
      return { total: frames.length, visible: visible, crossOrigin: crossOrigin, sandboxed: sandboxed };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { total: 0, visible: 0, crossOrigin: 0, sandboxed: 0 });
}

// ─── getShadowStyles ──────────────────────────────────────────────────────────
// Get adopted stylesheets count and inline styles in shadow roots.
// Returns { tag, id, adoptedStyleSheetsCount, inlineStyleCount }[]. Max 10.
export async function getShadowStyles(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var hosts = [];
      for (var i = 0; i < all.length && hosts.length < 10; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          hosts.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            adoptedStyleSheetsCount: (el.shadowRoot.adoptedStyleSheets || []).length,
            inlineStyleCount: el.shadowRoot.querySelectorAll('[style]').length
          });
        }
      }
      return hosts;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getOpenShadowRoots ───────────────────────────────────────────────────────
// Get elements with open shadow roots and list their direct children.
// Returns { tag, id, childTags[] }[]. Max 10.
export async function getOpenShadowRoots(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var hosts = [];
      for (var i = 0; i < all.length && hosts.length < 10; i++) {
        var el = all[i];
        if (el.shadowRoot && el.shadowRoot.mode === 'open') {
          hosts.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            childTags: Array.prototype.slice.call(el.shadowRoot.children).map(function(c) {
              return c.tagName.toLowerCase();
            })
          });
        }
      }
      return hosts;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getNestedShadowHosts ─────────────────────────────────────────────────────
// Find shadow hosts that themselves live inside a shadow root (nested).
// Returns { tag, id, depth }[]. Max 20.
export async function getNestedShadowHosts(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      function findNested(root, depth, results) {
        var hosts = Array.prototype.slice.call(root.querySelectorAll('*')).filter(function(el) { return el.shadowRoot; });
        for (var i = 0; i < hosts.length; i++) {
          var h = hosts[i];
          if (depth > 0) results.push({ tag: h.tagName.toLowerCase(), id: h.id || '', depth: depth });
          findNested(h.shadowRoot, depth + 1, results);
        }
        return results;
      }
      return findNested(document, 0, []).slice(0, 20);
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}
