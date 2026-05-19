// src/cdp/search3.ts
// Search/text-finding helpers (batch 3)

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * 1. Inputs with type=search, role=searchbox, or name containing "search".
 * Returns [{id, name, type, placeholder_preview, ariaLabel_preview}] (max 10).
 */
export async function getSearchInputs2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var els = Array.from(document.querySelectorAll(
    'input[type="search"], input[role="searchbox"], [role="searchbox"], input[name*="search" i]'
  ));
  var seen = [];
  var out = [];
  for (var i = 0; i < els.length && out.length < 10; i++) {
    var el = els[i];
    if (seen.indexOf(el) !== -1) continue;
    seen.push(el);
    var ph = el.getAttribute('placeholder') || '';
    var aria = el.getAttribute('aria-label') || '';
    out.push({
      id: el.getAttribute('id') || null,
      name: el.getAttribute('name') || null,
      type: el.getAttribute('type') || el.tagName.toLowerCase(),
      placeholder_preview: ph.slice(0, 80) || null,
      ariaLabel_preview: aria.slice(0, 80) || null
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
 * 2. Forms with role=search or action containing "search".
 * Returns [{id, action_preview, method, inputCount}] (max 10).
 */
export async function getSearchForms2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var forms = Array.from(document.querySelectorAll('form'));
  var out = [];
  for (var i = 0; i < forms.length && out.length < 10; i++) {
    var f = forms[i];
    var role = f.getAttribute('role') || '';
    var action = f.getAttribute('action') || '';
    if (role !== 'search' && action.toLowerCase().indexOf('search') === -1) continue;
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
 * 3. Elements with <mark> tags or background-color highlight.
 * Returns [{tag, id, text_preview}] (max 20).
 */
export async function getHighlightedText(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var marks = Array.from(document.querySelectorAll('mark'));
  var out = [];
  for (var i = 0; i < marks.length && out.length < 20; i++) {
    var m = marks[i];
    var parent = m.parentElement;
    out.push({
      tag: parent ? parent.tagName.toLowerCase() : 'mark',
      id: (parent && parent.getAttribute('id')) || null,
      text_preview: (m.textContent || '').trim().slice(0, 80)
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
 * 4. Visible text grouped by semantic element.
 * Returns {h1[], h2[], h3[], p_count, li_count}.
 */
export async function getTextBySelector2(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  function texts(sel) {
    return Array.from(document.querySelectorAll(sel)).map(function(el) {
      return (el.textContent || '').trim().slice(0, 80);
    }).filter(function(t) { return t.length > 0; });
  }
  return {
    h1: texts('h1'),
    h2: texts('h2'),
    h3: texts('h3'),
    p_count: document.querySelectorAll('p').length,
    li_count: document.querySelectorAll('li').length
  };
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 5. Word and character count of visible text.
 * Returns {wordCount, charCount, paragraphCount}.
 */
export async function getWordCount(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var text = (document.body.innerText || '').trim();
  var words = text.length > 0 ? text.split(/\\s+/).filter(function(w) { return w.length > 0; }) : [];
  return {
    wordCount: words.length,
    charCount: text.length,
    paragraphCount: document.querySelectorAll('p').length
  };
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 6. All <a> text content.
 * Returns [{href_preview, text_preview, isExternal}] (max 30).
 */
export async function getLinkTexts(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var host = location.hostname;
  var els = Array.from(document.querySelectorAll('a')).slice(0, 30);
  return els.map(function(el) {
    var href = el.getAttribute('href') || '';
    var isExternal = /^https?:\\/\\//.test(href) && href.indexOf(host) === -1;
    return {
      href_preview: href.slice(0, 80),
      text_preview: (el.textContent || '').trim().slice(0, 80),
      isExternal: isExternal
    };
  });
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 7. All button text content.
 * Returns [{tag, id, type, text_preview, disabled}] (max 30).
 */
export async function getButtonTexts(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var els = Array.from(document.querySelectorAll(
    'button, input[type="button"], input[type="submit"], input[type="reset"]'
  )).slice(0, 30);
  return els.map(function(el) {
    var text = el.tagName.toLowerCase() === 'input'
      ? (el.getAttribute('value') || el.getAttribute('type') || '')
      : (el.textContent || '').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.getAttribute('id') || null,
      type: el.getAttribute('type') || null,
      text_preview: text.trim().slice(0, 80),
      disabled: el.hasAttribute('disabled')
    };
  });
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}

/**
 * 8. All <label> elements.
 * Returns [{id, forAttr, text_preview, wrapsInput}] (max 20).
 * wrapsInput = label contains an input element.
 */
export async function getLabelTexts(cdp: any): Promise<McpResult> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  var els = Array.from(document.querySelectorAll('label')).slice(0, 20);
  return els.map(function(el) {
    return {
      id: el.getAttribute('id') || null,
      forAttr: el.getAttribute('for') || null,
      text_preview: (el.textContent || '').trim().slice(0, 80),
      wrapsInput: el.querySelector('input') !== null
    };
  });
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown');
  try { return ok(JSON.parse(result.value as string)); } catch { return ok(result.value); }
}
