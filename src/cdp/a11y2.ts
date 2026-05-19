// src/cdp/a11y2.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// 1. List all elements with explicit role attributes.
// Returns JSON array of { tag, id, role, text } (text truncated to 60 chars). Limit 50.
export async function getAriaRoles(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('[role]')).slice(0, 50);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    role: el.getAttribute('role') || '',
    text: (el.textContent || '').trim().slice(0, 60),
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 2. List all elements with aria-label or aria-labelledby.
// Returns JSON array of { tag, id, ariaLabel, ariaLabelledby }. Limit 50.
export async function getAriaLabels(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('[aria-label], [aria-labelledby]')).slice(0, 50);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    ariaLabel: el.getAttribute('aria-label') || '',
    ariaLabelledby: el.getAttribute('aria-labelledby') || '',
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 3. List elements with aria-describedby or aria-description.
// Returns JSON array of { tag, id, ariaDescribedby }. Limit 30.
export async function getAriaDescriptions(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('[aria-describedby], [aria-description]')).slice(0, 30);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    ariaDescribedby: el.getAttribute('aria-describedby') || el.getAttribute('aria-description') || '',
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 4. List all ARIA landmark elements.
// Includes main, nav, header, footer, aside, section[aria-label], form[aria-label],
// and elements with role=banner/navigation/main/complementary/contentinfo/search/form/region.
// Returns JSON array of { tag, id, role, text }. Limit 20.
export async function getLandmarkElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const query = [
    'main', 'nav', 'header', 'footer', 'aside',
    'section[aria-label]', 'form[aria-label]',
    '[role="banner"]', '[role="navigation"]', '[role="main"]',
    '[role="complementary"]', '[role="contentinfo"]',
    '[role="search"]', '[role="form"]', '[role="region"]',
  ].join(', ');
  const elements = Array.from(document.querySelectorAll(query)).slice(0, 20);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
    text: (el.textContent || '').trim().slice(0, 60),
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 5. Get elements in tab order (positive tabindex first, then natural order).
// Returns JSON array of { tag, id, text, tabIndex }. Limit 30.
export async function getTabOrder(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const focusableQuery = 'a[href], button, input, select, textarea, [tabindex]';
  const elements = Array.from(document.querySelectorAll(focusableQuery));
  const withTabIndex = elements.map(el => ({
    el,
    tabIndex: el.tabIndex,
  }));
  // Sort: positive tabindex first (ascending), then tabindex=0/-1 (natural DOM order)
  withTabIndex.sort((a, b) => {
    const aPos = a.tabIndex > 0;
    const bPos = b.tabIndex > 0;
    if (aPos && bPos) return a.tabIndex - b.tabIndex;
    if (aPos) return -1;
    if (bPos) return 1;
    return 0;
  });
  return withTabIndex.slice(0, 30).map(item => ({
    tag: item.el.tagName.toLowerCase(),
    id: item.el.id || '',
    text: (item.el.textContent || '').trim().slice(0, 60),
    tabIndex: item.tabIndex,
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 6. List all focusable elements that aren't tabindex=-1.
// Returns JSON array of { tag, id, class, tabIndex }. Limit 50.
export async function getFocusableElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const focusableQuery = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';
  const elements = Array.from(document.querySelectorAll(focusableQuery));
  return elements
    .filter(el => el.tabIndex !== -1)
    .slice(0, 50)
    .map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class: el.className || '',
      tabIndex: el.tabIndex,
    }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 7. List elements with aria-expanded attribute.
// Returns JSON array of { tag, id, expanded, text }. Limit 30.
export async function getAriaExpanded(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('[aria-expanded]')).slice(0, 30);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    expanded: el.getAttribute('aria-expanded'),
    text: (el.textContent || '').trim().slice(0, 60),
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 8. List elements with aria-hidden="true".
// Returns JSON array of { tag, id, text } (text truncated to 40 chars). Limit 30.
export async function getAriaHidden(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('[aria-hidden="true"]')).slice(0, 30);
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    text: (el.textContent || '').trim().slice(0, 40),
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}
