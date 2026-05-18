// src/cdp/shadow-dom.ts
import { CdpClient } from './client';

// Return-value helpers matching the MCP tool response format used in server.ts.
function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ─── hasShadowRoot ────────────────────────────────────────────────────────────
// Check whether an element has a shadow root and report its mode if present.
export async function hasShadowRoot(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return {
        hasShadow: el.shadowRoot !== null,
        mode: el.shadowRoot ? el.shadowRoot.mode : null
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── getShadowChildren ────────────────────────────────────────────────────────
// List up to 50 child elements inside the shadow root of the given host.
export async function getShadowChildren(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      if (!el.shadowRoot) return { error: 'No shadow root' };
      return Array.prototype.slice.call(el.shadowRoot.querySelectorAll('*'), 0, 50).map(function(c) {
        return {
          tag: c.tagName.toLowerCase(),
          id: c.id,
          class: c.className ? c.className.toString().slice(0, 50) : ''
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
    return err('Element not found');
  }
  const val = result.value as { error?: string };
  if (val.error) {
    return err(val.error);
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── queryShadowRoot ──────────────────────────────────────────────────────────
// Run querySelector inside the shadow root of a host element.
export async function queryShadowRoot(
  client: CdpClient,
  selector: string,
  innerSelector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      if (!el.shadowRoot) return { error: 'No shadow root' };
      var inner = el.shadowRoot.querySelector(${JSON.stringify(innerSelector)});
      if (!inner) return { found: false };
      return {
        found: true,
        tag: inner.tagName.toLowerCase(),
        id: inner.id || '',
        text: (inner.textContent || '').trim().slice(0, 200)
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  const val = result.value as { error?: string };
  if (val.error) {
    return err(val.error);
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── getShadowRootMode ────────────────────────────────────────────────────────
// Return the mode ("open" | "closed") of the element's shadow root, or report
// that no shadow root exists.
export async function getShadowRootMode(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return el.shadowRoot ? el.shadowRoot.mode : 'no shadow root';
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(String(result.value));
}

// ─── getShadowHostContent ─────────────────────────────────────────────────────
// Return the innerHTML of the shadow root (up to 2000 characters).
export async function getShadowHostContent(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      if (!el.shadowRoot) return { error: 'No shadow root' };
      return { html: el.shadowRoot.innerHTML.slice(0, 2000) };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  const val = result.value as { error?: string };
  if (val.error) {
    return err(val.error);
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── countShadowRoots ─────────────────────────────────────────────────────────
// Count how many elements on the page have a shadow root attached.
export async function countShadowRoots(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var count = Array.prototype.filter.call(
        document.querySelectorAll('*'),
        function(el) { return el.shadowRoot !== null; }
      ).length;
      return { count: count };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── getShadowHostElements ────────────────────────────────────────────────────
// List up to 30 elements on the page that have a shadow root attached.
export async function getShadowHostElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      return Array.prototype.slice.call(
        Array.prototype.filter.call(
          document.querySelectorAll('*'),
          function(el) { return el.shadowRoot !== null; }
        ),
        0, 30
      ).map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          class: el.className ? el.className.toString().slice(0, 50) : ''
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
  }
  return ok(JSON.stringify(result.value, null, 2));
}

// ─── getShadowSlots ───────────────────────────────────────────────────────────
// List all <slot> elements inside the shadow root and report their names and
// the number of assigned nodes for each.
export async function getShadowSlots(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      if (!el.shadowRoot) return { error: 'No shadow root' };
      var slots = Array.prototype.slice.call(el.shadowRoot.querySelectorAll('slot'));
      return slots.map(function(s) {
        return {
          name: s.getAttribute('name') || '(default)',
          assignedCount: s.assignedNodes ? s.assignedNodes().length : 0
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
    return err('Element not found');
  }
  const val = result.value as { error?: string };
  if (val.error) {
    return err(val.error);
  }
  return ok(JSON.stringify(result.value, null, 2));
}
