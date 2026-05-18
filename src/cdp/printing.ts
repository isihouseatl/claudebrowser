// src/cdp/printing.ts
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
 * Print the current page to a PDF and return the raw base64-encoded data string.
 * Uses CDP Page.printToPDF. Defaults: printBackground true, all margins 0.4 inches,
 * letter paper (8.5 x 11 inches), portrait orientation.
 */
export async function printToPdfBuffer(
  client: CdpClient,
  options?: {
    landscape?: boolean;
    paperWidth?: number;
    paperHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    printBackground?: boolean;
  },
): Promise<string> {
  const params = {
    landscape: options?.landscape ?? false,
    paperWidth: options?.paperWidth ?? 8.5,
    paperHeight: options?.paperHeight ?? 11,
    marginTop: options?.marginTop ?? 0.4,
    marginBottom: options?.marginBottom ?? 0.4,
    marginLeft: options?.marginLeft ?? 0.4,
    marginRight: options?.marginRight ?? 0.4,
    printBackground: options?.printBackground ?? true,
  };
  const result = await (client.raw.Page as any).printToPDF(params);
  return result.data as string;
}

/**
 * Estimate the number of pages for the current document by comparing the
 * total scroll height to the viewport height. Returns at minimum 1.
 */
export async function getPageCount(client: CdpClient): Promise<number> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const scrollHeight = document.body ? document.body.scrollHeight : document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  if (!viewportHeight || viewportHeight <= 0) return 1;
  return Math.max(1, Math.ceil(scrollHeight / viewportHeight));
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getPageCount');
  return result.value as number;
}

/**
 * Return the natural scroll dimensions of the current document in pixels.
 * Useful for determining paper size before calling printToPdfBuffer.
 */
export async function getPrintableArea(
  client: CdpClient,
): Promise<{ width: number; height: number; unit: string }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return {
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    unit: 'px',
  };
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getPrintableArea');
  return result.value as { width: number; height: number; unit: string };
}

/**
 * Set document.title to the given string. Affects the PDF filename hint
 * when the browser uses the title as a default save name.
 */
export async function setPageTitle(client: CdpClient, title: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.title = ${JSON.stringify(title)}`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'setPageTitle');
}

/**
 * Inject a <style media="print"> element into document.head with the provided
 * CSS string. Callers can inject custom print styles before capturing a PDF.
 * Multiple calls append multiple style elements.
 */
export async function injectPrintStyle(client: CdpClient, css: string): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const style = document.createElement('style');
  style.setAttribute('media', 'print');
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'injectPrintStyle');
}

/**
 * Remove all <style media="print"> elements from the document. Reverses the
 * effect of injectPrintStyle calls without touching other stylesheets.
 */
export async function removePrintStyles(client: CdpClient): Promise<void> {
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const nodes = Array.from(document.querySelectorAll('style[media="print"]'));
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].parentNode.removeChild(nodes[i]);
  }
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'removePrintStyles');
}

/**
 * Walk all accessible stylesheets and return every CSS rule nested inside an
 * @media print block. Cross-origin sheets that raise a SecurityError are
 * silently skipped. Returns an array of { selectorText, cssText } objects.
 */
export async function getPrintCssRules(
  client: CdpClient,
): Promise<Array<{ selectorText: string; cssText: string }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var sheets = Array.from(document.styleSheets);
  var matches = [];
  for (var i = 0; i < sheets.length; i++) {
    var rules;
    try {
      rules = sheets[i].cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.type === 4) {
        var conditionText = rule.conditionText || rule.media && rule.media.mediaText || '';
        if (conditionText.toLowerCase().indexOf('print') === -1) continue;
        var innerRules = rule.cssRules;
        if (!innerRules) continue;
        for (var k = 0; k < innerRules.length; k++) {
          var inner = innerRules[k];
          if (inner.selectorText) {
            matches.push({
              selectorText: inner.selectorText,
              cssText: inner.cssText,
            });
          }
        }
      }
    }
  }
  return matches;
})()`,
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'getPrintCssRules');
  return result.value as Array<{ selectorText: string; cssText: string }>;
}

/**
 * Return the full outer HTML of the page (document.documentElement.outerHTML)
 * as a string. Suitable for offline rendering or archiving a snapshot of the
 * rendered DOM.
 */
export async function printPageToHtml(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: 'document.documentElement.outerHTML',
    returnByValue: true,
  });
  throwOnException(exceptionDetails, 'printPageToHtml');
  return result.value as string;
}
