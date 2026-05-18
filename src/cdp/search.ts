// src/cdp/search.ts
import { CdpClient } from './client';

export interface SearchMatch {
  text: string;
  xpath: string;
  rect: { x: number; y: number; width: number; height: number };
}

export async function findTextMatches(
  client: CdpClient,
  searchText: string,
  caseSensitive = false,
): Promise<SearchMatch[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const searchText = ${JSON.stringify(searchText)};
  const caseSensitive = ${caseSensitive};

  function getXPath(node) {
    const parts = [];
    let current = node;
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const tag = current.tagName.toLowerCase();
        let index = 1;
        let sib = current.previousSibling;
        while (sib) {
          if (sib.nodeType === Node.ELEMENT_NODE && sib.tagName.toLowerCase() === tag) index++;
          sib = sib.previousSibling;
        }
        parts.unshift(tag + '[' + index + ']');
      }
      current = current.parentNode;
    }
    return '/' + parts.join('/');
  }

  const needle = caseSensitive ? searchText : searchText.toLowerCase();
  const matches = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

  let node;
  while ((node = walker.nextNode()) !== null) {
    const content = caseSensitive ? node.textContent : node.textContent.toLowerCase();
    let searchFrom = 0;
    while (true) {
      const idx = content.indexOf(needle, searchFrom);
      if (idx === -1) break;

      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + needle.length);
      const rect = range.getBoundingClientRect();

      matches.push({
        text: node.textContent.substring(idx, idx + searchText.length),
        xpath: getXPath(node.parentNode),
        rect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });

      searchFrom = idx + needle.length;
    }
  }

  return matches;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as SearchMatch[];
}

export async function countTextOccurrences(
  client: CdpClient,
  searchText: string,
  caseSensitive = false,
): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const searchText = ${JSON.stringify(searchText)};
  const caseSensitive = ${caseSensitive};
  const body = caseSensitive ? document.body.innerText : document.body.innerText.toLowerCase();
  const needle = caseSensitive ? searchText : searchText.toLowerCase();
  if (!needle) return 0;
  return body.split(needle).length - 1;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

export async function getSelectedText(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.getSelection().toString()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value as string) ?? '';
}

export async function selectAllTextInElement(
  client: CdpClient,
  selector: string,
): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function highlightAllText(
  client: CdpClient,
  searchText: string,
  color = 'yellow',
): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const searchText = ${JSON.stringify(searchText)};
  const color = ${JSON.stringify(color)};
  if (!searchText) return 0;

  const needle = searchText.toLowerCase();
  let count = 0;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentNode && node.parentNode.nodeName === 'MARK') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  let node;
  while ((node = walker.nextNode()) !== null) {
    if (node.textContent.toLowerCase().includes(needle)) {
      nodes.push(node);
    }
  }

  for (const textNode of nodes) {
    const text = textNode.textContent;
    const lowerText = text.toLowerCase();
    const parent = textNode.parentNode;
    if (!parent) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let idx;
    const parts = [];

    let searchFrom = 0;
    while (true) {
      idx = lowerText.indexOf(needle, searchFrom);
      if (idx === -1) break;
      parts.push({ start: idx, end: idx + needle.length });
      searchFrom = idx + needle.length;
    }

    for (const part of parts) {
      if (part.start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, part.start)));
      }
      const mark = document.createElement('mark');
      mark.className = '__cb_hl';
      mark.style.background = color;
      mark.style.color = 'inherit';
      mark.appendChild(document.createTextNode(text.substring(part.start, part.end)));
      fragment.appendChild(mark);
      count++;
      lastIndex = part.end;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    parent.replaceChild(fragment, textNode);
  }

  return count;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as number;
}

export async function clearHighlights(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const marks = Array.from(document.querySelectorAll('mark.__cb_hl'));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  }
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function replaceTextInElement(
  client: CdpClient,
  selector: string,
  searchText: string,
  replacement: string,
): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode()) !== null) {
    const idx = node.textContent.indexOf(${JSON.stringify(searchText)});
    if (idx !== -1) {
      const before = node.textContent.substring(0, idx);
      const after = node.textContent.substring(idx + ${JSON.stringify(searchText)}.length);
      node.textContent = before + ${JSON.stringify(replacement)} + after;
      return true;
    }
  }
  return false;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

export async function scrollToText(
  client: CdpClient,
  searchText: string,
  caseSensitive = false,
): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const searchText = ${JSON.stringify(searchText)};
  const caseSensitive = ${caseSensitive};
  const needle = caseSensitive ? searchText : searchText.toLowerCase();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode()) !== null) {
    const content = caseSensitive ? node.textContent : node.textContent.toLowerCase();
    const idx = content.indexOf(needle);
    if (idx !== -1) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + needle.length);
      const rect = range.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2),
        left: window.scrollX + rect.left - Math.max(0, (window.innerWidth - rect.width) / 2),
        behavior: 'smooth',
      });
      return true;
    }
  }
  return false;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}
