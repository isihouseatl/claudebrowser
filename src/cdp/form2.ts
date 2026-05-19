// src/cdp/form2.ts
// Form inspection and validation module.
// Distinct from autofill.ts (fillForm, detectFormFields, submitForm, clearForm, getFormState)
// and dom.ts utilities.
import type { CdpClient } from './client';

/**
 * List all input/textarea/select fields inside a form with their key properties.
 */
export async function getFormFields(
  client: CdpClient,
  formSelector: string,
): Promise<Array<{ name: string; type: string; value: string; required: boolean; disabled: boolean; placeholder: string }>> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  const fields = Array.from(form.querySelectorAll('input, textarea, select'));
  return fields.map(el => ({
    name: el.name || '',
    type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.type || 'text')),
    value: el.value || '',
    required: !!el.required,
    disabled: !!el.disabled,
    placeholder: el.placeholder || '',
  }));
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getFormFields: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as Array<{ name: string; type: string; value: string; required: boolean; disabled: boolean; placeholder: string }>;
}

/**
 * Trigger constraint validation on all fields and return those with errors
 * as {name, message} pairs.
 */
export async function getFormValidationErrors(
  client: CdpClient,
  formSelector: string,
): Promise<Array<{ name: string; message: string }>> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  const fields = Array.from(form.querySelectorAll('input, textarea, select'));
  const errors = [];
  for (const el of fields) {
    if (!el.validity.valid) {
      errors.push({ name: el.name || '', message: el.validationMessage || '' });
    }
  }
  return errors;
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getFormValidationErrors: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as Array<{ name: string; message: string }>;
}

/**
 * Return whether all fields in the form satisfy their constraints
 * (equivalent to form.checkValidity()).
 */
export async function isFormValid(
  client: CdpClient,
  formSelector: string,
): Promise<boolean> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  return form.checkValidity();
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in isFormValid: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as boolean;
}

/**
 * Return the names of all required fields in the form.
 */
export async function getRequiredFields(
  client: CdpClient,
  formSelector: string,
): Promise<string[]> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  const fields = Array.from(form.querySelectorAll('input[required], textarea[required], select[required]'));
  return fields.map(el => el.name || '');
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getRequiredFields: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as string[];
}

/**
 * Return the names of required fields whose current value is empty or blank.
 */
export async function getEmptyRequiredFields(
  client: CdpClient,
  formSelector: string,
): Promise<string[]> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  const fields = Array.from(form.querySelectorAll('input[required], textarea[required], select[required]'));
  return fields
    .filter(el => (el.value || '').trim() === '')
    .map(el => el.name || '');
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getEmptyRequiredFields: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as string[];
}

/**
 * List all options in a select element with their value, display text, and
 * selected state.
 * Named listSelectOptions to avoid collision with getSelectOptions in element.ts.
 */
export async function listSelectOptions(
  client: CdpClient,
  selector: string,
): Promise<Array<{ value: string; text: string; selected: boolean }>> {
  const expression = `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el || el.tagName !== 'SELECT') return null;
  return Array.from(el.options).map(opt => ({
    value: opt.value,
    text: opt.text,
    selected: opt.selected,
  }));
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in listSelectOptions: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Select element not found or not a <select>: ${selector}`);
  }
  return result.value as Array<{ value: string; text: string; selected: boolean }>;
}

/**
 * For a multi-select element, set exactly the provided values as selected,
 * deselecting any options not in the array.
 */
export async function setMultipleSelectValues(
  client: CdpClient,
  selector: string,
  values: string[],
): Promise<void> {
  const expression = `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el || el.tagName !== 'SELECT') return false;
  const targetValues = new Set(${JSON.stringify(values)});
  for (const opt of el.options) {
    opt.selected = targetValues.has(opt.value);
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in setMultipleSelectValues: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === false || result.value === null || result.value === undefined) {
    throw new Error(`Select element not found or not a <select>: ${selector}`);
  }
}

/**
 * Return the names of all checked checkboxes within the form.
 */
export async function getCheckedCheckboxes(
  client: CdpClient,
  formSelector: string,
): Promise<string[]> {
  const expression = `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  if (!form) return null;
  const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"]'));
  return checkboxes
    .filter(el => el.checked)
    .map(el => el.name || '');
})()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error in getCheckedCheckboxes: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Form not found: ${formSelector}`);
  }
  return result.value as string[];
}

// ---------------------------------------------------------------------------
// New form inspection and interaction tools (8 exported functions)
// Naming: getForms, getFormFields2, getSelectOptions2, setSelectOption,
//         getRadioGroup, getFormValidation, submitForm2, resetForm2
// (suffix "2" applied where names conflict with existing server.ts imports)
// ---------------------------------------------------------------------------

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function errResult(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

/**
 * 1. getForms — list all forms on the page (max 10).
 * Returns: action, method, id, name, elementCount for each form.
 */
export async function getForms(client: CdpClient): Promise<ToolResult> {
  const expression = `(() => {
    const forms = Array.from(document.querySelectorAll('form')).slice(0, 10);
    return forms.map(f => ({
      action: f.action || '',
      method: f.method || 'get',
      id: f.id || '',
      name: f.name || '',
      elementCount: f.elements.length,
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  return ok(result.value);
}

/**
 * 2. getFormFields2 — get all fields inside a form.
 * Returns: type, name, id, value, required, disabled for each field.
 * (suffix "2" — getFormFields is already exported above and imported in server.ts)
 */
export async function getFormFields2(client: CdpClient, formSelector: string): Promise<ToolResult> {
  const expression = `(() => {
    const form = document.querySelector(${JSON.stringify(formSelector)});
    if (!form) return null;
    const fields = Array.from(form.querySelectorAll('input, textarea, select'));
    return fields.map(el => {
      const tag = el.tagName;
      const type = tag === 'SELECT' ? 'select' : (tag === 'TEXTAREA' ? 'textarea' : (el.type || 'text'));
      const value = tag === 'SELECT' && el.multiple
        ? Array.from(el.selectedOptions).map(o => o.value)
        : (el.value || '');
      return {
        type,
        name: el.name || '',
        id: el.id || '',
        value,
        required: !!el.required,
        disabled: !!el.disabled,
      };
    });
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  if (result.value === null || result.value === undefined) return errResult(`Form not found: ${formSelector}`);
  return ok(result.value);
}

/**
 * 3. getSelectOptions2 — get all <option> elements inside a <select>.
 * Returns: value, text, selected, disabled for each option.
 * (suffix "2" — getSelectOptions is already imported from element.ts in server.ts)
 */
export async function getSelectOptions2(client: CdpClient, selector: string): Promise<ToolResult> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el || el.tagName !== 'SELECT') return null;
    return Array.from(el.options).map(opt => ({
      value: opt.value,
      text: opt.text,
      selected: opt.selected,
      disabled: opt.disabled,
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  if (result.value === null || result.value === undefined) return errResult(`Select element not found or not a <select>: ${selector}`);
  return ok(result.value);
}

/**
 * 4. setSelectOption — select an <option> by value using native setter + change event.
 */
export async function setSelectOption(client: CdpClient, selector: string, value: string): Promise<ToolResult> {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el || el.tagName !== 'SELECT') return { ok: false, error: 'Element not found or not a <select>' };
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, ${JSON.stringify(value)});
    } else {
      el.value = ${JSON.stringify(value)};
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, value: el.value };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  const val = result.value as { ok: boolean; error?: string; value?: string } | null;
  if (!val || !val.ok) return errResult(val?.error ?? 'setSelectOption failed');
  return ok({ set: true, value: val.value });
}

/**
 * 5. getRadioGroup — get all radio inputs with a given name.
 * Returns: value, checked, id, disabled for each radio.
 */
export async function getRadioGroup(client: CdpClient, name: string): Promise<ToolResult> {
  const nameJson = JSON.stringify(name);
  const expression = `(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="radio"][name=' + ${nameJson} + ']'));
    if (inputs.length === 0) return null;
    return inputs.map(el => ({
      value: el.value || '',
      checked: el.checked,
      id: el.id || '',
      disabled: el.disabled,
    }));
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  if (result.value === null || result.value === undefined) return errResult(`No radio inputs found with name: ${name}`);
  return ok(result.value);
}

/**
 * 6. getFormValidation — check form validity.
 * Returns: isValid, invalidFields with name + validationMessage.
 */
export async function getFormValidation(client: CdpClient, formSelector: string): Promise<ToolResult> {
  const expression = `(() => {
    const form = document.querySelector(${JSON.stringify(formSelector)});
    if (!form) return null;
    const isValid = form.checkValidity();
    const fields = Array.from(form.querySelectorAll('input, textarea, select'));
    const invalidFields = fields
      .filter(el => !el.validity.valid)
      .map(el => ({ name: el.name || el.id || '', validationMessage: el.validationMessage || '' }));
    return { isValid, invalidFields };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  if (result.value === null || result.value === undefined) return errResult(`Form not found: ${formSelector}`);
  return ok(result.value);
}

/**
 * 7. submitForm2 — dispatch submit event on form element.
 * (suffix "2" — submitForm is already imported from dom.ts in server.ts)
 */
export async function submitForm2(client: CdpClient, formSelector: string): Promise<ToolResult> {
  const expression = `(() => {
    const form = document.querySelector(${JSON.stringify(formSelector)});
    if (!form) return { ok: false, error: 'Form not found' };
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return { ok: true };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  const val = result.value as { ok: boolean; error?: string } | null;
  if (!val || !val.ok) return errResult(val?.error ?? 'submitForm2 failed');
  return ok('Form submit event dispatched');
}

/**
 * 8. resetForm2 — call form.reset() to clear all fields.
 * (suffix "2" — resetForm is already imported from dom.ts in server.ts)
 */
export async function resetForm2(client: CdpClient, formSelector: string): Promise<ToolResult> {
  const expression = `(() => {
    const form = document.querySelector(${JSON.stringify(formSelector)});
    if (!form) return { ok: false, error: 'Form not found' };
    form.reset();
    return { ok: true };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return errResult(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  const val = result.value as { ok: boolean; error?: string } | null;
  if (!val || !val.ok) return errResult(val?.error ?? 'resetForm2 failed');
  return ok('Form reset');
}
