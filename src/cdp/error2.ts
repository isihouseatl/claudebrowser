import type CRI from 'chrome-remote-interface';

export async function getErrorMessages2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="error"]:not(script):not(style)',
      '[class*="Error"]:not(script):not(style)',
      '[data-error]',
      '[aria-errormessage]',
      '.field-error',
      '.form-error',
      '.input-error',
      '.alert-danger',
      '.alert-error'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 20) break;
      let els;
      try { els = Array.from(document.querySelectorAll(sel)); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 20) break;
        const key = el.tagName + (el.id || '') + (el.className || '');
        if (seen.has(key)) continue;
        seen.add(key);
        const text = (el.textContent || '').trim().slice(0, 120);
        if (!text) continue;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 60),
          text_preview: text,
          role: el.getAttribute('role') || null
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getFormValidationErrors2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    const results = [];
    for (const el of inputs) {
      if (results.length >= 20) break;
      const input = el;
      const isInvalid = !input.validity.valid || input.getAttribute('aria-invalid') === 'true';
      if (!isInvalid) continue;
      const msg = input.validationMessage || input.getAttribute('data-error') || null;
      const type = input.tagName === 'SELECT' ? 'select' : (input.getAttribute('type') || input.tagName.toLowerCase());
      results.push({
        inputId: input.id || input.getAttribute('name') || null,
        message: msg ? msg.slice(0, 120) : null,
        type: type
      });
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAlertElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const byRole = Array.from(document.querySelectorAll('[role="alert"], [role="alertdialog"]'));
    const byClass = Array.from(document.querySelectorAll('[class*="alert"]:not(script):not(style)'));
    const seen = new Set();
    const results = [];
    for (const el of [...byRole, ...byClass]) {
      if (results.length >= 20) break;
      const key = el.tagName + (el.id || '') + (el.className || '');
      if (seen.has(key)) continue;
      seen.add(key);
      const text = (el.textContent || '').trim().slice(0, 120);
      if (!text) continue;
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.className || '').toString().slice(0, 60),
        text_preview: text,
        role: el.getAttribute('role') || null
      });
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getErrorBanners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="banner"]:not(script):not(style)',
      '[class*="Banner"]:not(script):not(style)',
      '[class*="notification"]:not(script):not(style)',
      '[class*="notice"]:not(script):not(style)',
      '[class*="warning"]:not(script):not(style)',
      '[role="status"]',
      '[role="banner"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 10) break;
      let els;
      try { els = Array.from(document.querySelectorAll(sel)); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 10) break;
        const key = el.tagName + (el.id || '') + (el.className || '');
        if (seen.has(key)) continue;
        seen.add(key);
        const text = (el.textContent || '').trim().slice(0, 120);
        if (!text) continue;
        const cls = (el.className || '').toString().toLowerCase();
        let severity = 'info';
        if (cls.includes('error') || cls.includes('danger') || cls.includes('critical')) severity = 'error';
        else if (cls.includes('warn')) severity = 'warning';
        else if (cls.includes('success')) severity = 'success';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 60),
          text_preview: text,
          severity
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getInvalidInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const results = [];
    const all = Array.from(document.querySelectorAll('input, select, textarea'));
    for (const el of all) {
      if (results.length >= 20) break;
      const input = el;
      const ariaInvalid = input.getAttribute('aria-invalid');
      const cssInvalid = input.matches(':invalid');
      if (!cssInvalid && ariaInvalid !== 'true') continue;
      results.push({
        id: input.id || null,
        name: input.getAttribute('name') || null,
        type: input.tagName === 'SELECT' ? 'select' : input.tagName === 'TEXTAREA' ? 'textarea' : (input.getAttribute('type') || 'text'),
        validationMessage: (input.validationMessage || '').slice(0, 120)
      });
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getValidationMessages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const results = [];
    const selectors = [
      '[class*="validation"]:not(script):not(style)',
      '[class*="Validation"]:not(script):not(style)',
      '[class*="helper-text"]:not(script):not(style)',
      '[class*="helperText"]:not(script):not(style)',
      '[class*="field-message"]:not(script):not(style)',
      '[class*="form-text"]:not(script):not(style)',
      '[class*="input-message"]:not(script):not(style)',
      '[class*="error-text"]:not(script):not(style)'
    ];
    const seen = new Set();
    for (const sel of selectors) {
      if (results.length >= 20) break;
      let els;
      try { els = Array.from(document.querySelectorAll(sel)); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 20) break;
        const key = el.tagName + (el.id || '') + (el.className || '');
        if (seen.has(key)) continue;
        seen.add(key);
        const text = (el.textContent || '').trim().slice(0, 120);
        if (!text) continue;
        let relatedInputId = null;
        const ariaFor = el.getAttribute('for');
        if (ariaFor) { relatedInputId = ariaFor; }
        else {
          const parent = el.closest('.field, .form-field, .form-group, .input-wrapper, [class*="field"]');
          if (parent) {
            const inp = parent.querySelector('input, select, textarea');
            if (inp) relatedInputId = inp.id || inp.getAttribute('name') || null;
          }
        }
        results.push({ text_preview: text, relatedInputId });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getToastMessages2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="toast"]:not(script):not(style)',
      '[class*="Toast"]:not(script):not(style)',
      '[class*="snackbar"]:not(script):not(style)',
      '[class*="Snackbar"]:not(script):not(style)',
      '[class*="notification-toast"]:not(script):not(style)',
      '[role="status"][aria-live]',
      '[aria-live="polite"]:not(script):not(style)',
      '[aria-live="assertive"]:not(script):not(style)'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 10) break;
      let els;
      try { els = Array.from(document.querySelectorAll(sel)); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 10) break;
        const key = el.tagName + (el.id || '') + (el.className || '');
        if (seen.has(key)) continue;
        seen.add(key);
        const text = (el.textContent || '').trim().slice(0, 120);
        const style = window.getComputedStyle(el);
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 60),
          text_preview: text,
          visible
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getErrorState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const errorEls = document.querySelectorAll(
      '[class*="error"]:not(script):not(style), [class*="Error"]:not(script):not(style), [data-error], [aria-errormessage]'
    );
    let errorCount = 0;
    for (const el of Array.from(errorEls)) {
      if ((el.textContent || '').trim()) errorCount++;
    }
    const warningEls = document.querySelectorAll(
      '[class*="warn"]:not(script):not(style), [class*="Warn"]:not(script):not(style)'
    );
    let warningCount = 0;
    for (const el of Array.from(warningEls)) {
      if ((el.textContent || '').trim()) warningCount++;
    }
    const alertEls = document.querySelectorAll('[role="alert"], [role="alertdialog"]');
    const hasAlerts = alertEls.length > 0;
    const invalidInputs = document.querySelectorAll('input:invalid, select:invalid, textarea:invalid, [aria-invalid="true"]');
    const hasInvalidInputs = invalidInputs.length > 0;
    return {
      hasErrors: errorCount > 0,
      errorCount,
      warningCount,
      hasAlerts,
      hasInvalidInputs
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
