// src/cdp/lazy2.ts
// Lazy-loading, infinite scroll, and dynamic content inspection functions.
//
// Naming notes:
//   getLazyImages3      — getLazyImages (image2.ts) and getLazyImages2 (image2.ts) already taken
//   getProgressBars2    — getProgressBars already exported from notify2.ts

export async function getLazyImages3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('img[loading="lazy"], img[data-src], img[data-lazy-src], img[data-lazy]').forEach(function(el) {
    if (items.length >= 20) return;
    var src = (el.getAttribute('src') || '').slice(0, 80);
    var dataSrc = (el.getAttribute('data-src') || '').slice(0, 80);
    var alt = (el.getAttribute('alt') || '').slice(0, 80);
    var loading = el.getAttribute('loading') || '';
    items.push({ src_preview: src, dataSrc_preview: dataSrc, alt_preview: alt, loading: loading });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getInfiniteScrollContainers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[class*="infinite"], [data-infinite], [class*="load-more"]').forEach(function(el) {
    if (items.length >= 10) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: (el.className || '').slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getLoadMoreButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  var keywords = ['load more', 'show more', 'view more', 'see more'];
  document.querySelectorAll('button, a, [role="button"]').forEach(function(el) {
    if (items.length >= 10) return;
    var text = (el.textContent || '').trim().toLowerCase();
    var matched = keywords.some(function(k) { return text.indexOf(k) !== -1; });
    if (!matched) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      text_preview: (el.textContent || '').trim().slice(0, 80),
      class_preview: (el.className || '').slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSkeletonElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[class*="skeleton"], [class*="placeholder"], [class*="shimmer"], [aria-busy="true"]').forEach(function(el) {
    if (items.length >= 20) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: (el.className || '').slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSpinners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[class*="spinner"], [class*="loading"], [role="progressbar"], [aria-label*="loading" i]').forEach(function(el) {
    if (items.length >= 10) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: (el.className || '').slice(0, 80),
      ariaLabel_preview: (el.getAttribute('aria-label') || '').slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getProgressBars2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('progress, [role="progressbar"]').forEach(function(el) {
    if (items.length >= 20) return;
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      value: el.getAttribute('value') || '',
      max: el.getAttribute('max') || '',
      ariaValueNow: el.getAttribute('aria-valuenow') || '',
      ariaValueMax: el.getAttribute('aria-valuemax') || ''
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getDeferredImages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('img[data-src], img[data-lazy-src], img[data-lazy]').forEach(function(el) {
    if (items.length >= 20) return;
    var src = el.getAttribute('src') || '';
    if (src && src.length > 0) return;
    var dataSrc = (el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || el.getAttribute('data-lazy') || '').slice(0, 80);
    items.push({
      dataSrc_preview: dataSrc,
      alt_preview: (el.getAttribute('alt') || '').slice(0, 80),
      class_preview: (el.className || '').slice(0, 80)
    });
  });
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getVirtualLists(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
(function() {
  var items = [];
  document.querySelectorAll('[class*="virtual"], [class*="windowed"], [style*="transform"][class*="list"]').forEach(function(el) {
    if (items.length >= 10) return;
    var style = (el.getAttribute('style') || '').slice(0, 80);
    items.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      class_preview: (el.className || '').slice(0, 80),
      style_preview: style
    });
  });
  if (items.length < 10) {
    document.querySelectorAll('[style]').forEach(function(el) {
      if (items.length >= 10) return;
      var style = el.getAttribute('style') || '';
      var heightMatch = style.match(/height\s*:\s*(\d+)px/);
      if (heightMatch && parseInt(heightMatch[1]) > 5000) {
        items.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          class_preview: (el.className || '').slice(0, 80),
          style_preview: style.slice(0, 80)
        });
      }
    });
  }
  return JSON.stringify(items);
})()
`.trim(),
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text ?? exceptionDetails }) }] };
  }
  const data = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
