// src/cdp/button2.ts
// Interactive element inspection: buttons, toggles, switches, badges, CTAs.

import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * getAllButtons — Get all <button> and role="button" elements:
 * tag, id, type, text, disabled, ariaLabel (max 30).
 */
export async function getAllButtons(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('button,[role="button"]')).slice(0,30).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, type: el.getAttribute('type') || null, text: el.textContent.trim().slice(0,60), disabled: el.disabled || el.getAttribute('aria-disabled') === 'true', ariaLabel: el.getAttribute('aria-label') };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getPrimaryButtons — Find buttons with class containing "primary", "cta",
 * "submit", or "main": tag, id, class, text (max 10).
 */
export async function getPrimaryButtons(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('[class*="primary" i],[class*="cta" i],[class*="-main" i],button[type="submit"],input[type="submit"]')).slice(0,10).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), text: (el.textContent||el.value||'').trim().slice(0,60) };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getDisabledButtons — Find disabled buttons and inputs:
 * tag, id, text, ariaDisabled (max 20).
 */
export async function getDisabledButtons(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('button[disabled],input[disabled],[aria-disabled="true"]')).slice(0,20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, text: (el.textContent||el.value||'').trim().slice(0,50), ariaDisabled: el.getAttribute('aria-disabled') };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getToggleSwitches — Find toggle/switch elements by role or class:
 * tag, id, checked, ariaChecked, class (max 20).
 */
export async function getToggleSwitches(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('[role="switch"],[role="checkbox"],[class*="toggle" i],[class*="switch" i]')).slice(0,20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, ariaChecked: el.getAttribute('aria-checked'), checked: el.checked !== undefined ? el.checked : null, class: (el.className||'').slice(0,40) };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getBadges — Find badge/chip/tag elements:
 * tag, id, text, class (max 20).
 */
export async function getBadges(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('[class*="badge" i],[class*="chip" i],[class*="tag" i],[class*="label" i]')).filter(function(el) {
    return el.textContent.trim().length < 30;
  }).slice(0,20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, text: el.textContent.trim(), class: (el.className||'').slice(0,40) };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getIconButtons — Find buttons with only an icon (no text or just aria-label):
 * tag, id, ariaLabel, hasIcon, class (max 20).
 */
export async function getIconButtons(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('button,[role="button"]')).filter(function(el) {
    return !el.textContent.trim() || el.querySelector('svg,img,[class*="icon" i]');
  }).slice(0,20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, ariaLabel: el.getAttribute('aria-label'), hasIcon: !!el.querySelector('svg,img'), class: (el.className||'').slice(0,40) };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getExpandCollapseControls — Find expand/collapse controls (aria-expanded):
 * tag, id, ariaExpanded, ariaControls, text (max 20).
 */
export async function getExpandCollapseControls(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('[aria-expanded]')).slice(0,20).map(function(el) {
    return { tag: el.tagName.toLowerCase(), id: el.id, ariaExpanded: el.getAttribute('aria-expanded'), ariaControls: el.getAttribute('aria-controls'), text: el.textContent.trim().slice(0,50) };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getButtonCount — Count interactive elements:
 * { buttons, submitButtons, resetButtons, linkButtons, disabledButtons }.
 */
export async function getButtonCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var buttons = document.querySelectorAll('button,[role="button"]');
  return JSON.stringify({ buttons: buttons.length, submitButtons: document.querySelectorAll('button[type="submit"],input[type="submit"]').length, resetButtons: document.querySelectorAll('button[type="reset"],input[type="reset"]').length, linkButtons: document.querySelectorAll('a[role="button"]').length, disabledButtons: document.querySelectorAll('button[disabled],[aria-disabled="true"]').length });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
