export async function getIntersectionObservers3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';
        let observerCount = 0;
        try {
          const orig = IntersectionObserver;
          // Estimate via window property scan for any stored observer refs
          const keys = Object.getOwnPropertyNames(window);
          for (const k of keys) {
            try {
              const v = (window as any)[k];
              if (v instanceof IntersectionObserver) observerCount++;
            } catch (_) {}
          }
        } catch (_) {}
        return { hasIntersectionObserver, observerCount };
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getLazyLoadImages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const imgs = Array.from(document.querySelectorAll('img[loading="lazy"]')).slice(0, 30);
        return imgs.map(el => {
          const img = el as HTMLImageElement;
          return {
            id: img.id || null,
            src_preview: (img.src || img.getAttribute('data-src') || '').slice(0, 80),
            class_preview: img.className.slice(0, 60),
            loaded: img.complete && img.naturalWidth > 0,
          };
        });
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getLazyLoadElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const els = Array.from(document.querySelectorAll('[data-src],[data-lazy],[data-lazy-src],[data-original]')).slice(0, 30);
        return els.map(el => {
          const e = el as HTMLElement;
          return {
            tag: e.tagName.toLowerCase(),
            id: e.id || null,
            dataSrc_preview: (e.getAttribute('data-src') || e.getAttribute('data-lazy') || e.getAttribute('data-lazy-src') || e.getAttribute('data-original') || '').slice(0, 80),
            class_preview: e.className.slice(0, 60),
          };
        });
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getIntersectionState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const lazyImgs = Array.from(document.querySelectorAll('img[loading="lazy"]'));
        const hasLazyImages = lazyImgs.length > 0;
        const lazyCount = lazyImgs.length;
        let loadedCount = 0;
        let pendingCount = 0;
        for (const el of lazyImgs) {
          const img = el as HTMLImageElement;
          if (img.complete && img.naturalWidth > 0) {
            loadedCount++;
          } else {
            pendingCount++;
          }
        }
        return { hasLazyImages, lazyCount, loadedCount, pendingCount };
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getStickyHeaders2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const all = Array.from(document.querySelectorAll('*'));
        const sticky = [];
        for (const el of all) {
          if (sticky.length >= 20) break;
          const e = el as HTMLElement;
          const style = window.getComputedStyle(e);
          if (style.position === 'sticky' && (style.top === '0px' || style.top === '0')) {
            sticky.push({
              tag: e.tagName.toLowerCase(),
              id: e.id || null,
              class_preview: e.className.toString().slice(0, 60),
              text_preview: (e.innerText || e.textContent || '').trim().slice(0, 80),
            });
          }
        }
        return sticky;
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getInViewElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const vpH = window.innerHeight;
        const vpW = window.innerWidth;
        const els = Array.from(document.querySelectorAll('*'));
        let count = 0;
        let aboveCount = 0;
        let belowCount = 0;
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          const inH = rect.bottom > 0 && rect.top < vpH;
          const inW = rect.right > 0 && rect.left < vpW;
          if (inH && inW) {
            count++;
          } else if (rect.bottom <= 0) {
            aboveCount++;
          } else if (rect.top >= vpH) {
            belowCount++;
          }
        }
        return { count, aboveCount, belowCount };
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getObservedElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const patterns = ['sentinel', 'observer', 'intersection', 'lazy-load', 'lazyload', 'lazy_load', 'observed', 'io-'];
        const all = Array.from(document.querySelectorAll('*'));
        const found = [];
        for (const el of all) {
          if (found.length >= 20) break;
          const e = el as HTMLElement;
          const cls = (e.className || '').toString().toLowerCase();
          const id = (e.id || '').toLowerCase();
          const matched = patterns.some(p => cls.includes(p) || id.includes(p));
          if (matched) {
            found.push({
              tag: e.tagName.toLowerCase(),
              id: e.id || null,
              class_preview: e.className.toString().slice(0, 60),
            });
          }
        }
        return found;
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getIntersectionApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (() => {
        const hasNativeLazy = document.querySelectorAll('img[loading="lazy"]').length > 0;
        const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';
        const hasDataSrc = document.querySelectorAll('[data-src],[data-lazy],[data-lazy-src],[data-original]').length > 0;
        // Detect common lazy-load libraries via script src or global vars
        const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src.toLowerCase());
        const lazyLibPatterns = ['lazyload', 'lazysizes', 'lozad', 'blazy', 'vanilla-lazyload', 'jquery.lazy', 'yall'];
        const hasLazyLib = lazyLibPatterns.some(p => scripts.some(s => s.includes(p))) ||
          typeof (window as any).LazyLoad !== 'undefined' ||
          typeof (window as any).lazySizes !== 'undefined' ||
          typeof (window as any).lozad !== 'undefined';
        return { hasNativeLazy, hasIntersectionObserver, hasLazyLib, hasDataSrc };
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
