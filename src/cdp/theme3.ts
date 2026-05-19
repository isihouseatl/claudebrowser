import type CRI from 'chrome-remote-interface';

export async function getDarkMode(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement;
    const classes = Array.from(root.classList);
    const hasDarkClass = classes.some(c => /dark|night|theme-dark/i.test(c));
    const dataTheme = root.getAttribute('data-theme') || root.getAttribute('data-mode') || null;
    const hasDataTheme = dataTheme !== null;
    const rootTheme = dataTheme || root.getAttribute('class') || null;
    return { prefersDark, hasDarkClass, hasDataTheme, rootTheme };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCssCustomProperties(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const vars = [];
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      let rules;
      try { rules = Array.from(sheet.cssRules || []); } catch(e) { continue; }
      for (const rule of rules) {
        if (rule.selectorText === ':root' || rule.selectorText === 'html') {
          const style = rule.style;
          for (let i = 0; i < style.length; i++) {
            const name = style[i];
            if (name.startsWith('--')) {
              const val = style.getPropertyValue(name).trim();
              vars.push({ name, value_preview: val.length > 60 ? val.slice(0, 60) + '...' : val });
              if (vars.length >= 30) break;
            }
          }
        }
        if (vars.length >= 30) break;
      }
    }
    return vars;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getColorScheme4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const metaTag = document.querySelector('meta[name="color-scheme"]');
    const metaColorScheme = metaTag ? metaTag.getAttribute('content') : null;
    const computedCS = getComputedStyle(document.documentElement).colorScheme || null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return { metaColorScheme, cssColorScheme: computedCS, prefersDark, prefersLight };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getThemeVariables(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const themePattern = /color|bg|background|primary|secondary|accent|foreground|surface|brand|text|border|muted|card|input|ring|radius/i;
    const vars = [];
    const rootStyle = getComputedStyle(document.documentElement);
    const sheets = Array.from(document.styleSheets);
    const names = new Set();
    for (const sheet of sheets) {
      let rules;
      try { rules = Array.from(sheet.cssRules || []); } catch(e) { continue; }
      for (const rule of rules) {
        if (rule.selectorText === ':root' || rule.selectorText === 'html') {
          const style = rule.style;
          for (let i = 0; i < style.length; i++) {
            const name = style[i];
            if (name.startsWith('--') && themePattern.test(name)) {
              names.add(name);
            }
          }
        }
      }
    }
    for (const name of names) {
      const val = rootStyle.getPropertyValue(name).trim();
      vars.push({ name, value_preview: val.length > 60 ? val.slice(0, 60) + '...' : val });
      if (vars.length >= 30) break;
    }
    return vars;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getDarkModePreference(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const noPreference = !prefersDark && !prefersLight;
    return { prefersDark, prefersLight, noPreference };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCssVariables6(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const variables = [];
    const rootStyle = getComputedStyle(document.documentElement);
    const sheets = Array.from(document.styleSheets);
    const names = new Set();
    for (const sheet of sheets) {
      let rules;
      try { rules = Array.from(sheet.cssRules || []); } catch(e) { continue; }
      for (const rule of rules) {
        const style = rule.style;
        if (!style) continue;
        for (let i = 0; i < style.length; i++) {
          const name = style[i];
          if (name.startsWith('--')) names.add(name);
          if (names.size >= 30) break;
        }
        if (names.size >= 30) break;
      }
      if (names.size >= 30) break;
    }
    for (const name of names) {
      const val = rootStyle.getPropertyValue(name).trim();
      variables.push({ name, value_preview: val.length > 60 ? val.slice(0, 60) + '...' : val });
    }
    return { count: variables.length, variables };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getThemeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const pattern = /\\btheme|dark|light|night|mode\\b/i;
    const all = Array.from(document.querySelectorAll('*'));
    const results = [];
    for (const el of all) {
      const cls = el.getAttribute('class') || '';
      const id = el.getAttribute('id') || '';
      const dataTheme = el.getAttribute('data-theme') || el.getAttribute('data-mode') || '';
      if (pattern.test(cls) || pattern.test(id) || pattern.test(dataTheme)) {
        results.push({
          tag: el.tagName.toLowerCase(),
          id: id || null,
          class_preview: cls.length > 80 ? cls.slice(0, 80) + '...' : cls || null
        });
        if (results.length >= 20) break;
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getRootStyles(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const interesting = [
      'color','background-color','font-family','font-size','line-height',
      'color-scheme','accent-color','caret-color',
      'border-color','outline-color','text-decoration-color',
      'background','background-image','background-blend-mode',
      'forced-color-adjust','print-color-adjust',
      'scrollbar-color','scrollbar-width'
    ];
    const results = [];
    for (const prop of interesting) {
      const val = rootStyle.getPropertyValue(prop).trim();
      if (val && val !== '' && val !== 'normal' && val !== 'auto' && val !== 'none') {
        results.push({ property: prop, value_preview: val.length > 80 ? val.slice(0, 80) + '...' : val });
        if (results.length >= 30) break;
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
