// src/cdp/list2.ts
// HTML list inspection tools via Chrome DevTools Protocol.
import { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): McpContent {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * Find all <ul> and <ol> elements on the page.
 * Returns { tag, id, class, itemCount, listType } per element. Max 20.
 */
export async function getLists(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const lists = Array.from(document.querySelectorAll('ul, ol')).slice(0, 20);
  return lists.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    class: el.className || '',
    itemCount: el.querySelectorAll(':scope > li').length,
    listType: window.getComputedStyle(el).listStyleType || '',
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Get all <li> text content from a specific list element identified by selector.
 * Returns { items: string[], count: number }.
 */
export async function getListItems2(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const list = document.querySelector(${sel});
  if (!list) return null;
  const items = Array.from(list.querySelectorAll('li')).map(li => (li.textContent || '').trim());
  return { items, count: items.length };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`List not found: ${selector}`);
  }
  return ok(result.value);
}

/**
 * Find the maximum nesting depth of <ul>/<ol>/<li> inside the given list element.
 * Returns { maxDepth: number }.
 */
export async function getNestedListDepth(
  client: CdpClient,
  selector: string,
): Promise<McpContent> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const root = document.querySelector(${sel});
  if (!root) return null;
  function depth(el, current) {
    let max = current;
    const children = Array.from(el.children);
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      const next = (tag === 'ul' || tag === 'ol' || tag === 'li') ? current + 1 : current;
      const d = depth(child, next);
      if (d > max) max = d;
    }
    return max;
  }
  return { maxDepth: depth(root, 0) };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Element not found: ${selector}`);
  }
  return ok(result.value);
}

/**
 * Find all <dl> elements and extract <dt>/<dd> pairs.
 * Returns array of { pairs: [{term, description}] } per dl. Max 10 dl elements, max 20 pairs each.
 */
export async function getDescriptionLists(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const dls = Array.from(document.querySelectorAll('dl')).slice(0, 10);
  return dls.map(dl => {
    const children = Array.from(dl.children);
    const pairs = [];
    let currentTerm = null;
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'dt') {
        currentTerm = (child.textContent || '').trim();
      } else if (tag === 'dd' && currentTerm !== null) {
        pairs.push({ term: currentTerm, description: (child.textContent || '').trim() });
        currentTerm = null;
        if (pairs.length >= 20) break;
      }
    }
    return { pairs };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find all <nav> elements containing lists.
 * Returns { id, class, linkCount, links: [{text, href}] }. Max 10 navs, max 10 links each.
 */
export async function getNavLists(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const navs = Array.from(document.querySelectorAll('nav')).filter(nav =>
    nav.querySelector('ul, ol, li')
  ).slice(0, 10);
  return navs.map(nav => {
    const allLinks = Array.from(nav.querySelectorAll('a')).slice(0, 10);
    const links = allLinks.map(a => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href') || '',
    }));
    return {
      id: nav.id || '',
      class: nav.className || '',
      linkCount: nav.querySelectorAll('a').length,
      links,
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find elements with role="menuitem", role="option", or role="listitem" aria roles.
 * Returns { tag, id, text, role }[]. Max 30.
 */
export async function getMenuItems(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sel = '[role="menuitem"], [role="option"], [role="listitem"]';
  const els = Array.from(document.querySelectorAll(sel)).slice(0, 30);
  return els.map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    text: (el.textContent || '').trim().slice(0, 200),
    role: el.getAttribute('role') || '',
  }));
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find <li> elements containing checked checkboxes (input[type=checkbox]:checked).
 * Returns { text, checkedCount, totalCount } per parent list.
 */
export async function getCheckedListItems(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const checkedBoxes = Array.from(document.querySelectorAll('li input[type="checkbox"]:checked'));
  const parentLists = new Map();
  for (const cb of checkedBoxes) {
    const li = cb.closest('li');
    if (!li) continue;
    const list = li.parentElement;
    if (!list) continue;
    if (!parentLists.has(list)) parentLists.set(list, []);
    parentLists.get(list).push(li);
  }
  const results = [];
  for (const [list, checkedLis] of parentLists.entries()) {
    const allLis = Array.from(list.querySelectorAll(':scope > li'));
    const text = checkedLis.map(li => (li.textContent || '').trim().slice(0, 200));
    results.push({
      text,
      checkedCount: checkedLis.length,
      totalCount: allLis.length,
    });
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Return counts of list elements on the page.
 * Returns { ul, ol, dl, nav, menuRole }.
 */
export async function getListCount(
  client: CdpClient,
): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return {
    ul: document.querySelectorAll('ul').length,
    ol: document.querySelectorAll('ol').length,
    dl: document.querySelectorAll('dl').length,
    nav: document.querySelectorAll('nav').length,
    menuRole: document.querySelectorAll('[role="menuitem"], [role="option"], [role="listitem"]').length,
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}
