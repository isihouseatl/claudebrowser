import type CRI from 'chrome-remote-interface';

export async function getPaginationLinks2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('a, button, [role="link"]'));
    const results = [];
    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      const cls = (el.className || '').toString().slice(0, 60);
      const href = el.getAttribute('href') || '';
      const ariaCurrent = el.getAttribute('aria-current');
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const isPage = /\\bpage\\b|\\bpag(ina)?\\b/i.test(cls + ' ' + ariaLabel + ' ' + href);
      const isNumeric = /^\\d+$/.test(text);
      const isPrevNext = /prev|next|anterior|siguiente|suivant|précédent/i.test(text + ' ' + ariaLabel);
      if (!isPage && !isNumeric && !isPrevNext) continue;
      const isActive = ariaCurrent === 'page' || /active|current|selected/i.test(cls);
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: cls,
        text_preview: text.slice(0, 40),
        href_preview: href.slice(0, 80),
        isActive
      });
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getPageNumbers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('a, button, span, li, [role="button"]'));
    const results = [];
    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      if (!/^\\d+$/.test(text)) continue;
      const num = parseInt(text, 10);
      if (num < 1 || num > 9999) continue;
      const cls = (el.className || '').toString();
      const ariaCurrent = el.getAttribute('aria-current');
      const ariaDisabled = el.getAttribute('aria-disabled');
      const isActive = ariaCurrent === 'page' || /active|current|selected/i.test(cls);
      const isDisabled = ariaDisabled === 'true' || (el as HTMLButtonElement).disabled === true || /disabled/i.test(cls);
      results.push({ text, isActive, isDisabled });
      if (results.length >= 30) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNextPageButton(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
    for (const el of candidates) {
      const text = (el.textContent || '').trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const rel = (el.getAttribute('rel') || '').toLowerCase();
      const cls = (el.className || '').toString().toLowerCase();
      const isNext = /\\bnext\\b/.test(text) || /\\bnext\\b/.test(ariaLabel) || rel === 'next' || /next-?page|page-?next/.test(cls);
      if (!isNext) continue;
      return {
        exists: true,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.className || '').toString().slice(0, 80),
        text_preview: (el.textContent || '').trim().slice(0, 40),
        disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true'
      };
    }
    return { exists: false, tag: null, id: null, class_preview: null, text_preview: null, disabled: null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getPrevPageButton(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
    for (const el of candidates) {
      const text = (el.textContent || '').trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const rel = (el.getAttribute('rel') || '').toLowerCase();
      const cls = (el.className || '').toString().toLowerCase();
      const isPrev = /\\bprev(ious)?\\b/.test(text) || /\\bprev(ious)?\\b/.test(ariaLabel) || rel === 'prev' || /prev-?page|page-?prev/.test(cls);
      if (!isPrev) continue;
      return {
        exists: true,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.className || '').toString().slice(0, 80),
        text_preview: (el.textContent || '').trim().slice(0, 40),
        disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true'
      };
    }
    return { exists: false, tag: null, id: null, class_preview: null, text_preview: null, disabled: null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getInfiniteScrollContainer(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('*'));
    let best = null;
    let bestScore = 0;
    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      const overflow = style.overflowY;
      const isScrollable = overflow === 'auto' || overflow === 'scroll';
      if (!isScrollable) continue;
      const rect = el.getBoundingClientRect();
      if (rect.height < 100 || rect.width < 100) continue;
      const cls = (el.className || '').toString();
      const id = el.id || '';
      const infiniteHint = /infinite|scroll-?container|feed|timeline|stream/i.test(cls + ' ' + id);
      const childCount = el.children.length;
      const score = (infiniteHint ? 10 : 0) + Math.min(childCount, 20) + (rect.height > 400 ? 5 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { el, rect, cls, id, childCount };
      }
    }
    if (!best) return { detected: false, tag: null, id: null, class_preview: null, itemCount: 0 };
    return {
      detected: true,
      tag: best.el.tagName.toLowerCase(),
      id: best.id || null,
      class_preview: best.cls.slice(0, 80),
      itemCount: best.childCount
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getLoadMoreButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
    const results = [];
    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      const ariaLabel = (el.getAttribute('aria-label') || '');
      const combined = (text + ' ' + ariaLabel).toLowerCase();
      const isLoadMore = /load\\s+more|show\\s+more|see\\s+more|view\\s+more|more\\s+results|load\\s+additional|show\\s+all/i.test(combined);
      if (!isLoadMore) continue;
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: (el.className || '').toString().slice(0, 80),
        text_preview: text.slice(0, 40)
      });
      if (results.length >= 10) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCurrentPage2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    // 1. aria-current="page"
    const ariaCurrent = document.querySelector('[aria-current="page"]');
    if (ariaCurrent) {
      const text = (ariaCurrent.textContent || '').trim();
      const num = parseInt(text, 10);
      return { pageNumber: isNaN(num) ? null : num, text_preview: text.slice(0, 40), source: 'aria-current' };
    }
    // 2. .active or .current numeric element in pagination context
    const activeEls = Array.from(document.querySelectorAll('.active, .current, [class*="active"], [class*="current"]'));
    for (const el of activeEls) {
      const text = (el.textContent || '').trim();
      if (/^\\d+$/.test(text)) {
        return { pageNumber: parseInt(text, 10), text_preview: text, source: 'class-active' };
      }
    }
    // 3. URL ?page= or /page/ pattern
    const url = window.location.href;
    const urlMatch = url.match(/[?&]page=(\\d+)/) || url.match(/\\/page\\/(\\d+)/);
    if (urlMatch) {
      return { pageNumber: parseInt(urlMatch[1], 10), text_preview: urlMatch[0], source: 'url' };
    }
    return { pageNumber: null, text_preview: null, source: null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getTotalPages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    // 1. aria-label on pagination nav, e.g. "Page 3 of 12"
    const allText = document.body.innerText || '';
    const ofMatch = allText.match(/page\\s+\\d+\\s+of\\s+(\\d+)/i) || allText.match(/\\d+\\s*\\/\\s*(\\d+)\\s*pages?/i);
    if (ofMatch) {
      return { total: parseInt(ofMatch[1], 10), source: 'text-pattern', text_preview: ofMatch[0].slice(0, 60) };
    }
    // 2. Highest numeric page link
    const pageLinks = Array.from(document.querySelectorAll('a, button, [role="button"]'));
    let max = 0;
    let maxText = '';
    for (const el of pageLinks) {
      const text = (el.textContent || '').trim();
      if (/^\\d+$/.test(text)) {
        const n = parseInt(text, 10);
        if (n > max && n < 10000) { max = n; maxText = text; }
      }
    }
    if (max > 0) {
      return { total: max, source: 'max-page-link', text_preview: maxText };
    }
    // 3. rel="last" link href
    const lastLink = document.querySelector('link[rel="last"], a[rel="last"]');
    if (lastLink) {
      const href = lastLink.getAttribute('href') || '';
      const m = href.match(/[?&]page=(\\d+)/) || href.match(/\\/page\\/(\\d+)/);
      if (m) return { total: parseInt(m[1], 10), source: 'rel-last', text_preview: href.slice(0, 80) };
    }
    return { total: null, source: null, text_preview: null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
