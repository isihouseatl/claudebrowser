// src/cdp/search4.ts
// Search/filter UI helpers (batch 4)

import type CRI from 'chrome-remote-interface';

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * 1. Search input fields: type=search, role=searchbox, placeholder/name hints, aria-label hints.
 * Returns [{id, name, placeholder_preview, value_preview, type, class_preview}] (max 20).
 */
export async function getSearchInputs3(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var candidates = Array.from(document.querySelectorAll(
    'input[type="search"], input[role="searchbox"], [role="searchbox"], ' +
    'input[placeholder*="search" i], input[name*="search" i], input[aria-label*="search" i], ' +
    'input[placeholder*="find" i], input[name*="query" i], input[name*="q"]'
  ));
  var seen = new Set();
  var out = [];
  for (var i = 0; i < candidates.length && out.length < 20; i++) {
    var el = candidates[i];
    if (seen.has(el)) continue;
    seen.add(el);
    var ph = el.getAttribute('placeholder') || '';
    var val = el.value || '';
    var cls = el.getAttribute('class') || '';
    out.push({
      id: el.getAttribute('id') || null,
      name: el.getAttribute('name') || null,
      placeholder_preview: ph.slice(0, 80) || null,
      value_preview: val.slice(0, 80) || null,
      type: el.getAttribute('type') || el.tagName.toLowerCase(),
      class_preview: cls.slice(0, 80) || null
    });
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 2. Forms with search role, search-related action, or enclosing a search input.
 * Returns [{id, action_preview, method, inputCount}] (max 10).
 */
export async function getSearchForms3(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var forms = Array.from(document.querySelectorAll('form'));
  var out = [];
  for (var i = 0; i < forms.length && out.length < 10; i++) {
    var f = forms[i];
    var role = f.getAttribute('role') || '';
    var action = f.getAttribute('action') || '';
    var hasSearchInput = f.querySelector(
      'input[type="search"], input[role="searchbox"], [role="searchbox"], input[name*="search" i], input[name*="q"]'
    ) !== null;
    if (role !== 'search' && action.toLowerCase().indexOf('search') === -1 && !hasSearchInput) continue;
    out.push({
      id: f.getAttribute('id') || null,
      action_preview: action.slice(0, 80) || null,
      method: (f.getAttribute('method') || 'get').toLowerCase(),
      inputCount: f.querySelectorAll('input, textarea, select').length
    });
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 3. Elements matching search-result patterns via class/id/role/aria-label.
 * Returns [{tag, id, class_preview, text_preview}] (max 20).
 */
export async function getSearchResults2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var selectors = [
    '[role="listitem"]',
    '[class*="result" i]', '[id*="result" i]',
    '[class*="search-item" i]', '[class*="searchresult" i]',
    '[class*="hit" i]', '[class*="match" i]',
    '[aria-label*="result" i]'
  ];
  var seen = new Set();
  var out = [];
  for (var s = 0; s < selectors.length && out.length < 20; s++) {
    var els = Array.from(document.querySelectorAll(selectors[s]));
    for (var i = 0; i < els.length && out.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var cls = el.getAttribute('class') || '';
      var txt = (el.textContent || '').trim();
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || null,
        class_preview: cls.slice(0, 80) || null,
        text_preview: txt.slice(0, 100) || null
      });
    }
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 4. Filter UI elements: checkboxes, selects, toggle buttons with filter/facet hints.
 * Returns [{tag, id, class_preview, type, label_preview}] (max 20).
 */
export async function getFilterElements2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var selectors = [
    'input[type="checkbox"]',
    'select',
    '[role="checkbox"]',
    '[role="switch"]',
    '[class*="filter" i]',
    '[class*="facet" i]',
    '[data-filter]',
    '[aria-label*="filter" i]'
  ];
  var seen = new Set();
  var out = [];
  for (var s = 0; s < selectors.length && out.length < 20; s++) {
    var els = Array.from(document.querySelectorAll(selectors[s]));
    for (var i = 0; i < els.length && out.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var cls = el.getAttribute('class') || '';
      var lbl = '';
      var labelEl = el.id ? document.querySelector('label[for="' + el.id + '"]') : null;
      if (labelEl) {
        lbl = (labelEl.textContent || '').trim();
      } else if (el.getAttribute('aria-label')) {
        lbl = el.getAttribute('aria-label') || '';
      } else {
        lbl = (el.textContent || '').trim();
      }
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || null,
        class_preview: cls.slice(0, 80) || null,
        type: el.getAttribute('type') || el.getAttribute('role') || el.tagName.toLowerCase(),
        label_preview: lbl.slice(0, 80) || null
      });
    }
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 5. Sort/order controls: selects, buttons, links with sort/order hints.
 * Returns [{tag, id, class_preview, text_preview, isActive}] (max 20).
 */
export async function getSortControls(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var selectors = [
    'select[name*="sort" i]', 'select[id*="sort" i]', 'select[class*="sort" i]',
    '[class*="sort" i]', '[id*="sort" i]', '[data-sort]',
    '[aria-label*="sort" i]', '[aria-label*="order" i]',
    '[class*="order" i]', '[id*="order" i]',
    'button[class*="sort" i]', 'a[class*="sort" i]'
  ];
  var seen = new Set();
  var out = [];
  for (var s = 0; s < selectors.length && out.length < 20; s++) {
    var els = Array.from(document.querySelectorAll(selectors[s]));
    for (var i = 0; i < els.length && out.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var cls = el.getAttribute('class') || '';
      var txt = (el.textContent || el.getAttribute('value') || '').trim();
      var isActive = el.getAttribute('aria-selected') === 'true' ||
                     el.getAttribute('aria-pressed') === 'true' ||
                     cls.indexOf('active') !== -1 ||
                     cls.indexOf('selected') !== -1 ||
                     cls.indexOf('current') !== -1;
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || null,
        class_preview: cls.slice(0, 80) || null,
        text_preview: txt.slice(0, 80) || null,
        isActive: isActive
      });
    }
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 6. Inputs with autocomplete attribute or associated datalist element.
 * Returns [{id, autocomplete, listId, optionCount}] (max 20).
 */
export async function getAutocompleteInputs(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var inputs = Array.from(document.querySelectorAll('input[autocomplete], input[list]'));
  var datalistInputs = Array.from(document.querySelectorAll('datalist')).map(function(dl) {
    return document.querySelector('input[list="' + dl.id + '"]');
  }).filter(Boolean);
  var seen = new Set();
  var all = inputs.concat(datalistInputs);
  var out = [];
  for (var i = 0; i < all.length && out.length < 20; i++) {
    var el = all[i];
    if (!el || seen.has(el)) continue;
    seen.add(el);
    var listId = el.getAttribute('list') || null;
    var optCount = 0;
    if (listId) {
      var dl = document.getElementById(listId);
      if (dl) optCount = dl.querySelectorAll('option').length;
    }
    out.push({
      id: el.getAttribute('id') || null,
      autocomplete: el.getAttribute('autocomplete') || null,
      listId: listId,
      optionCount: optCount
    });
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 7. Visible autocomplete dropdown options (suggestion lists, combobox popups, datalist).
 * Returns [{tag, id, class_preview, text_preview}] (max 20).
 */
export async function getSearchSuggestions2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var selectors = [
    '[role="option"]',
    '[role="listbox"] [role="option"]',
    '[role="combobox"] + * [role="option"]',
    'datalist option',
    '[class*="suggestion" i]',
    '[class*="autocomplete" i] li',
    '[class*="dropdown" i] li',
    '[class*="typeahead" i] li',
    '[aria-label*="suggestion" i]'
  ];
  function isVisible(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  var seen = new Set();
  var out = [];
  for (var s = 0; s < selectors.length && out.length < 20; s++) {
    var els = Array.from(document.querySelectorAll(selectors[s]));
    for (var i = 0; i < els.length && out.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      if (!isVisible(el)) continue;
      var cls = el.getAttribute('class') || '';
      var txt = (el.textContent || el.getAttribute('value') || '').trim();
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || null,
        class_preview: cls.slice(0, 80) || null,
        text_preview: txt.slice(0, 80) || null
      });
    }
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 8. Active/selected filter indicators: aria-selected, aria-checked, active class hints.
 * Returns [{tag, id, class_preview, text_preview}] (max 20).
 */
export async function getActiveFilters(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var selectors = [
    '[aria-selected="true"]',
    '[aria-checked="true"]',
    'input[type="checkbox"]:checked',
    '[class*="active-filter" i]',
    '[class*="selected-filter" i]',
    '[class*="filter-tag" i]',
    '[class*="filter-chip" i]',
    '[class*="applied" i]',
    '[data-active="true"]',
    '[class*="facet" i] [class*="selected" i]',
    '[class*="facet" i] [class*="active" i]'
  ];
  var seen = new Set();
  var out = [];
  for (var s = 0; s < selectors.length && out.length < 20; s++) {
    var els = Array.from(document.querySelectorAll(selectors[s]));
    for (var i = 0; i < els.length && out.length < 20; i++) {
      var el = els[i];
      if (seen.has(el)) continue;
      seen.add(el);
      var cls = el.getAttribute('class') || '';
      var txt = '';
      if (el.tagName.toLowerCase() === 'input') {
        var lbl = el.id ? document.querySelector('label[for="' + el.id + '"]') : null;
        txt = lbl ? (lbl.textContent || '').trim() : (el.getAttribute('name') || el.getAttribute('value') || '');
      } else {
        txt = (el.textContent || '').trim();
      }
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || null,
        class_preview: cls.slice(0, 80) || null,
        text_preview: txt.slice(0, 80) || null
      });
    }
  }
  return out;
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}
