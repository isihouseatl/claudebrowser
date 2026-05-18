// src/cdp/search2.ts
import { CdpClient } from './client';

export async function findElementsByText(
  client: CdpClient,
  text: string,
  tag?: string,
): Promise<Array<{ tag: string; selector: string; text: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const needle = ${JSON.stringify(text)}.toLowerCase();
  const tagFilter = ${JSON.stringify(tag ?? null)};

  function getCssSelector(el) {
    if (el.id) return '#' + el.id;
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  const selector = tagFilter ? tagFilter : '*';
  const elements = Array.from(document.querySelectorAll(selector));
  const results = [];

  for (const el of elements) {
    const trimmed = (el.textContent || '').trim();
    if (trimmed.toLowerCase().includes(needle)) {
      results.push({
        tag: el.tagName.toLowerCase(),
        selector: getCssSelector(el),
        text: trimmed,
      });
    }
  }

  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ tag: string; selector: string; text: string }>;
}

export async function getPageTextBlocks(
  client: CdpClient,
): Promise<Array<{ tag: string; text: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const paras = Array.from(document.querySelectorAll('p'));
  const listItems = Array.from(document.querySelectorAll('li'));
  const tableCells = Array.from(document.querySelectorAll('td,th'));

  const divs = Array.from(document.querySelectorAll('div')).filter(div => {
    for (const child of div.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  });

  const all = [...headings, ...paras, ...listItems, ...tableCells, ...divs];
  const results = [];

  for (const el of all) {
    const text = (el.textContent || '').trim();
    if (text.length > 0) {
      results.push({ tag: el.tagName.toLowerCase(), text });
    }
  }

  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ tag: string; text: string }>;
}

export async function findByRegex(
  client: CdpClient,
  pattern: string,
  flags?: string,
): Promise<Array<{ text: string; tag: string; selector: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const pattern = ${JSON.stringify(pattern)};
  const flags = ${JSON.stringify(flags ?? 'i')};
  const re = new RegExp(pattern, flags);

  function getCssSelector(el) {
    if (el.id) return '#' + el.id;
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  const elements = Array.from(document.querySelectorAll('*'));
  const results = [];

  for (const el of elements) {
    const text = (el.textContent || '').trim();
    if (re.test(text)) {
      results.push({
        text,
        tag: el.tagName.toLowerCase(),
        selector: getCssSelector(el),
      });
    }
  }

  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ text: string; tag: string; selector: string }>;
}

export async function getHeadings(
  client: CdpClient,
): Promise<Array<{ level: number; text: string; id: string | null }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  return headings.map(el => ({
    level: parseInt(el.tagName.charAt(1), 10),
    text: (el.textContent || '').trim(),
    id: el.getAttribute('id'),
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ level: number; text: string; id: string | null }>;
}

export async function getParagraphs(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const paragraphs = Array.from(document.querySelectorAll('p'));
  return paragraphs
    .map(el => (el.textContent || '').trim())
    .filter(text => text.length > 0);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string[];
}

export async function getListItems(
  client: CdpClient,
): Promise<Array<{ list: string; items: string[] }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const lists = Array.from(document.querySelectorAll('ul,ol'));
  return lists.map(listEl => {
    const items = Array.from(listEl.querySelectorAll(':scope > li'))
      .map(li => (li.textContent || '').trim())
      .filter(text => text.length > 0);
    return {
      list: listEl.tagName.toLowerCase(),
      items,
    };
  }).filter(entry => entry.items.length > 0);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as Array<{ list: string; items: string[] }>;
}

export async function countWords(client: CdpClient, selector?: string): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sel = ${JSON.stringify(selector ?? null)};
  const el = sel ? document.querySelector(sel) : document.body;
  if (!el) return 0;
  const text = (el.textContent || '').trim();
  if (text.length === 0) return 0;
  return text.split(/\\s+/).length;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

export async function extractEmails(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const text = document.body.textContent || '';
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
  const matches = text.match(re) || [];
  return Array.from(new Set(matches));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as string[];
}
