// src/cdp/viewport3.ts
import type CRI from 'chrome-remote-interface';

export async function getViewportSize3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getScrollPosition4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const el = document.documentElement;
    return {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      scrollTop: el.scrollTop,
      scrollLeft: el.scrollLeft,
      maxScrollX: Math.max(0, el.scrollWidth - window.innerWidth),
      maxScrollY: Math.max(0, el.scrollHeight - window.innerHeight)
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getVisibleArea(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const top = window.scrollY;
    const left = window.scrollX;
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      top,
      left,
      bottom: top + height,
      right: left + width,
      width,
      height
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getStickyElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const sticky = [];
    for (const el of all) {
      if (sticky.length >= 20) break;
      const pos = window.getComputedStyle(el).position;
      if (pos === 'sticky') {
        const rect = el.getBoundingClientRect();
        sticky.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null,
          top: rect.top,
          bottom: rect.bottom
        });
      }
    }
    return sticky;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getFixedElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const fixed = [];
    for (const el of all) {
      if (fixed.length >= 20) break;
      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed') {
        const rect = el.getBoundingClientRect();
        fixed.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width
        });
      }
    }
    return fixed;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getOffscreenElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const all = Array.from(document.querySelectorAll('*'));
    let count = 0, aboveCount = 0, belowCount = 0, leftCount = 0, rightCount = 0;
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const offscreen = rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw;
      if (offscreen) {
        count++;
        if (rect.bottom < 0) aboveCount++;
        if (rect.top > vh) belowCount++;
        if (rect.right < 0) leftCount++;
        if (rect.left > vw) rightCount++;
      }
    }
    return { count, aboveCount, belowCount, leftCount, rightCount };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getViewportOverflow(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const body = document.body;
    const html = document.documentElement;
    const bodyScrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
    const bodyScrollHeight = Math.max(body.scrollHeight, html.scrollHeight);
    return {
      hasHorizontalOverflow: bodyScrollWidth > window.innerWidth,
      hasVerticalOverflow: bodyScrollHeight > window.innerHeight,
      bodyScrollWidth,
      bodyScrollHeight
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getScrollableElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const scrollable = [];
    for (const el of all) {
      if (scrollable.length >= 20) break;
      const style = window.getComputedStyle(el);
      const overflow = style.overflow + ' ' + style.overflowX + ' ' + style.overflowY;
      const isScrollable = (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) &&
        /auto|scroll/.test(overflow);
      if (isScrollable) {
        scrollable.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null,
          scrollWidth: el.scrollWidth,
          scrollHeight: el.scrollHeight,
          overflow: style.overflow
        });
      }
    }
    return scrollable;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
