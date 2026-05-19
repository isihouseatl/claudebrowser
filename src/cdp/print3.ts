/**
 * print3.ts — Print CSS inspection utilities (batch 3)
 *
 * Functions:
 *   getPrintStyles        — CSS rules inside @media print (max 30)
 *   getPrintMediaQuery    — @media print detection: {hasPrintStyles, ruleCount}
 *   getPrintOnlyElements  — elements visible only in print (display:block in @media print) (max 20)
 *   getPrintHiddenElements2 — elements hidden in print (display:none in @media print) (max 20)
 *   getPageBreakElements2 — elements with page-break-before/after (max 20)
 *   getPrintLinks         — links whose href is exposed via ::after content in print CSS (max 20)
 *   getPrintMetadata      — document title + meta author/description
 *   getPrintViewport      — page dimensions + mediaType + colorScheme
 */

export async function getPrintStyles(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const rules = [];
        try {
          for (const sheet of Array.from(document.styleSheets)) {
            let cssRules;
            try { cssRules = sheet.cssRules; } catch (e) { continue; }
            if (!cssRules) continue;
            for (const rule of Array.from(cssRules)) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRule = rule;
                const conditionText = mediaRule.conditionText || (mediaRule.media && mediaRule.media.mediaText) || '';
                if (!conditionText.includes('print')) continue;
                for (const innerRule of Array.from(mediaRule.cssRules || [])) {
                  if (innerRule.type === CSSRule.STYLE_RULE) {
                    const styleRule = innerRule;
                    const style = styleRule.style;
                    for (let i = 0; i < style.length; i++) {
                      const property = style[i];
                      const value = style.getPropertyValue(property);
                      rules.push({
                        selector: styleRule.selectorText || '',
                        property,
                        value
                      });
                      if (rules.length >= 30) return rules;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {}
        return rules;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintMediaQuery(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        let ruleCount = 0;
        let hasPrintStyles = false;
        try {
          for (const sheet of Array.from(document.styleSheets)) {
            let cssRules;
            try { cssRules = sheet.cssRules; } catch (e) { continue; }
            if (!cssRules) continue;
            for (const rule of Array.from(cssRules)) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRule = rule;
                const conditionText = mediaRule.conditionText || (mediaRule.media && mediaRule.media.mediaText) || '';
                if (conditionText.includes('print')) {
                  hasPrintStyles = true;
                  ruleCount += (mediaRule.cssRules || []).length;
                }
              }
            }
          }
        } catch (e) {}
        return { hasPrintStyles, ruleCount };
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? { hasPrintStyles: false, ruleCount: 0 };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintOnlyElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const found = [];
        try {
          const printBlockSelectors = [];
          for (const sheet of Array.from(document.styleSheets)) {
            let cssRules;
            try { cssRules = sheet.cssRules; } catch (e) { continue; }
            if (!cssRules) continue;
            for (const rule of Array.from(cssRules)) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRule = rule;
                const conditionText = mediaRule.conditionText || (mediaRule.media && mediaRule.media.mediaText) || '';
                if (!conditionText.includes('print')) continue;
                for (const innerRule of Array.from(mediaRule.cssRules || [])) {
                  if (innerRule.type === CSSRule.STYLE_RULE) {
                    const styleRule = innerRule;
                    const display = styleRule.style && styleRule.style.getPropertyValue('display');
                    if (display && display !== 'none') {
                      printBlockSelectors.push(styleRule.selectorText || '');
                    }
                  }
                }
              }
            }
          }
          for (const sel of printBlockSelectors) {
            if (!sel) continue;
            let els;
            try { els = document.querySelectorAll(sel); } catch (e) { continue; }
            for (const el of Array.from(els)) {
              const htmlEl = el;
              const screenDisplay = window.getComputedStyle(htmlEl).display;
              if (screenDisplay === 'none') {
                found.push({
                  tag: htmlEl.tagName.toLowerCase(),
                  id: htmlEl.id || '',
                  class_preview: (htmlEl.className || '').toString().slice(0, 60)
                });
                if (found.length >= 20) return found;
              }
            }
          }
        } catch (e) {}
        return found;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintHiddenElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const found = [];
        try {
          const noneSelectors = [];
          for (const sheet of Array.from(document.styleSheets)) {
            let cssRules;
            try { cssRules = sheet.cssRules; } catch (e) { continue; }
            if (!cssRules) continue;
            for (const rule of Array.from(cssRules)) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRule = rule;
                const conditionText = mediaRule.conditionText || (mediaRule.media && mediaRule.media.mediaText) || '';
                if (!conditionText.includes('print')) continue;
                for (const innerRule of Array.from(mediaRule.cssRules || [])) {
                  if (innerRule.type === CSSRule.STYLE_RULE) {
                    const styleRule = innerRule;
                    const display = styleRule.style && styleRule.style.getPropertyValue('display');
                    if (display === 'none') {
                      noneSelectors.push(styleRule.selectorText || '');
                    }
                  }
                }
              }
            }
          }
          for (const sel of noneSelectors) {
            if (!sel) continue;
            let els;
            try { els = document.querySelectorAll(sel); } catch (e) { continue; }
            for (const el of Array.from(els)) {
              const htmlEl = el;
              found.push({
                tag: htmlEl.tagName.toLowerCase(),
                id: htmlEl.id || '',
                class_preview: (htmlEl.className || '').toString().slice(0, 60)
              });
              if (found.length >= 20) return found;
            }
          }
        } catch (e) {}
        return found;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPageBreakElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const found = [];
        try {
          const allEls = document.querySelectorAll('*');
          for (const el of Array.from(allEls)) {
            const htmlEl = el;
            const style = window.getComputedStyle(htmlEl);
            const pbBefore = style.getPropertyValue('page-break-before') || style.getPropertyValue('break-before') || '';
            const pbAfter = style.getPropertyValue('page-break-after') || style.getPropertyValue('break-after') || '';
            if (
              (pbBefore && pbBefore !== 'auto' && pbBefore !== 'normal') ||
              (pbAfter && pbAfter !== 'auto' && pbAfter !== 'normal')
            ) {
              found.push({
                tag: htmlEl.tagName.toLowerCase(),
                id: htmlEl.id || '',
                class_preview: (htmlEl.className || '').toString().slice(0, 60),
                pageBreakBefore: pbBefore || 'auto',
                pageBreakAfter: pbAfter || 'auto'
              });
              if (found.length >= 20) break;
            }
          }
        } catch (e) {}
        return found;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const found = [];
        try {
          // Detect selectors in @media print that use ::after content with attr(href) or similar
          const printAfterSelectors = [];
          for (const sheet of Array.from(document.styleSheets)) {
            let cssRules;
            try { cssRules = sheet.cssRules; } catch (e) { continue; }
            if (!cssRules) continue;
            for (const rule of Array.from(cssRules)) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRule = rule;
                const conditionText = mediaRule.conditionText || (mediaRule.media && mediaRule.media.mediaText) || '';
                if (!conditionText.includes('print')) continue;
                for (const innerRule of Array.from(mediaRule.cssRules || [])) {
                  if (innerRule.type === CSSRule.STYLE_RULE) {
                    const styleRule = innerRule;
                    const content = styleRule.style && styleRule.style.getPropertyValue('content');
                    const selector = styleRule.selectorText || '';
                    if (content && content.includes('attr(href)') && selector.includes('::after')) {
                      // Strip ::after to get the base selector
                      printAfterSelectors.push(selector.replace(/::after/g, '').trim());
                    }
                  }
                }
              }
            }
          }
          // Collect matching link elements
          const selectors = printAfterSelectors.length > 0 ? printAfterSelectors : ['a'];
          for (const sel of selectors) {
            if (!sel) continue;
            let els;
            try { els = document.querySelectorAll(sel); } catch (e) { continue; }
            for (const el of Array.from(els)) {
              const anchor = el;
              const href = anchor.getAttribute('href') || '';
              if (!href) continue;
              found.push({
                tag: anchor.tagName.toLowerCase(),
                href_preview: href.slice(0, 80),
                text_preview: (anchor.textContent || '').trim().slice(0, 60)
              });
              if (found.length >= 20) return found;
            }
          }
        } catch (e) {}
        return found;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintMetadata(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const getMeta = (name) => {
          const el = document.querySelector('meta[name="' + name + '"]') ||
                     document.querySelector('meta[property="' + name + '"]');
          return el ? (el.getAttribute('content') || '') : '';
        };
        return {
          title: document.title || '',
          author: getMeta('author') || getMeta('dc.creator') || '',
          description: getMeta('description') || getMeta('og:description') || ''
        };
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? { title: '', author: '', description: '' };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPrintViewport(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const width = window.innerWidth || document.documentElement.clientWidth || 0;
        const height = window.innerHeight || document.documentElement.clientHeight || 0;
        let mediaType = 'screen';
        try {
          if (window.matchMedia('print').matches) mediaType = 'print';
        } catch (e) {}
        let colorScheme = 'light';
        try {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) colorScheme = 'dark';
        } catch (e) {}
        return { width, height, mediaType, colorScheme };
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? { width: 0, height: 0, mediaType: 'screen', colorScheme: 'light' };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
