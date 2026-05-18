// src/cdp/form2.ts
// Form inspection and validation module.
// Distinct from autofill.ts (fillForm, detectFormFields, submitForm, clearForm, getFormState)
// and dom.ts utilities.
import { CdpClient } from './client';

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
