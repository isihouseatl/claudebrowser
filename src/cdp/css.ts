// src/cdp/css.ts
import { CdpClient } from './client';

// ---- Helper ----

function throwOnException(
  exceptionDetails: { exception?: { description?: string }; text?: string } | undefined,
  label: string,
): void {
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    throw new Error(`${label}: ${msg}`);
  }
}

// ---- Functions ----

/**
 * Get all CSS custom properties (--var-name) from an element's computed style.
 * If no selector is given, reads from :root (document.documentElement).
 */
export async function getCssVariables(
  client: CdpClient,
  selector?: string,
): Promise<Record<string, string>> {
  const targetExpr = selector
    ? `document.querySelector(${JSON.stringify(selector)})`
    : 'document.documentElement';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = ${targetExpr};
  if (!el) return null;
  const style = window.getComputedStyle(el);
  const names = Array.from(style);
  const out = {};
  for (let i = 0; i < names.length; i++) {
    const n = names[i].trim();
    if (n.startsWith('--')) {
      out[n] = style.getPropertyValue(n).trim();
    }
  }
  return out;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getCssVariables');
  if (result.value === null || result.value === undefined) {
    const label = selector ? selector : ':root';
    throw new Error(`Element not found: ${label}`);
  }
  return result.value as Record<string, string>;
}

/**
 * Set a CSS variable via element.style.setProperty().
 * If no selector is given, sets on document.documentElement.
 */
export async function setCssVariable(
  client: CdpClient,
  name: string,
  value: string,
  selector?: string,
): Promise<void> {
  const targetExpr = selector
    ? `document.querySelector(${JSON.stringify(selector)})`
    : 'document.documentElement';

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = ${targetExpr};
  if (!el) return false;
  el.style.setProperty(${JSON.stringify(name)}, ${JSON.stringify(value)});
  return true;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'setCssVariable');
  if (result.value === false) {
    const label = selector ? selector : 'document.documentElement';
    throw new Error(`Element not found: ${label}`);
  }
}

/**
 * Walk document.styleSheets and return metadata for each sheet.
 * Returns href, type, disabled flag, and cssRules count.
 * Cross-origin sheets that raise a SecurityError return rulesCount: -1.
 */
export async function getStylesheets(
  client: CdpClient,
): Promise<Array<{ href: string | null; type: string; disabled: boolean; rulesCount: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const sheets = Array.from(document.styleSheets);
  return sheets.map(function(sheet) {
    let rulesCount = 0;
    try {
      rulesCount = sheet.cssRules ? sheet.cssRules.length : 0;
    } catch (e) {
      rulesCount = -1;
    }
    return {
      href: sheet.href || null,
      type: sheet.type || 'text/css',
      disabled: sheet.disabled,
      rulesCount: rulesCount,
    };
  });
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getStylesheets');
  return result.value as Array<{
    href: string | null;
    type: string;
    disabled: boolean;
    rulesCount: number;
  }>;
}

/**
 * Find all CSS rules across all accessible stylesheets whose selectorText
 * contains the given selector as a case-insensitive substring.
 */
export async function getMatchingRules(
  client: CdpClient,
  selector: string,
): Promise<Array<{ selectorText: string; cssText: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const needle = ${JSON.stringify(selector)}.toLowerCase();
  const sheets = Array.from(document.styleSheets);
  const matches = [];
  for (let i = 0; i < sheets.length; i++) {
    let rules;
    try {
      rules = sheets[i].cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];
      if (rule.selectorText && rule.selectorText.toLowerCase().indexOf(needle) !== -1) {
        matches.push({
          selectorText: rule.selectorText,
          cssText: rule.cssText,
        });
      }
    }
  }
  return matches;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getMatchingRules');
  return result.value as Array<{ selectorText: string; cssText: string }>;
}

/**
 * Return an object of all inline style properties set on the element.
 * Only returns properties with non-empty values.
 */
export async function getInlineStyle(
  client: CdpClient,
  selector: string,
): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const style = el.style;
  const out = {};
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    const val = style.getPropertyValue(prop);
    if (val !== '') {
      out[prop] = val;
    }
  }
  return out;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getInlineStyle');
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as Record<string, string>;
}

/**
 * Set a CSS property on the element's inline style.
 */
export async function setInlineStyle(
  client: CdpClient,
  selector: string,
  property: string,
  value: string,
): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  el.style[${JSON.stringify(property)}] = ${JSON.stringify(value)};
  return true;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'setInlineStyle');
  if (result.value === false) {
    throw new Error(`Element not found: ${selector}`);
  }
}

/**
 * Remove a CSS property from the element's inline style.
 */
export async function removeInlineStyle(
  client: CdpClient,
  selector: string,
  property: string,
): Promise<void> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  el.style.removeProperty(${JSON.stringify(property)});
  return true;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'removeInlineStyle');
  if (result.value === false) {
    throw new Error(`Element not found: ${selector}`);
  }
}

/**
 * For a given element and list of CSS property names, return their computed values.
 * Returns an object mapping each property name to its computed value string.
 */
export async function getUsedCssProperties(
  client: CdpClient,
  selector: string,
  properties: string[],
): Promise<Record<string, string>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const props = ${JSON.stringify(properties)};
  const style = window.getComputedStyle(el);
  const out = {};
  for (let i = 0; i < props.length; i++) {
    out[props[i]] = style.getPropertyValue(props[i]);
  }
  return out;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getUsedCssProperties');
  if (result.value === null || result.value === undefined) {
    throw new Error(`Element not found: ${selector}`);
  }
  return result.value as Record<string, string>;
}
