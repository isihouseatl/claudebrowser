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

// ---------------------------------------------------------------------------
// Search UI helpers
// ---------------------------------------------------------------------------

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/** Forms with role="search" or that contain a search input (max 5). */
export async function getSearchForms(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const forms = Array.from(document.querySelectorAll(
    'form[role="search"], form:has(input[type="search"]), form:has(input[name*="search" i]), form:has(input[placeholder*="search" i])'
  ));
  const seen = new Set();
  const out = [];
  for (const f of forms) {
    if (seen.has(f)) continue;
    seen.add(f);
    out.push({
      id: f.getAttribute('id') || null,
      action: f.getAttribute('action') || null,
      inputCount: f.querySelectorAll('input, textarea, select').length,
    });
    if (out.length >= 5) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** Elements with role="listbox" or .search-results/.results class (max 5). */
export async function getSearchResults(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const els = Array.from(document.querySelectorAll(
    '[role="listbox"], .search-results, .results, [class*="search-results"], [class*="searchResults"]'
  ));
  const out = [];
  for (const el of els) {
    out.push({
      id: el.getAttribute('id') || null,
      class: el.getAttribute('class') || null,
      itemCount: el.querySelectorAll('[role="option"], li, .result-item, [class*="result-item"]').length,
    });
    if (out.length >= 5) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** role="option" elements inside role="listbox" (max 20). */
export async function getSearchSuggestions(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"]'));
  const out = [];
  for (const opt of options) {
    out.push({
      text: (opt.textContent || '').trim(),
      value: opt.getAttribute('data-value') || opt.getAttribute('value') || null,
      isSelected: opt.getAttribute('aria-selected') === 'true',
    });
    if (out.length >= 20) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** Input elements with a list attribute (datalist-backed inputs). */
export async function getAutocomplete2(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const inputs = Array.from(document.querySelectorAll('input[list]'));
  const out = [];
  for (const inp of inputs) {
    const listId = inp.getAttribute('list') || null;
    const dl = listId ? document.getElementById(listId) : null;
    out.push({
      id: inp.getAttribute('id') || null,
      name: inp.getAttribute('name') || null,
      listId,
      optionCount: dl ? dl.querySelectorAll('option').length : 0,
    });
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** Elements with .filter, [data-filter], or role="group" containing checkboxes/radios (max 20). */
export async function getFilterElements(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const candidates = Array.from(document.querySelectorAll(
    '.filter, [data-filter], [class*="filter"], [role="group"]'
  ));
  const out = [];
  for (const el of candidates) {
    const hasBooleanInput = el.querySelector('input[type="checkbox"], input[type="radio"]');
    if (!hasBooleanInput && el.getAttribute('role') === 'group') continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.getAttribute('id') || null,
      class: el.getAttribute('class') || null,
    });
    if (out.length >= 20) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** Buttons or selects that trigger sorting (aria-sort, .sort, [data-sort]) (max 10). */
export async function getSortElements(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const candidates = Array.from(document.querySelectorAll(
    '[aria-sort], .sort, [data-sort], [class*="sort"], button[class*="sort"], select[class*="sort"]'
  ));
  const out = [];
  for (const el of candidates) {
    const tag = el.tagName.toLowerCase();
    if (tag !== 'button' && tag !== 'select' && tag !== 'th' && tag !== 'td' && tag !== 'a' && tag !== 'span' && tag !== 'div') continue;
    out.push({
      tag,
      id: el.getAttribute('id') || null,
      text: (el.textContent || '').trim().slice(0, 60),
      currentSort: el.getAttribute('aria-sort') || el.getAttribute('data-sort') || null,
    });
    if (out.length >= 10) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** Primary search input by type="search" or role="searchbox" (first found). */
export async function getSearchBar(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const inp = document.querySelector('input[type="search"], input[role="searchbox"], [role="searchbox"]');
  if (!inp) return null;
  const value = (inp.value || inp.textContent || '').trim();
  return {
    id: inp.getAttribute('id') || null,
    name: inp.getAttribute('name') || null,
    placeholder: inp.getAttribute('placeholder') || null,
    value_preview: value.slice(0, 80) || null,
  };
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/** All <datalist> elements and their options (max 10 lists). */
export async function getDatalistOptions(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const lists = Array.from(document.querySelectorAll('datalist'));
  const out = [];
  for (const dl of lists) {
    const options = Array.from(dl.querySelectorAll('option')).map(o => ({
      value: o.getAttribute('value') || o.textContent || '',
      label: o.getAttribute('label') || (o.textContent || '').trim() || null,
    }));
    out.push({
      id: dl.getAttribute('id') || null,
      options,
    });
    if (out.length >= 10) break;
  }
  return out;
})())`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}
