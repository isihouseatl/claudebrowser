// src/cdp/accessibility2.ts
import { CdpClient } from './client';

function ok(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text }] };
}

function err(text: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${text}` }] };
}

// 1. Get all aria-* attributes on an element matched by selector.
// Returns a JSON array of {name, value} objects.
export async function getAriaAttributes(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const attrs = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.name.startsWith('aria-')) {
      attrs.push({ name: a.name, value: a.value });
    }
  }
  return attrs;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 2. Get the element's effective role: explicit role attribute or tag name fallback.
export async function getRole(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  return el.getAttribute('role') || el.tagName.toLowerCase();
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }

  return ok(String(result.value));
}

// 3. Get the tabIndex of an element matched by selector.
export async function getTabIndex(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (el === null || el === undefined) return null;
  return el.tabIndex;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }

  return ok(String(result.value));
}

// 4. Find all focusable elements on the page.
// Returns a JSON array of {tag, id, text, tabIndex}.
export async function getFocusableElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const query = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(query));
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    text: (el.textContent || '').trim().slice(0, 100),
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

// 5. Check all img elements for alt attributes.
// Returns {total, withAlt, withoutAlt, missingAlt: [{src, id}]}.
export async function checkImageAlts(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const images = Array.from(document.querySelectorAll('img'));
  const total = images.length;
  const withAlt = images.filter(img => img.hasAttribute('alt')).length;
  const withoutAlt = total - withAlt;
  const missingAlt = images
    .filter(img => !img.hasAttribute('alt'))
    .map(img => ({ src: img.getAttribute('src') || '', id: img.id || '' }));
  return { total, withAlt, withoutAlt, missingAlt };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// 6. Get all heading elements h1-h6 with their level and text content.
// Returns a JSON array of {level, text}.
export async function getHeadingStructure(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  return headings.map(el => ({
    level: parseInt(el.tagName.slice(1), 10),
    text: (el.textContent || '').trim().slice(0, 100),
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

// 7. Find all landmark elements on the page.
// Returns a JSON array of {tag, role, id, text}.
export async function getLandmarks(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const query = 'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]';
  const elements = Array.from(document.querySelectorAll(query));
  return elements.map(el => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
    id: el.id || '',
    text: (el.textContent || '').trim().slice(0, 100),
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

// 8. Resolve aria-labelledby for an element matched by selector.
// Returns {labelledBy: string[], resolvedText: string}.
export async function getAriaLabelledBy(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const raw = el.getAttribute('aria-labelledby') || '';
  const ids = raw.trim().length > 0 ? raw.trim().split(/\\s+/) : [];
  const resolvedTexts = ids.map(id => {
    const ref = document.getElementById(id);
    return ref ? (ref.textContent || '').trim().slice(0, 100) : '';
  });
  return {
    labelledBy: ids,
    resolvedText: resolvedTexts.filter(t => t.length > 0).join(' '),
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });

  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err('Element not found');
  }

  return ok(JSON.stringify(result.value, null, 2));
}

// ─── New accessibility module functions ──────────────────────────────────────

// 9. getAriaRoles3 — Elements with explicit ARIA roles (max 30)
export async function getAriaRoles3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[role]')).slice(0, 30);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      role: el.getAttribute('role') || '',
      text_preview: (el.textContent || '').trim().slice(0, 80),
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 10. getAriaLabels3 — Elements with aria-label (max 30)
export async function getAriaLabels3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[aria-label]')).slice(0, 30);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      aria_label_preview: (el.getAttribute('aria-label') || '').slice(0, 100),
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 11. getAriaLiveRegions2 — aria-live regions (max 20)
export async function getAriaLiveRegions2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[aria-live]')).slice(0, 20);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      live: el.getAttribute('aria-live') || '',
      atomic: el.getAttribute('aria-atomic') || '',
      text_preview: (el.textContent || '').trim().slice(0, 80),
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 12. getSkipLinks3 — Skip navigation links (max 10)
export async function getSkipLinks3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]')).slice(0, 10);
    return anchors.map(el => {
      const style = window.getComputedStyle(el);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0;
      return {
        href: el.getAttribute('href') || '',
        text_preview: (el.textContent || '').trim().slice(0, 80),
        visible,
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 13. getFocusableElements3 — Focusable element counts by type
export async function getFocusableElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const buttons = document.querySelectorAll('button:not([disabled])').length;
    const links = document.querySelectorAll('a[href]').length;
    const inputs = document.querySelectorAll('input:not([disabled])').length;
    const selects = document.querySelectorAll('select:not([disabled])').length;
    const textareas = document.querySelectorAll('textarea:not([disabled])').length;
    const tabIndexed = document.querySelectorAll('[tabindex]:not([tabindex="-1"])').length;
    const total = buttons + links + inputs + selects + textareas + tabIndexed;
    return { buttons, links, inputs, selects, textareas, tabIndexed, total };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 14. getTabIndexElements — Elements with explicit tabindex (max 20)
export async function getTabIndexElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[tabindex]')).slice(0, 20);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      tabindex: el.getAttribute('tabindex') || '',
      text_preview: (el.textContent || '').trim().slice(0, 80),
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 15. getAriaDescriptions3 — Elements with aria-description or aria-describedby (max 20)
export async function getAriaDescriptions3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[aria-description],[aria-describedby]')).slice(0, 20);
    return els.map(el => {
      const direct = el.getAttribute('aria-description') || '';
      const refIds = (el.getAttribute('aria-describedby') || '').trim().split(/\\s+/).filter(Boolean);
      const refText = refIds.map(id => {
        const ref = document.getElementById(id);
        return ref ? (ref.textContent || '').trim().slice(0, 60) : '';
      }).filter(Boolean).join(' ');
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        description_preview: (direct || refText).slice(0, 100),
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

// 16. getHeadingStructure3 — Heading hierarchy with id (max 30)
export async function getHeadingStructure3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 30);
    return headings.map(el => ({
      level: parseInt(el.tagName.slice(1), 10),
      text_preview: (el.textContent || '').trim().slice(0, 100),
      id: el.id || '',
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
