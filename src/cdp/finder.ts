// src/cdp/finder.ts
import { CdpClient } from './client';

export interface FoundElement {
  selector: string;
  tagName: string;
  type?: string;
  id?: string;
  name?: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
}

// Shared selector-building logic injected into every evaluate expression.
// Prefer #id, then [name=val], then tag:nth-of-type(n).
const SELECTOR_FN = `
function selectorOf(el) {
  var tag = el.tagName.toLowerCase();
  if (el.id) return '#' + el.id;
  var name = el.getAttribute('name');
  if (name) return tag + '[name=' + JSON.stringify(name) + ']';
  var parent = el.parentElement;
  if (parent) {
    var siblings = Array.prototype.filter.call(parent.children, function(c) { return c.tagName === el.tagName; });
    var idx = siblings.indexOf(el) + 1;
    return tag + ':nth-of-type(' + idx + ')';
  }
  return tag;
}
function buildResult(el) {
  return {
    selector: selectorOf(el),
    tagName: el.tagName.toLowerCase(),
    type: el.getAttribute('type') || undefined,
    id: el.id || undefined,
    name: el.getAttribute('name') || undefined,
    text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 200) || undefined,
    placeholder: el.getAttribute('placeholder') || undefined,
    ariaLabel: el.getAttribute('aria-label') || undefined,
  };
}
`;

/**
 * Find an input/select/textarea associated with a label whose text matches
 * (case-insensitive substring). Follows the `for` attribute or finds the
 * input nested inside the label.
 */
export async function findByLabel(
  client: CdpClient,
  labelText: string,
): Promise<FoundElement | null> {
  const query = JSON.stringify(labelText);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var q = ${query}.toLowerCase();
  var labels = Array.from(document.querySelectorAll('label'));
  var label = labels.find(function(l) { return (l.textContent || '').toLowerCase().includes(q); });
  if (!label) return null;
  var forId = label.getAttribute('for');
  if (forId) {
    var el = document.getElementById(forId);
    if (el) return buildResult(el);
  }
  var inner = label.querySelector('input, select, textarea');
  if (inner) return buildResult(inner);
  return null;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement | null) ?? null;
}

/**
 * Find an input whose placeholder attribute contains the given text
 * (case-insensitive substring). Returns the first match.
 */
export async function findByPlaceholder(
  client: CdpClient,
  placeholder: string,
): Promise<FoundElement | null> {
  const query = JSON.stringify(placeholder);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var q = ${query}.toLowerCase();
  var inputs = Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'));
  var el = inputs.find(function(el) {
    return (el.getAttribute('placeholder') || '').toLowerCase().includes(q);
  });
  if (!el) return null;
  return buildResult(el);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement | null) ?? null;
}

/**
 * Find a button or submit/button input whose visible text or value contains
 * the given text (case-insensitive). Also checks [role=button] elements.
 * Returns the first match.
 */
export async function findButton(
  client: CdpClient,
  text: string,
): Promise<FoundElement | null> {
  const query = JSON.stringify(text);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var q = ${query}.toLowerCase();
  var candidates = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]'));
  var el = candidates.find(function(el) {
    var txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
    var val = (el.value || '').toLowerCase();
    return txt.includes(q) || val.includes(q);
  });
  if (!el) return null;
  return buildResult(el);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement | null) ?? null;
}

/**
 * Find all elements with a given ARIA role. If `name` is provided, filters
 * by aria-label or aria-labelledby content containing name (case-insensitive).
 * Returns up to 10 matches.
 */
export async function findByRole(
  client: CdpClient,
  role: string,
  name?: string,
): Promise<FoundElement[]> {
  const roleVal = JSON.stringify(role);
  const nameVal = name !== undefined ? JSON.stringify(name) : 'null';
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var role = ${roleVal};
  var nameQuery = ${nameVal};
  var candidates = Array.from(document.querySelectorAll('[role=' + JSON.stringify(role) + ']'));
  var results = [];
  for (var i = 0; i < candidates.length && results.length < 10; i++) {
    var el = candidates[i];
    if (nameQuery !== null) {
      var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      var labelledById = el.getAttribute('aria-labelledby');
      var labelledByText = '';
      if (labelledById) {
        var labelEl = document.getElementById(labelledById);
        if (labelEl) labelledByText = (labelEl.textContent || '').toLowerCase();
      }
      var q = nameQuery.toLowerCase();
      if (!ariaLabel.includes(q) && !labelledByText.includes(q)) continue;
    }
    results.push(buildResult(el));
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement[]) ?? [];
}

/**
 * Find elements whose visible text (innerText) contains the given text.
 * Optionally filter by tagName (e.g. 'span', 'div', 'h1').
 * Returns up to 10 matches with their selectors and text.
 */
export async function findByText(
  client: CdpClient,
  text: string,
  tagName?: string,
): Promise<FoundElement[]> {
  const query = JSON.stringify(text);
  const tagVal = tagName !== undefined ? JSON.stringify(tagName.toLowerCase()) : 'null';
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var q = ${query}.toLowerCase();
  var tagFilter = ${tagVal};
  var sel = tagFilter !== null ? tagFilter : '*';
  var candidates = Array.from(document.querySelectorAll(sel));
  var results = [];
  for (var i = 0; i < candidates.length && results.length < 10; i++) {
    var el = candidates[i];
    var txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!txt.toLowerCase().includes(q)) continue;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    results.push(buildResult(el));
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement[]) ?? [];
}

/**
 * Find all interactive elements (inputs, selects, buttons) that are near a
 * label with the given text. "Near" means within the same parent container
 * (up to 3 levels up from the label).
 * Returns all candidates with their selectors.
 */
export async function findNearLabel(
  client: CdpClient,
  labelText: string,
): Promise<FoundElement[]> {
  const query = JSON.stringify(labelText);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  ${SELECTOR_FN}
  var q = ${query}.toLowerCase();
  var labels = Array.from(document.querySelectorAll('label'));
  var label = labels.find(function(l) { return (l.textContent || '').toLowerCase().includes(q); });
  if (!label) return [];
  // Walk up to 3 parent levels to find a container with interactive elements
  var container = label;
  var interactiveSel = 'input, select, textarea, button, [role="button"]';
  for (var i = 0; i <= 3; i++) {
    var found = Array.from(container.querySelectorAll(interactiveSel));
    if (found.length > 0) {
      return found.map(buildResult);
    }
    if (!container.parentElement) break;
    container = container.parentElement;
  }
  return [];
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as FoundElement[]) ?? [];
}

/**
 * Given a coordinate (e.g. from a screenshot click), return the best CSS
 * selector for the element at that point.
 * Prefers #id, then [name=val], then tag:nth-of-type(n).
 */
export async function getElementSelector(
  client: CdpClient,
  x: number,
  y: number,
): Promise<string | null> {
  const xVal = JSON.stringify(x);
  const yVal = JSON.stringify(y);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  var el = document.elementFromPoint(${xVal}, ${yVal});
  if (!el) return null;
  var tag = el.tagName.toLowerCase();
  if (el.id) return '#' + el.id;
  var name = el.getAttribute('name');
  if (name) return tag + '[name=' + JSON.stringify(name) + ']';
  var parent = el.parentElement;
  if (parent) {
    var siblings = Array.prototype.filter.call(parent.children, function(c) { return c.tagName === el.tagName; });
    var idx = siblings.indexOf(el) + 1;
    return tag + ':nth-of-type(' + idx + ')';
  }
  return tag;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as string | null) ?? null;
}
