// src/cdp/heading2.ts
import { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpContent {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// 1. Find all h1-h6 elements: { level, text, id, class }[]. Max 50.
export async function getHeadings2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 50);
  return els.map(el => ({
    level: parseInt(el.tagName.slice(1), 10),
    text: (el.textContent || '').trim().slice(0, 200),
    id: el.id || '',
    class: el.className || '',
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 2. Build a hierarchical outline from headings. Return { outline: [{level, text, children}] }.
// Max depth 6.
export async function getHeadingOutline(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 100);
  const headings = els.map(el => ({
    level: parseInt(el.tagName.slice(1), 10),
    text: (el.textContent || '').trim().slice(0, 200),
    children: [],
  }));

  const root = { level: 0, text: '', children: [] };
  const stack = [root];

  for (const h of headings) {
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    parent.children.push(h);
    stack.push(h);
  }

  return { outline: root.children };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 3. Get all <h1> text content. Return { h1s: string[], count: number }.
export async function getH1s(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('h1'));
  const h1s = els.map(el => (el.textContent || '').trim().slice(0, 200));
  return { h1s, count: h1s.length };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 4. Return { h1, h2, h3, h4, h5, h6, total } count of each heading level.
export async function getHeadingCount(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (let i = 1; i <= 6; i++) {
    counts['h' + i] = document.querySelectorAll('h' + i).length;
  }
  counts.total = counts.h1 + counts.h2 + counts.h3 + counts.h4 + counts.h5 + counts.h6;
  return counts;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 5. Find ARIA landmark elements. Return { tag, role, id, class }[]. Max 20.
// Includes role="main/navigation/banner/contentinfo/search/complementary"
// and native <main>, <nav>, <header>, <footer>, <aside>.
export async function getLandmarks2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const roleSelectors = [
    '[role="main"]', '[role="navigation"]', '[role="banner"]',
    '[role="contentinfo"]', '[role="search"]', '[role="complementary"]',
  ];
  const nativeSelectors = ['main', 'nav', 'header', 'footer', 'aside'];
  const all = roleSelectors.concat(nativeSelectors).join(', ');
  const seen = new Set();
  const els = Array.from(document.querySelectorAll(all)).filter(el => {
    if (seen.has(el)) return false;
    seen.add(el);
    return true;
  }).slice(0, 20);
  return els.map(el => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
    id: el.id || '',
    class: el.className || '',
  }));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 6. Find <section> and <article> elements with aria-label or id.
// Return { tag, id, class, ariaLabel, headingText }[]. Max 20.
// headingText = text of first h1-h6 child.
export async function getPageSections(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('section, article')).slice(0, 20);
  return els.map(el => {
    const firstHeading = el.querySelector('h1, h2, h3, h4, h5, h6');
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class: el.className || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      headingText: firstHeading ? (firstHeading.textContent || '').trim().slice(0, 200) : '',
    };
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 7. Find skip links: <a href="#..."> within first 5 elements in body.
// Return { text, href }[].
export async function getSkipLinks(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const bodyChildren = Array.from(document.body ? document.body.children : []).slice(0, 5);
  const links = [];
  for (const child of bodyChildren) {
    const anchors = Array.from(child.querySelectorAll ? child.querySelectorAll('a[href^="#"]') : []);
    if (child.tagName && child.tagName.toLowerCase() === 'a') {
      const href = child.getAttribute('href') || '';
      if (href.startsWith('#')) {
        links.push({ text: (child.textContent || '').trim().slice(0, 200), href });
      }
    }
    for (const a of anchors) {
      links.push({ text: (a.textContent || '').trim().slice(0, 200), href: a.getAttribute('href') || '' });
    }
  }
  return links;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

// 8. Get text content of all headings in order with their level.
// Return { items: [{level, text}] }. Max 30.
export async function getReadingOrder(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 30);
  const items = els.map(el => ({
    level: parseInt(el.tagName.slice(1), 10),
    text: (el.textContent || '').trim().slice(0, 200),
  }));
  return { items };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}
