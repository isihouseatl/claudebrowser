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
