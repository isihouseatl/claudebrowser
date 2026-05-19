import type CRI from 'chrome-remote-interface';

export async function getPageLanguage3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const htmlEl = document.documentElement;
    const htmlLang = htmlEl ? htmlEl.getAttribute('lang') : null;
    const metaLang = document.querySelector('meta[http-equiv="content-language"]');
    const metaLanguage = metaLang ? metaLang.getAttribute('content') : null;
    return { lang: htmlLang || metaLanguage || null, htmlLang, metaLanguage };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getHtmlLang(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const elements = Array.from(document.querySelectorAll('[lang]'));
    return elements.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      lang: el.getAttribute('lang'),
      text_preview: (el.textContent || '').trim().slice(0, 80)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getHreflangLinks3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const links = Array.from(document.querySelectorAll('link[hreflang]'));
    return links.slice(0, 20).map(el => ({
      href_preview: (el.getAttribute('href') || '').slice(0, 100),
      hreflang: el.getAttribute('hreflang'),
      rel: el.getAttribute('rel')
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getLangAttributes3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const elements = Array.from(document.querySelectorAll('[lang]'));
    return elements.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      lang: el.getAttribute('lang'),
      text_preview: (el.textContent || '').trim().slice(0, 80)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getLocaleInfo3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    return {
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getRtlElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const explicit = Array.from(document.querySelectorAll('[dir="rtl"]'));
    const all = Array.from(document.querySelectorAll('*'));
    const computed = all.filter(el => {
      if (el.getAttribute('dir') === 'rtl') return false;
      try {
        return window.getComputedStyle(el).direction === 'rtl';
      } catch(e) {
        return false;
      }
    });
    const combined = [...explicit, ...computed].slice(0, 20);
    return combined.map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.getAttribute('class') || '').slice(0, 60),
      dir: el.getAttribute('dir') || 'computed-rtl'
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getI18nElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selector = '[data-i18n],[data-translate],[data-l10n-id],[data-intl],[data-locale-key]';
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.slice(0, 20).map(el => {
      const dataKey =
        el.getAttribute('data-i18n') ||
        el.getAttribute('data-translate') ||
        el.getAttribute('data-l10n-id') ||
        el.getAttribute('data-intl') ||
        el.getAttribute('data-locale-key');
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        dataKey,
        text_preview: (el.textContent || '').trim().slice(0, 80)
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getTranslationKeys(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selector = '[data-i18n],[data-translate],[data-l10n-id],[data-intl],[data-locale-key],[data-key],[data-trans]';
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.slice(0, 20).map(el => {
      const key =
        el.getAttribute('data-i18n') ||
        el.getAttribute('data-translate') ||
        el.getAttribute('data-l10n-id') ||
        el.getAttribute('data-intl') ||
        el.getAttribute('data-locale-key') ||
        el.getAttribute('data-key') ||
        el.getAttribute('data-trans');
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        key_preview: (key || '').slice(0, 100)
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
