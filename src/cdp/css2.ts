// src/cdp/css2.ts
import { CdpClient } from './client';

// ---- Helpers ----

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text }] };
}
function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }] };
}

// ---- Functions ----

/**
 * Get computed color and background-color for an element matching selector.
 * Returns JSON string: {color, backgroundColor}.
 */
export async function getComputedColor(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var s = getComputedStyle(el);
  return {color: s.color, backgroundColor: s.backgroundColor};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Get all CSS custom properties (variables) defined on :root.
 * Returns JSON array of {name, value}.
 */
export async function getCssVariables(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() { var styles = getComputedStyle(document.documentElement); var vars = []; for (var i = 0; i < styles.length; i++) { var prop = styles[i]; if (prop.startsWith('--')) vars.push({name: prop, value: styles.getPropertyValue(prop).trim()}); } return vars; })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return ok(JSON.stringify([]));
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Set a CSS variable on :root (document.documentElement).
 * Returns "Variable set" on success.
 */
export async function setCssVariable(
  client: CdpClient,
  name: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  await client.raw.Runtime.evaluate({
    expression: `document.documentElement.style.setProperty(${JSON.stringify(name)}, ${JSON.stringify(value)})`,
    returnByValue: true,
    awaitPromise: false,
  });
  return ok('Variable set');
}

/**
 * Get the classList of an element as a JSON array of strings.
 */
export async function getElementClasses(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return Array.prototype.slice.call(el.classList);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Toggle a class on an element. Returns JSON {added: true/false}.
 */
export async function toggleClass(
  client: CdpClient,
  selector: string,
  className: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var added = el.classList.toggle(${JSON.stringify(className)});
  return {added: added};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Get any single computed CSS property for an element.
 * Returns JSON {property, value}.
 */
export async function getComputedProperty(
  client: CdpClient,
  selector: string,
  property: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  var value = getComputedStyle(el).getPropertyValue(${JSON.stringify(property)});
  return {property: ${JSON.stringify(property)}, value: value};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok(JSON.stringify(result.value));
}

/**
 * Set an inline style property on an element.
 * Returns "Style set" on success.
 */
export async function setInlineStyle(
  client: CdpClient,
  selector: string,
  property: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.style.setProperty(${JSON.stringify(property)}, ${JSON.stringify(value)});
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }
  return ok('Style set');
}

/**
 * Count loaded stylesheets and return metadata for up to 20.
 * Returns JSON {count, sheets: [{href, disabled}]}.
 */
export async function getStylesheetCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var count = document.styleSheets.length;
  var sheets = Array.prototype.slice.call(document.styleSheets, 0, 20).map(function(s) {
    return {href: s.href || '(inline)', disabled: s.disabled};
  });
  return {count: count, sheets: sheets};
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (result.value === null || result.value === undefined) {
    return ok(JSON.stringify({ count: 0, sheets: [] }));
  }
  return ok(JSON.stringify(result.value));
}
