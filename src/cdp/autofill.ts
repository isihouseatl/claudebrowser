// src/cdp/autofill.ts
import { CdpClient } from './client';

export interface FormField {
  selector: string;
  value: string;
  checked?: boolean; // for checkbox/radio
}

export interface FillResult {
  selector: string;
  success: boolean;
  error?: string;
}

export interface DetectedField {
  selector: string;
  type: string;
  name?: string;
  id?: string;
  placeholder?: string;
  label?: string;
  currentValue?: string;
}

export interface FieldState {
  selector: string;
  type: string;
  value: string;
  checked?: boolean;
}

// -------------------------------------------------------------------------
// fillForm
// -------------------------------------------------------------------------

/**
 * Fill multiple form fields in sequence.
 * Dispatches the correct strategy per element type (text/email/password/search/
 * tel/url, textarea, checkbox/radio, range, date/time/datetime-local, select).
 * Returns a FillResult per field — never throws; errors are captured in the result.
 */
export async function fillForm(
  client: CdpClient,
  fields: FormField[],
): Promise<FillResult[]> {
  const results: FillResult[] = [];

  for (const field of fields) {
    const { selector, value, checked } = field;

    try {
      // Detect element type inside the browser so we can pick the right strategy.
      const { result: typeResult, exceptionDetails: typeEx } =
        await client.raw.Runtime.evaluate({
          expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const tag = el.tagName.toLowerCase();
  const type = (el.type || '').toLowerCase();
  return { tag, type };
})()`,
          returnByValue: true,
        });

      if (typeEx) {
        throw new Error(
          typeEx.exception?.description ?? typeEx.text ?? 'JS error detecting element type',
        );
      }

      if (typeResult.value === null || typeResult.value === undefined) {
        throw new Error(`Element not found: ${selector}`);
      }

      const { tag, type } = typeResult.value as { tag: string; type: string };

      if (tag === 'select') {
        // Select by value attribute first, then by visible text
        const { result: selResult, exceptionDetails: selEx } =
          await client.raw.Runtime.evaluate({
            expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { found: false, selected: false };
  const opts = Array.from(el.options);
  let match = opts.find(o => o.value === ${JSON.stringify(value)});
  if (!match) match = opts.find(o => o.textContent.trim() === ${JSON.stringify(value)});
  if (!match) return { found: true, selected: false };
  el.value = match.value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return { found: true, selected: true };
})()`,
            returnByValue: true,
          });

        if (selEx) {
          throw new Error(selEx.exception?.description ?? selEx.text ?? 'JS error in select fill');
        }
        const res = selResult.value as { found: boolean; selected: boolean };
        if (!res.found) throw new Error(`Element not found: ${selector}`);
        if (!res.selected) throw new Error(`Option not found in <select>: ${value}`);

      } else if (type === 'checkbox' || type === 'radio') {
        // Set checked state via JS if it differs from desired
        const desiredChecked = checked !== undefined ? checked : value === 'true';
        const { result: chkResult, exceptionDetails: chkEx } =
          await client.raw.Runtime.evaluate({
            expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const desired = ${JSON.stringify(desiredChecked)};
  if (el.checked !== desired) {
    el.checked = desired;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
})()`,
            returnByValue: true,
          });

        if (chkEx) {
          throw new Error(chkEx.exception?.description ?? chkEx.text ?? 'JS error in checkbox fill');
        }
        if (!chkResult.value) throw new Error(`Element not found: ${selector}`);

      } else if (type === 'range') {
        // Native value setter + dispatch for range sliders (React/Vue safe)
        const { result: rangeResult, exceptionDetails: rangeEx } =
          await client.raw.Runtime.evaluate({
            expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (nativeSet) nativeSet.call(el, ${JSON.stringify(value)});
  else el.value = ${JSON.stringify(value)};
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`,
            returnByValue: true,
          });

        if (rangeEx) {
          throw new Error(rangeEx.exception?.description ?? rangeEx.text ?? 'JS error in range fill');
        }
        if (!rangeResult.value) throw new Error(`Element not found: ${selector}`);

      } else if (type === 'date' || type === 'time' || type === 'datetime-local') {
        // Native value setter for date/time inputs
        const { result: dtResult, exceptionDetails: dtEx } =
          await client.raw.Runtime.evaluate({
            expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (nativeSet) nativeSet.call(el, ${JSON.stringify(value)});
  else el.value = ${JSON.stringify(value)};
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`,
            returnByValue: true,
          });

        if (dtEx) {
          throw new Error(dtEx.exception?.description ?? dtEx.text ?? 'JS error in date/time fill');
        }
        if (!dtResult.value) throw new Error(`Element not found: ${selector}`);

      } else {
        // text, email, password, search, tel, url, textarea — and anything else
        // Clear first via native setter (empty string), then set the new value.
        const { result: txtResult, exceptionDetails: txtEx } =
          await client.raw.Runtime.evaluate({
            expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  const setter = inputSetter ?? textareaSetter;
  if (setter) {
    setter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(el, ${JSON.stringify(value)});
  } else {
    el.value = ${JSON.stringify(value)};
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`,
            returnByValue: true,
          });

        if (txtEx) {
          throw new Error(txtEx.exception?.description ?? txtEx.text ?? 'JS error in text fill');
        }
        if (!txtResult.value) throw new Error(`Element not found: ${selector}`);
      }

      results.push({ selector, success: true });
    } catch (err) {
      results.push({
        selector,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

// -------------------------------------------------------------------------
// detectFormFields
// -------------------------------------------------------------------------

/**
 * Scan the page (or a specific form) for all fillable fields.
 * Returns unique selectors, preferring #id, then [name=...], then nth-of-type.
 * Resolves label text from <label for="id"> or a wrapping <label>.
 */
export async function detectFormFields(
  client: CdpClient,
  formSelector?: string,
): Promise<DetectedField[]> {
  const rootExpr = formSelector
    ? `document.querySelector(${JSON.stringify(formSelector)})`
    : 'document';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const root = ${rootExpr};
  if (!root) return null;
  const candidates = Array.from(
    root.querySelectorAll('input, textarea, select')
  ).filter(el => {
    const type = (el.type || '').toLowerCase();
    return type !== 'hidden' && type !== 'submit' && type !== 'button' &&
           type !== 'reset' && type !== 'image' && type !== 'file';
  });

  return candidates.map((el, idx) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || tag).toLowerCase();
    const id = el.id || undefined;
    const name = el.name || undefined;
    const placeholder = el.placeholder || undefined;

    // Build unique selector: prefer #id, then [name=...], then nth-of-type
    let selector;
    if (id) {
      selector = '#' + CSS.escape(id);
    } else if (name) {
      selector = tag + '[name=' + CSS.escape(name) + ']';
    } else {
      const siblings = Array.from(document.querySelectorAll(tag));
      const nthIdx = siblings.indexOf(el) + 1;
      selector = tag + ':nth-of-type(' + nthIdx + ')';
    }

    // Resolve label text
    let label;
    if (id) {
      const labelEl = document.querySelector('label[for=' + CSS.escape(id) + ']');
      if (labelEl) label = labelEl.textContent.trim();
    }
    if (!label) {
      const wrapping = el.closest('label');
      if (wrapping) {
        // Clone to remove nested input text noise
        const clone = wrapping.cloneNode(true);
        clone.querySelectorAll('input, select, textarea').forEach(n => n.remove());
        label = clone.textContent.trim() || undefined;
      }
    }

    // Current value
    let currentValue;
    if (type === 'checkbox' || type === 'radio') {
      currentValue = el.checked ? 'true' : 'false';
    } else {
      currentValue = el.value || undefined;
    }

    return { selector, type, name, id, placeholder, label, currentValue };
  });
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(
      formSelector ? `Form not found: ${formSelector}` : 'Failed to scan document',
    );
  }

  return result.value as DetectedField[];
}

// -------------------------------------------------------------------------
// submitForm
// -------------------------------------------------------------------------

/**
 * Find a submit button within the form (or first form on page) and click it.
 * Falls back to form.submit() / form.requestSubmit() if no button is found.
 */
export async function submitForm(
  client: CdpClient,
  formSelector?: string,
): Promise<void> {
  const formExpr = formSelector
    ? `document.querySelector(${JSON.stringify(formSelector)})`
    : 'document.querySelector("form")';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const form = ${formExpr};
  if (!form) return { found: false, clicked: false };

  // Look for submit triggers inside the form (or when formSelector points to a form itself)
  const searchRoot = (form.tagName && form.tagName.toLowerCase() === 'form') ? form : form;
  const btn =
    searchRoot.querySelector('[type=submit]') ||
    searchRoot.querySelector('button[type=submit]') ||
    searchRoot.querySelector('button:not([type=button]):not([type=reset])');

  if (btn) {
    btn.click();
    return { found: true, clicked: true };
  }

  // No button — use programmatic submission on the actual <form> element
  const actualForm = (form.tagName && form.tagName.toLowerCase() === 'form')
    ? form
    : form.querySelector('form');
  if (actualForm) {
    if (typeof actualForm.requestSubmit === 'function') {
      actualForm.requestSubmit();
    } else {
      actualForm.submit();
    }
    return { found: true, clicked: false };
  }

  return { found: false, clicked: false };
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  const res = result.value as { found: boolean; clicked: boolean };
  if (!res.found) {
    throw new Error(
      formSelector
        ? `Form not found: ${formSelector}`
        : 'No form found on page',
    );
  }
}

// -------------------------------------------------------------------------
// clearForm
// -------------------------------------------------------------------------

/**
 * Clear all text inputs and textareas within a form (or first form on page).
 * Dispatches input and change events after clearing so frameworks stay in sync.
 */
export async function clearForm(
  client: CdpClient,
  formSelector?: string,
): Promise<void> {
  const rootExpr = formSelector
    ? `document.querySelector(${JSON.stringify(formSelector)})`
    : 'document.querySelector("form")';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const root = ${rootExpr};
  if (!root) return false;
  const inputs = Array.from(root.querySelectorAll('input, textarea')).filter(el => {
    const type = (el.type || '').toLowerCase();
    return type !== 'checkbox' && type !== 'radio' && type !== 'submit' &&
           type !== 'button' && type !== 'reset' && type !== 'image' &&
           type !== 'file' && type !== 'hidden' && type !== 'range' &&
           type !== 'color';
  });
  const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  for (const el of inputs) {
    const setter = inputSetter ?? textareaSetter;
    if (setter) setter.call(el, '');
    else el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return true;
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  if (!result.value) {
    throw new Error(
      formSelector ? `Form not found: ${formSelector}` : 'No form found on page',
    );
  }
}

// -------------------------------------------------------------------------
// getFormState
// -------------------------------------------------------------------------

/**
 * Snapshot all fields in a form with their current values.
 * Returns { selector, type, value, checked? } per field.
 */
export async function getFormState(
  client: CdpClient,
  formSelector?: string,
): Promise<FieldState[]> {
  const rootExpr = formSelector
    ? `document.querySelector(${JSON.stringify(formSelector)})`
    : 'document.querySelector("form")';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const root = ${rootExpr};
  if (!root) return null;
  const elements = Array.from(root.querySelectorAll('input, textarea, select')).filter(el => {
    const type = (el.type || '').toLowerCase();
    return type !== 'hidden' && type !== 'submit' && type !== 'button' &&
           type !== 'reset' && type !== 'image' && type !== 'file';
  });

  return elements.map((el, idx) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || tag).toLowerCase();
    const id = el.id;
    const name = el.name;

    // Build unique selector
    let selector;
    if (id) {
      selector = '#' + CSS.escape(id);
    } else if (name) {
      selector = tag + '[name=' + CSS.escape(name) + ']';
    } else {
      const siblings = Array.from(document.querySelectorAll(tag));
      const nthIdx = siblings.indexOf(el) + 1;
      selector = tag + ':nth-of-type(' + nthIdx + ')';
    }

    const entry = { selector, type, value: el.value };
    if (type === 'checkbox' || type === 'radio') {
      entry.checked = el.checked;
    }
    return entry;
  });
})()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(
      formSelector ? `Form not found: ${formSelector}` : 'No form found on page',
    );
  }

  return result.value as FieldState[];
}
