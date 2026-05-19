// src/cdp/slot2.ts
// Web Components slot and template inspection via CDP Runtime.evaluate.
// No DOM lib — all DOM APIs are confined inside evaluate expression strings.
import { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ─── getTemplateElements ──────────────────────────────────────────────────────
// Find all <template> elements in the document. Returns {id, class, childCount}[]
// where childCount is the number of children inside template.content. Max 20.
export async function getTemplateElements(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var templates = Array.prototype.slice.call(document.querySelectorAll('template'), 0, 20);
      return templates.map(function(t) {
        return {
          id: t.id || '',
          class: t.className ? t.className.toString().slice(0, 80) : '',
          childCount: t.content ? t.content.childNodes.length : 0
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

// ─── getCustomElements ────────────────────────────────────────────────────────
// Find all elements whose tag name contains a hyphen (custom element convention).
// Returns {tag, id, class}[]. Max 30.
export async function getCustomElements(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var custom = [];
      for (var i = 0; i < all.length && custom.length < 30; i++) {
        var tag = all[i].tagName.toLowerCase();
        if (tag.indexOf('-') !== -1) {
          custom.push({
            tag: tag,
            id: all[i].id || '',
            class: all[i].className ? all[i].className.toString().slice(0, 80) : ''
          });
        }
      }
      return custom;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getCustomElementNames ────────────────────────────────────────────────────
// Get all defined custom element names via the customElements registry.
// Returns {names: string[], count: number}.
export async function getCustomElementNames(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      if (typeof customElements === 'undefined') {
        return { names: [], count: 0 };
      }
      // Walk every tag in the document that contains a hyphen and check if defined.
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var seen = {};
      var names = [];
      for (var i = 0; i < all.length; i++) {
        var tag = all[i].tagName.toLowerCase();
        if (tag.indexOf('-') !== -1 && !seen[tag]) {
          seen[tag] = true;
          if (customElements.get(tag) !== undefined) {
            names.push(tag);
          }
        }
      }
      return { names: names, count: names.length };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { names: [], count: 0 });
}

// ─── getSlotElements ──────────────────────────────────────────────────────────
// Find all <slot> elements across all open shadow roots on the page.
// Returns {name, assignedCount}[] where assignedCount = number of assigned nodes.
// Max 20.
export async function getSlotElements(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var slots = [];
      for (var i = 0; i < all.length && slots.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          var shadowSlots = Array.prototype.slice.call(el.shadowRoot.querySelectorAll('slot'));
          for (var j = 0; j < shadowSlots.length && slots.length < 20; j++) {
            var s = shadowSlots[j];
            slots.push({
              name: s.getAttribute('name') || '(default)',
              assignedCount: s.assignedNodes ? s.assignedNodes().length : 0
            });
          }
        }
      }
      return slots;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? []);
}

// ─── getAssignedNodes ─────────────────────────────────────────────────────────
// Find a shadow host by selector, get all its slots, and return assigned nodes
// for each slot. Returns {slotName, nodes: [{tag, text_snippet}][]}[].
export async function getAssignedNodes(
  client: CdpClient,
  hostSelector: string,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var host = document.querySelector(${JSON.stringify(hostSelector)});
      if (!host) return { error: 'Host element not found: ' + ${JSON.stringify(hostSelector)} };
      if (!host.shadowRoot) return { error: 'Element has no shadow root: ' + ${JSON.stringify(hostSelector)} };
      var slots = Array.prototype.slice.call(host.shadowRoot.querySelectorAll('slot'));
      return slots.map(function(slot) {
        var assigned = slot.assignedNodes ? slot.assignedNodes() : [];
        return {
          slotName: slot.getAttribute('name') || '(default)',
          nodes: Array.prototype.slice.call(assigned).map(function(n) {
            return {
              tag: n.nodeType === 1 ? n.tagName.toLowerCase() : '#text',
              text_snippet: (n.textContent || '').trim().slice(0, 100)
            };
          })
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Unexpected null result');
  }
  const val = result.value as { error?: string };
  if (val && typeof val === 'object' && !Array.isArray(val) && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value);
}

// ─── getWebComponentCount ─────────────────────────────────────────────────────
// Return summary counts: customElementsTotal, templatesTotal, slotsInLightDOM.
export async function getWebComponentCount(
  client: CdpClient,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.prototype.slice.call(document.querySelectorAll('*'));
      var customElementsTotal = 0;
      for (var i = 0; i < all.length; i++) {
        if (all[i].tagName.toLowerCase().indexOf('-') !== -1) {
          customElementsTotal++;
        }
      }
      var templatesTotal = document.querySelectorAll('template').length;
      var slotsInLightDOM = document.querySelectorAll('slot').length;
      return {
        customElementsTotal: customElementsTotal,
        templatesTotal: templatesTotal,
        slotsInLightDOM: slotsInLightDOM
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { customElementsTotal: 0, templatesTotal: 0, slotsInLightDOM: 0 });
}

// ─── getComponentAttributes ───────────────────────────────────────────────────
// Get all attributes of a custom element (selector must match an element with a
// hyphenated tag name). Returns {name, value}[].
export async function getComponentAttributes(
  client: CdpClient,
  selector: string,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { error: 'Element not found: ' + ${JSON.stringify(selector)} };
      var attrs = [];
      for (var i = 0; i < el.attributes.length; i++) {
        attrs.push({ name: el.attributes[i].name, value: el.attributes[i].value });
      }
      return attrs;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Unexpected null result');
  }
  const val = result.value as { error?: string };
  if (val && typeof val === 'object' && !Array.isArray(val) && 'error' in val) {
    return err(val.error as string);
  }
  return ok(result.value);
}

// ─── isCustomElementDefined ───────────────────────────────────────────────────
// Check whether a custom element tag name is registered in the customElements
// registry. Returns {tagName, defined: boolean}.
export async function isCustomElementDefined(
  client: CdpClient,
  tagName: string,
): Promise<ToolResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      if (typeof customElements === 'undefined') {
        return { tagName: ${JSON.stringify(tagName)}, defined: false };
      }
      return {
        tagName: ${JSON.stringify(tagName)},
        defined: customElements.get(${JSON.stringify(tagName)}) !== undefined
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(result.value ?? { tagName, defined: false });
}
