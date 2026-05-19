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

// =============================================================================
// NEW FUNCTIONS — Shadow DOM / Web Components inspection
// =============================================================================

// ─── getShadowHostElements2 ───────────────────────────────────────────────────
// Elements that have a shadowRoot (renamed: getShadowHostElements conflicts
// with shadow-dom.ts export used in server.ts).
// Returns [{tag, id, class, mode}]. Max 20. Checks el.shadowRoot !== null.
export async function getShadowHostElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var hosts = [];
      for (var i = 0; i < all.length && hosts.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot !== null) {
          hosts.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class: el.className ? el.className.toString().slice(0, 40) : '',
            mode: el.shadowRoot.mode
          });
        }
      }
      return hosts;
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getWebComponents ─────────────────────────────────────────────────────────
// Custom elements (tag names containing '-').
// Returns [{tagName, id, class, hasTemplate}]. Max 20.
export async function getWebComponents(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var found = [];
      for (var i = 0; i < all.length && found.length < 20; i++) {
        var el = all[i];
        var tn = el.tagName.toLowerCase();
        if (tn.indexOf('-') !== -1) {
          var hasTemplate = !!(el.shadowRoot &&
            el.shadowRoot.querySelectorAll('slot').length > 0);
          found.push({
            tagName: tn,
            id: el.id || '',
            class: el.className ? el.className.toString().slice(0, 40) : '',
            hasTemplate: hasTemplate
          });
        }
      }
      return found;
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getTemplateElements2 ─────────────────────────────────────────────────────
// All <template> elements (renamed: getTemplateElements conflicts with slot2.ts).
// Returns [{id, class, childCount}]. Max 20. Uses el.content.childElementCount.
export async function getTemplateElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var templates = Array.prototype.slice.call(document.querySelectorAll('template'), 0, 20);
      return templates.map(function(el) {
        return {
          id: el.id || '',
          class: el.className ? el.className.toString().slice(0, 40) : '',
          childCount: el.content.childElementCount
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getSlotElements2 ────────────────────────────────────────────────────────
// All <slot> elements and elements with slot attribute
// (renamed: getSlotElements conflicts with slot2.ts).
// Returns [{name, id, assignedCount}]. Max 20.
export async function getSlotElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var slots = Array.prototype.slice.call(document.querySelectorAll('[slot], slot'), 0, 20);
      return slots.map(function(el) {
        var assigned = 0;
        try {
          if (el.tagName && el.tagName.toLowerCase() === 'slot' && el.assignedNodes) {
            assigned = el.assignedNodes().length;
          }
        } catch(e) {}
        return {
          name: el.getAttribute ? (el.getAttribute('name') || el.getAttribute('slot') || '') : '',
          id: el.id || '',
          assignedCount: assigned
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getCustomElementRegistry ────────────────────────────────────────────────
// Heuristic count of custom elements via tag names containing '-'.
// Returns {count, tagNames[]}. Max 20 tag names.
export async function getCustomElementRegistry(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var seen = {};
      var tagNames = [];
      for (var i = 0; i < all.length; i++) {
        var tn = all[i].tagName.toLowerCase();
        if (tn.indexOf('-') !== -1 && !seen[tn]) {
          seen[tn] = true;
          if (tagNames.length < 20) tagNames.push(tn);
        }
      }
      return { count: tagNames.length, tagNames: tagNames };
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { count: 0, tagNames: [] });
}

// ─── getShadowDomDepth ────────────────────────────────────────────────────────
// Max depth of nested shadow roots by walking the document tree.
// Returns {maxDepth, hostsFound}.
export async function getShadowDomDepth(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hostsFound = 0;
      function walk(root, depth) {
        var els = Array.prototype.slice.call(root.querySelectorAll('*'));
        var max = depth;
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.shadowRoot !== null) {
            hostsFound++;
            var sub = walk(el.shadowRoot, depth + 1);
            if (sub > max) max = sub;
          }
        }
        return max;
      }
      var maxDepth = walk(document, 0);
      return { maxDepth: maxDepth, hostsFound: hostsFound };
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { maxDepth: 0, hostsFound: 0 });
}

// ─── getPartElements ──────────────────────────────────────────────────────────
// Elements with `part` attribute (CSS shadow parts).
// Returns [{tag, id, part}]. Max 20.
export async function getPartElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('[part]'), 0, 20);
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          part: el.getAttribute('part') || ''
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getExportPartsElements ───────────────────────────────────────────────────
// Elements with `exportparts` attribute.
// Returns [{tag, id, exportparts}]. Max 20.
export async function getExportPartsElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.prototype.slice.call(document.querySelectorAll('[exportparts]'), 0, 20);
      return els.map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          exportparts: el.getAttribute('exportparts') || ''
        };
      });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}
