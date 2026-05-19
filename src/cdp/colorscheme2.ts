// colorscheme2.ts — Color scheme and dark mode detection

export async function getDarkModeState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const mqLight = window.matchMedia('(prefers-color-scheme: light)');
      const mqNone = window.matchMedia('(prefers-color-scheme: no-preference)');
      const forcedColors = window.matchMedia('(forced-colors: active)');
      const htmlEl = document.documentElement;
      return {
        prefersDark: mq.matches,
        prefersLight: mqLight.matches,
        prefersNone: mqNone.matches,
        forcedColorsActive: forcedColors.matches,
        htmlClass: htmlEl.className || null,
        htmlDataTheme: htmlEl.getAttribute('data-theme') || null,
        htmlColorScheme: htmlEl.style.colorScheme || null,
        bodyClass: document.body ? document.body.className || null : null,
        bodyDataTheme: document.body ? document.body.getAttribute('data-theme') || null : null,
        computedColorScheme: window.getComputedStyle(htmlEl).colorScheme || null
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getColorScheme5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const isHighContrast = window.matchMedia('(prefers-contrast: more)').matches ||
                             window.matchMedia('(forced-colors: active)').matches;
      const prefersColorScheme = isDark ? 'dark' : isLight ? 'light' : 'no-preference';
      const htmlEl = document.documentElement;
      const computedScheme = window.getComputedStyle(htmlEl).colorScheme;
      const activeScheme = htmlEl.getAttribute('data-color-scheme') ||
                           htmlEl.getAttribute('data-theme') ||
                           (htmlEl.classList.contains('dark') ? 'dark' :
                            htmlEl.classList.contains('light') ? 'light' : null);
      return {
        isDark,
        isLight,
        isHighContrast,
        prefersColorScheme,
        computedColorScheme: computedScheme || null,
        activeSchemeAttribute: activeScheme,
        resolvedScheme: activeScheme || computedScheme || prefersColorScheme
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getThemeColors2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const rootStyle = getComputedStyle(document.documentElement);
      const patterns = [/^--color-/, /^--theme-/, /^--bg-/, /^--text-/, /^--foreground/, /^--background/, /^--primary/, /^--secondary/, /^--accent/, /^--muted/];
      const vars = {};
      const sheets = Array.from(document.styleSheets);
      const seen = new Set();
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (prop.startsWith('--') && patterns.some(p => p.test(prop)) && !seen.has(prop)) {
                  seen.add(prop);
                  const val = rootStyle.getPropertyValue(prop).trim();
                  if (val) vars[prop] = val;
                  if (Object.keys(vars).length >= 30) return vars;
                }
              }
            }
          }
        } catch(e) {}
      }
      return vars;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getCssVariables7(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const rootStyle = getComputedStyle(document.documentElement);
      const allVars = {};
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (prop.startsWith('--') && !(prop in allVars)) {
                  const val = rootStyle.getPropertyValue(prop).trim();
                  if (val) allVars[prop] = val;
                  if (Object.keys(allVars).length >= 50) return allVars;
                }
              }
            }
          }
        } catch(e) {}
      }
      return allVars;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getColorPalette(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
      }).slice(0, 200);
      const freq = {};
      const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
      for (const el of elements) {
        const cs = window.getComputedStyle(el);
        for (const prop of props) {
          const val = cs[prop];
          if (val && val !== 'transparent' && val !== 'rgba(0, 0, 0, 0)' && val.startsWith('rgb')) {
            freq[val] = (freq[val] || 0) + 1;
          }
        }
      }
      const sorted = Object.entries(freq)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 20)
        .map(([color, count]) => ({ color, count }));
      return sorted;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDarkModeToggle(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const candidates = [];
      const selectors = [
        'button[aria-label*="dark" i]',
        'button[aria-label*="light" i]',
        'button[aria-label*="theme" i]',
        'button[aria-label*="color scheme" i]',
        'button[title*="dark" i]',
        'button[title*="light" i]',
        'button[title*="theme" i]',
        '[role="switch"][aria-label*="dark" i]',
        '[role="switch"][aria-label*="theme" i]',
        'input[type="checkbox"][aria-label*="dark" i]',
        'input[type="checkbox"][aria-label*="theme" i]',
        '[data-theme-toggle]',
        '[data-dark-toggle]',
        '.theme-toggle',
        '.dark-toggle',
        '#theme-toggle',
        '#dark-mode-toggle'
      ];
      for (const sel of selectors) {
        try {
          const els = Array.from(document.querySelectorAll(sel)).slice(0, 3);
          for (const el of els) {
            const rect = el.getBoundingClientRect();
            candidates.push({
              selector: sel,
              tagName: el.tagName.toLowerCase(),
              id: el.id || null,
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
              ariaLabel: el.getAttribute('aria-label') || null,
              title: el.getAttribute('title') || null,
              visible: rect.width > 0 && rect.height > 0,
              ariaChecked: el.getAttribute('aria-checked') || null
            });
          }
        } catch(e) {}
      }
      const unique = [];
      const seenEls = new WeakSet();
      for (const sel of selectors) {
        try {
          const els = Array.from(document.querySelectorAll(sel));
          for (const el of els) {
            if (!seenEls.has(el)) {
              seenEls.add(el);
              const rect = el.getBoundingClientRect();
              unique.push({
                tagName: el.tagName.toLowerCase(),
                id: el.id || null,
                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
                ariaLabel: el.getAttribute('aria-label') || null,
                title: el.getAttribute('title') || null,
                visible: rect.width > 0 && rect.height > 0,
                ariaChecked: el.getAttribute('aria-checked') || null,
                matchedSelector: sel
              });
              if (unique.length >= 10) break;
            }
          }
        } catch(e) {}
        if (unique.length >= 10) break;
      }
      return unique;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getSystemColorScheme(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const light = window.matchMedia('(prefers-color-scheme: light)').matches;
      const contrastMore = window.matchMedia('(prefers-contrast: more)').matches;
      const contrastLess = window.matchMedia('(prefers-contrast: less)').matches;
      const forcedColors = window.matchMedia('(forced-colors: active)').matches;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      const invertedColors = window.matchMedia('(inverted-colors: inverted)').matches;
      return {
        systemScheme: dark ? 'dark' : light ? 'light' : 'no-preference',
        prefersDark: dark,
        prefersLight: light,
        prefersNoPreference: !dark && !light,
        prefersContrastMore: contrastMore,
        prefersContrastLess: contrastLess,
        forcedColorsActive: forcedColors,
        prefersReducedMotion: reducedMotion,
        prefersReducedTransparency: reducedTransparency,
        prefersInvertedColors: invertedColors
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getColorSchemeApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const html = document.documentElement;
      const body = document.body;

      // CSS variables on :root
      let hasCssVariables = false;
      const sheets = Array.from(document.styleSheets);
      outer: for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                if (style[i].startsWith('--')) { hasCssVariables = true; break outer; }
              }
            }
          }
        } catch(e) {}
      }

      // dark class on html or body
      const hasDarkClass = html.classList.contains('dark') || html.classList.contains('dark-mode') ||
                           (body && (body.classList.contains('dark') || body.classList.contains('dark-mode')));

      // data-theme attribute
      const hasDataTheme = html.hasAttribute('data-theme') || html.hasAttribute('data-color-scheme') ||
                           (body && (body.hasAttribute('data-theme') || body.hasAttribute('data-color-scheme')));

      // prefers-color-scheme media query usage in stylesheets
      let hasColorSchemeMedia = false;
      outer2: for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule) {
              const text = rule.conditionText || rule.media.mediaText || '';
              if (text.includes('prefers-color-scheme')) { hasColorSchemeMedia = true; break outer2; }
            }
          }
        } catch(e) {}
      }

      // OS theme sync: color-scheme CSS property set on root
      const computedColorScheme = getComputedStyle(html).colorScheme;
      const hasOsThemeSync = !!(computedColorScheme && computedColorScheme !== 'normal' && computedColorScheme !== '');

      // Additional patterns
      const hasThemeToggleScript = !!(document.querySelector('[data-theme-toggle],[data-dark-toggle],.theme-toggle,#theme-toggle'));
      const hasLocalStorageTheme = (() => {
        try {
          const keys = Object.keys(localStorage);
          return keys.some(k => /theme|dark|color.?scheme/i.test(k));
        } catch(e) { return false; }
      })();

      return {
        hasCssVariables,
        hasDarkClass,
        hasDataTheme,
        hasColorSchemeMedia,
        hasOsThemeSync,
        hasThemeToggleScript,
        hasLocalStorageTheme,
        computedColorScheme: computedColorScheme || null,
        dataThemeValue: html.getAttribute('data-theme') || html.getAttribute('data-color-scheme') || null,
        darkClassPresent: html.classList.contains('dark') || html.classList.contains('dark-mode')
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
