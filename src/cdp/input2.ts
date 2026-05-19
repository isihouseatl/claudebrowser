// src/cdp/input2.ts
// Form input inspection and manipulation tools.
// Distinct from input.ts (typeText, setValue, pressKey) and form2.ts (form-scoped queries).
// These functions operate on the full document and return MCP-style content responses.
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

// 1. Get all form input elements (input, textarea, select) on the page.
//    Returns a JSON array of { tag, type, name, id, placeholder, value, required, disabled }.
//    Limited to 30 elements.
export async function getAllInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 30);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.getAttribute('type') || 'text')),
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      placeholder: el.getAttribute('placeholder') || '',
      value: el.value || '',
      required: !!el.required,
      disabled: !!el.disabled,
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// 2. Get all inputs with the `required` attribute.
//    Returns a JSON array of { tag, type, name, id, placeholder }.
//    Limited to 20 elements.
export async function getRequiredInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input[required], textarea[required], select[required]')).slice(0, 20);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.getAttribute('type') || 'text')),
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      placeholder: el.getAttribute('placeholder') || '',
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// 3. Get all disabled inputs.
//    Returns a JSON array of { tag, type, name, id }.
//    Limited to 20 elements.
export async function getDisabledInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input:disabled, textarea:disabled, select:disabled')).slice(0, 20);
    return els.map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.getAttribute('type') || 'text')),
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// 4. Get the current value of all named inputs on the page.
//    Returns a JSON array of { name, id, tag, type, value }.
//    Limited to 30 elements.
export async function getInputValues(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input, textarea, select'))
      .filter(el => el.getAttribute('name') || el.getAttribute('id'))
      .slice(0, 30);
    return els.map(el => ({
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      tag: el.tagName.toLowerCase(),
      type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.getAttribute('type') || 'text')),
      value: el.value || '',
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  return ok(result.value);
}

// 5. Set the value on an input or textarea using the native value setter so
//    React/Vue/Angular state tracking fires correctly. Dispatches both
//    'input' and 'change' events with bubbles:true after setting.
export async function setInputValue(
  client: CdpClient,
  selector: string,
  value: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    var proto = Object.getPrototypeOf(el);
    var descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, ${JSON.stringify(value)});
    } else {
      el.value = ${JSON.stringify(value)};
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  if (!result.value) {
    return err(`Element not found: ${selector}`);
  }
  return ok('Value set');
}

// 6. Clear an input's value using the same native setter approach as setInputValue.
//    Dispatches 'input' and 'change' events after clearing.
export async function clearInputValue(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    var proto = Object.getPrototypeOf(el);
    var descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, '');
    } else {
      el.value = '';
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  if (!result.value) {
    return err(`Element not found: ${selector}`);
  }
  return ok('Input cleared');
}

// 7. Get the checked state of a checkbox or radio input.
//    Returns JSON of { checked, indeterminate, value } or an error if not found.
export async function getCheckboxState(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    return JSON.stringify({ checked: el.checked, indeterminate: el.indeterminate, value: el.value });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  if (result.value === null || result.value === undefined) {
    return err(`Element not found: ${selector}`);
  }
  return ok(result.value as string);
}

// 8. Set the checked state of a checkbox or radio input directly, then
//    dispatch a 'change' event with bubbles:true.
export async function setCheckboxState(
  client: CdpClient,
  selector: string,
  checked: boolean,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.checked = ${checked};
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  if (!result.value) {
    return err(`Element not found: ${selector}`);
  }
  return ok('Checkbox set');
}

// ─── Input Inspection Functions ───────────────────────────────────────────────
// The 8 functions below are pure inspection utilities: they query the DOM for
// specific input element categories and return structured JSON data. No mutation.

// 9. getAllInputs2 — find all <input>, <textarea>, <select> elements.
//    Returns { tag, type, name, id, placeholder, value, required, disabled, readonly }[].
//    Limited to 30 elements. (Renamed from getAllInputs to avoid conflict with the
//    existing getAllInputs export above.)
export async function getAllInputs2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 30);
    return JSON.stringify(els.map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.tagName === 'SELECT' ? 'select'
           : el.tagName === 'TEXTAREA' ? 'textarea'
           : (el.getAttribute('type') || 'text'),
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      placeholder: el.getAttribute('placeholder') || '',
      value: el.value || '',
      required: !!el.required,
      disabled: !!el.disabled,
      readonly: !!el.readOnly,
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 10. getPasswordInputs — find <input type="password"> elements.
//     Returns { id, name, autocomplete, hasValue }[]. Limited to 10.
export async function getPasswordInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input[type="password"]')).slice(0, 10);
    return JSON.stringify(els.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
      hasValue: el.value.length > 0,
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 11. getSearchInputs — find <input type="search"> or inputs with role="searchbox"
//     or name/id/placeholder containing "search".
//     Returns { id, name, placeholder, value }[]. Limited to 10.
export async function getSearchInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const all = Array.from(document.querySelectorAll('input'));
    const results = all.filter(el => {
      if (el.getAttribute('type') === 'search') return true;
      if (el.getAttribute('role') === 'searchbox') return true;
      const name = (el.getAttribute('name') || '').toLowerCase();
      const id = (el.getAttribute('id') || '').toLowerCase();
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      return name.includes('search') || id.includes('search') || ph.includes('search');
    }).slice(0, 10);
    return JSON.stringify(results.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      placeholder: el.getAttribute('placeholder') || '',
      value: el.value || '',
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 12. getTextareas — find all <textarea> elements.
//     Returns { id, name, placeholder, rows, cols, value_length, required, readonly }[].
//     Limited to 20.
export async function getTextareas(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('textarea')).slice(0, 20);
    return JSON.stringify(els.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      placeholder: el.getAttribute('placeholder') || '',
      rows: el.rows,
      cols: el.cols,
      value_length: el.value.length,
      required: !!el.required,
      readonly: !!el.readOnly,
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 13. getHiddenInputs — find <input type="hidden"> elements (carry form state).
//     Returns { name, id, value }[]. Limited to 30.
export async function getHiddenInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input[type="hidden"]')).slice(0, 30);
    return JSON.stringify(els.map(el => ({
      name: el.getAttribute('name') || '',
      id: el.getAttribute('id') || '',
      value: el.value || '',
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 14. getDateInputs — find date/time inputs:
//     type="date", "time", "datetime-local", "month", "week".
//     Returns { id, name, type, value, min, max }[]. Limited to 20.
export async function getDateInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const types = ['date', 'time', 'datetime-local', 'month', 'week'];
    const selector = types.map(t => 'input[type="' + t + '"]').join(', ');
    const els = Array.from(document.querySelectorAll(selector)).slice(0, 20);
    return JSON.stringify(els.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      type: el.getAttribute('type') || '',
      value: el.value || '',
      min: el.getAttribute('min') || '',
      max: el.getAttribute('max') || '',
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 15. getFileInputs — find <input type="file"> elements.
//     Returns { id, name, accept, multiple, hasFiles }[]. Limited to 10.
export async function getFileInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input[type="file"]')).slice(0, 10);
    return JSON.stringify(els.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      accept: el.getAttribute('accept') || '',
      multiple: !!el.multiple,
      hasFiles: el.files ? el.files.length > 0 : false,
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 16. getRangeInputs — find <input type="range"> and <input type="number"> elements.
//     Returns { id, name, type, value, min, max, step }[]. Limited to 20.
export async function getRangeInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(() => {
    const els = Array.from(document.querySelectorAll('input[type="range"], input[type="number"]')).slice(0, 20);
    return JSON.stringify(els.map(el => ({
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      type: el.getAttribute('type') || '',
      value: el.value || '',
      min: el.getAttribute('min') || '',
      max: el.getAttribute('max') || '',
      step: el.getAttribute('step') || '',
    })));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// ─── Advanced Form Introspection Functions ────────────────────────────────────
// The 8 functions below extend input2 with deeper introspection: value previews,
// grouped radio buttons, select option counts, and richer textarea metadata.
// Naming: suffix 3/2 added where prior exports conflict.

// 17. getAllInputs3 — all input elements with value_preview (truncated to 50 chars).
//     Returns { tag, type, id, name, value_preview, placeholder, required, disabled }[].
//     Limited to 30 elements.
//     (getAllInputs and getAllInputs2 already exported above — this is the third variant.)
export async function getAllInputs3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 30);
    var result = els.map(function(el) {
      var raw = el.value || '';
      return {
        tag: el.tagName.toLowerCase(),
        type: el.tagName === 'SELECT' ? 'select'
            : el.tagName === 'TEXTAREA' ? 'textarea'
            : (el.getAttribute('type') || 'text'),
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        value_preview: raw.length > 50 ? raw.slice(0, 50) + '...' : raw,
        placeholder: el.getAttribute('placeholder') || '',
        required: !!el.required,
        disabled: !!el.disabled,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 18. getTextInputs — text/email/tel/url/search inputs.
//     Returns { id, name, value_preview, placeholder }[]. Limited to 20 elements.
export async function getTextInputs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var types = ['text', 'email', 'tel', 'url', 'search'];
    var selector = types.map(function(t) { return 'input[type="' + t + '"]'; }).join(', ') + ', input:not([type])';
    var els = Array.from(document.querySelectorAll(selector)).slice(0, 20);
    var result = els.map(function(el) {
      var raw = el.value || '';
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        value_preview: raw.length > 50 ? raw.slice(0, 50) + '...' : raw,
        placeholder: el.getAttribute('placeholder') || '',
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 19. getPasswordInputs2 — password inputs with autocomplete attribute.
//     Returns { id, name, autocomplete }[]. Limited to 10 elements.
//     (getPasswordInputs already exported above — this variant omits hasValue for privacy.)
export async function getPasswordInputs2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="password"]')).slice(0, 10);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        autocomplete: el.getAttribute('autocomplete') || '',
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 20. getCheckboxes — all checkbox inputs.
//     Returns { id, name, checked, value }[]. Limited to 20 elements.
export async function getCheckboxes(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="checkbox"]')).slice(0, 20);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        checked: !!el.checked,
        value: el.getAttribute('value') || '',
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 21. getRadioButtons — radio buttons grouped by name attribute.
//     Returns { name, options: [{ value, checked }] }[]. Limited to 10 groups.
export async function getRadioButtons(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="radio"]'));
    var groupMap = {};
    els.forEach(function(el) {
      var name = el.getAttribute('name') || '__unnamed__';
      if (!groupMap[name]) groupMap[name] = [];
      groupMap[name].push({ value: el.getAttribute('value') || '', checked: !!el.checked });
    });
    var groups = Object.keys(groupMap).slice(0, 10).map(function(name) {
      return { name: name, options: groupMap[name] };
    });
    return JSON.stringify(groups);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 22. getSelectElements — select dropdowns with selected value and option count.
//     Returns { id, name, selectedValue, optionCount }[]. Limited to 20 elements.
export async function getSelectElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('select')).slice(0, 20);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        selectedValue: el.value || '',
        optionCount: el.options ? el.options.length : 0,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 23. getTextareas2 — textareas with value_preview and maxlength.
//     Returns { id, name, value_preview, maxlength, rows }[]. Limited to 20 elements.
//     (getTextareas already exported above — this variant adds value_preview and maxlength.)
export async function getTextareas2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('textarea')).slice(0, 20);
    var result = els.map(function(el) {
      var raw = el.value || '';
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        value_preview: raw.length > 50 ? raw.slice(0, 50) + '...' : raw,
        maxlength: el.getAttribute('maxlength') ? parseInt(el.getAttribute('maxlength'), 10) : null,
        rows: el.rows || null,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 24. getFileInputs2 — file inputs with accept and multiple attributes.
//     Returns { id, name, accept, multiple }[]. Limited to 10 elements.
//     (getFileInputs already exported above — this variant omits hasFiles for a leaner response.)
export async function getFileInputs2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="file"]')).slice(0, 10);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        accept: el.getAttribute('accept') || '',
        multiple: !!el.multiple,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// ─── Form/Input Inspection — Batch 3 ─────────────────────────────────────────
// Functions 25-32. Each takes (cdp: any) for compatibility with server.ts call
// sites that pass the raw cdp object rather than a typed CdpClient.

// 25. getTextInputs2 — text/email/search/tel/url inputs with type, placeholder
//     preview, value preview (80 chars), and required flag.
//     Returns { id, name, type, placeholder_preview, value_preview, required }[].
//     Limited to 20 elements.
//     (getTextInputs already exported above — this adds type and required.)
export async function getTextInputs2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var types = ['text', 'email', 'search', 'tel', 'url'];
    var selector = types.map(function(t) { return 'input[type="' + t + '"]'; }).join(', ') + ', input:not([type])';
    var els = Array.from(document.querySelectorAll(selector)).slice(0, 20);
    var result = els.map(function(el) {
      var ph = el.getAttribute('placeholder') || '';
      var val = el.value || '';
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        type: el.getAttribute('type') || 'text',
        placeholder_preview: ph.length > 80 ? ph.slice(0, 80) + '...' : ph,
        value_preview: val.length > 80 ? val.slice(0, 80) + '...' : val,
        required: !!el.required,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 26. getSelectElements2 — select dropdowns with optionCount, selectedValue,
//     and multiple flag.
//     Returns { id, name, optionCount, selectedValue, multiple }[].
//     Limited to 20 elements.
//     (getSelectElements already exported above — this adds the multiple field.)
export async function getSelectElements2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('select')).slice(0, 20);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        optionCount: el.options ? el.options.length : 0,
        selectedValue: el.value || '',
        multiple: !!el.multiple,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 27. getTextareaElements — all <textarea> elements with placeholder preview,
//     value preview (80 chars), rows, cols.
//     Returns { id, name, placeholder_preview, value_preview, rows, cols }[].
//     Limited to 20 elements.
export async function getTextareaElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('textarea')).slice(0, 20);
    var result = els.map(function(el) {
      var ph = el.getAttribute('placeholder') || '';
      var val = el.value || '';
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        placeholder_preview: ph.length > 80 ? ph.slice(0, 80) + '...' : ph,
        value_preview: val.length > 80 ? val.slice(0, 80) + '...' : val,
        rows: el.rows || null,
        cols: el.cols || null,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 28. getCheckboxes2 — all checkbox inputs with id, name, value, checked, and
//     required flag.
//     Returns { id, name, value, checked, required }[]. Limited to 20 elements.
//     (getCheckboxes already exported above — this adds the required field.)
export async function getCheckboxes2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="checkbox"]')).slice(0, 20);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        value: el.getAttribute('value') || '',
        checked: !!el.checked,
        required: !!el.required,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 29. getRadioGroups — radio inputs grouped by name, with optionCount and the
//     currently selected value (or null if none checked).
//     Returns { name, optionCount, selectedValue }[]. Limited to 20 groups.
export async function getRadioGroups(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="radio"]'));
    var groupMap = {};
    els.forEach(function(el) {
      var name = el.getAttribute('name') || '__unnamed__';
      if (!groupMap[name]) groupMap[name] = { count: 0, selected: null };
      groupMap[name].count++;
      if (el.checked) groupMap[name].selected = el.getAttribute('value') || '';
    });
    var groups = Object.keys(groupMap).slice(0, 20).map(function(name) {
      return {
        name: name,
        optionCount: groupMap[name].count,
        selectedValue: groupMap[name].selected,
      };
    });
    return JSON.stringify(groups);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 30. getFormValidation2 — forms with HTML5 validation attributes. For each
//     <form>, counts total fields, fields with required, and fields with pattern.
//     Returns { id, action, fieldCount, requiredCount, patternCount }[].
//     Limited to 10 forms.
//     (getFormValidation is already exported from form2.ts — this variant operates
//     on the full document without a selector argument.)
export async function getFormValidation2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var forms = Array.from(document.querySelectorAll('form')).slice(0, 10);
    var result = forms.map(function(form) {
      var fields = Array.from(form.querySelectorAll('input, textarea, select'));
      var requiredCount = fields.filter(function(f) { return !!f.required; }).length;
      var patternCount = fields.filter(function(f) { return !!f.getAttribute('pattern'); }).length;
      return {
        id: form.getAttribute('id') || '',
        action: form.getAttribute('action') || '',
        fieldCount: fields.length,
        requiredCount: requiredCount,
        patternCount: patternCount,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 31. getSubmitButtons — all submit buttons (<button type="submit">, <button>
//     inside a form without a type, and <input type="submit">).
//     Returns { tag, id, text_preview, form_id, disabled }[]. Limited to 20.
export async function getSubmitButtons(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var submitBtns = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'));
    var defaultBtns = Array.from(document.querySelectorAll('button:not([type])')).filter(function(btn) {
      return !!btn.closest('form');
    });
    var all = submitBtns.concat(defaultBtns).slice(0, 20);
    var seen = new Set();
    var result = [];
    all.forEach(function(el) {
      if (seen.has(el)) return;
      seen.add(el);
      var rawText = el.tagName === 'INPUT'
        ? (el.getAttribute('value') || '')
        : (el.textContent || '');
      var trimmed = rawText.trim();
      var form = el.form || el.closest('form');
      result.push({
        tag: el.tagName.toLowerCase(),
        id: el.getAttribute('id') || '',
        text_preview: trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed,
        form_id: form ? (form.getAttribute('id') || '') : '',
        disabled: !!el.disabled,
      });
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

// 32. getFileInputs3 — file inputs with id, name, accept, multiple, and required.
//     Returns { id, name, accept, multiple, required }[]. Limited to 20 elements.
//     (getFileInputs and getFileInputs2 already exported above — this variant adds
//     required and raises the limit to 20.)
export async function getFileInputs3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var els = Array.from(document.querySelectorAll('input[type="file"]')).slice(0, 20);
    var result = els.map(function(el) {
      return {
        id: el.getAttribute('id') || '',
        name: el.getAttribute('name') || '',
        accept: el.getAttribute('accept') || '',
        multiple: !!el.multiple,
        required: !!el.required,
      };
    });
    return JSON.stringify(result);
  })()`;
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    const msg = exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error';
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
  }
  const parsed: unknown = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}
