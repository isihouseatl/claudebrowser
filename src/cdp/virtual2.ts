export async function getVirtualScrollContainers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        var style = window.getComputedStyle(el);
        var overflow = style.overflow + ' ' + style.overflowY;
        var hasScroll = overflow.indexOf('scroll') !== -1 || overflow.indexOf('auto') !== -1;
        if (!hasScroll) continue;
        var rect = el.getBoundingClientRect();
        if (rect.height < 50) continue;
        var cls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
        var isVirtual = cls.indexOf('virtual') !== -1 || cls.indexOf('windowed') !== -1 || cls.indexOf('recycler') !== -1 || cls.indexOf('react-window') !== -1 || cls.indexOf('react-virtualized') !== -1 || el.hasAttribute('data-virtual') || el.querySelector('[data-index]') !== null || el.querySelector('[aria-rowindex]') !== null;
        if (!isVirtual) {
          var children = el.children.length;
          if (children < 3) continue;
        }
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls || null,
          height: Math.round(rect.height),
          overflow: (style.overflow + '/' + style.overflowY).trim()
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVirtualListItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var candidates = Array.from(document.querySelectorAll('[data-index], [aria-rowindex], [aria-posinset]'));
      var out = [];
      for (var i = 0; i < candidates.length && out.length < 30; i++) {
        var el = candidates[i];
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        var cls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls || null,
          text_preview: (el.textContent || '').trim().slice(0, 60)
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVirtualGridItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var candidates = Array.from(document.querySelectorAll('[role="gridcell"], [role="row"][data-index], [aria-colindex], [data-row-index]'));
      var out = [];
      for (var i = 0; i < candidates.length && out.length < 30; i++) {
        var el = candidates[i];
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        var cls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls || null
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVirtualState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var containerCount = 0;
      var totalH = 0;
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var style = window.getComputedStyle(el);
        var ov = style.overflow + ' ' + style.overflowY;
        if (ov.indexOf('scroll') === -1 && ov.indexOf('auto') === -1) continue;
        var rect = el.getBoundingClientRect();
        if (rect.height < 50) continue;
        if (el.querySelector('[data-index]') || el.querySelector('[aria-rowindex]')) {
          containerCount++;
          totalH += Math.round(rect.height);
        }
      }
      var visibleItems = document.querySelectorAll('[data-index], [aria-rowindex]').length;
      return {
        hasVirtualScroll: containerCount > 0,
        containerCount: containerCount,
        visibleItemCount: visibleItems,
        totalHeight: totalH
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { hasVirtualScroll: false, containerCount: 0, visibleItemCount: 0, totalHeight: 0 };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getRecyclerViewElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        var cls = el.className && typeof el.className === 'string' ? el.className : '';
        var tag = el.tagName.toLowerCase();
        var isRecycler = cls.indexOf('recycler') !== -1 || cls.indexOf('react-window') !== -1 || cls.indexOf('react-virtualized') !== -1 || cls.indexOf('FixedSizeList') !== -1 || cls.indexOf('VariableSizeList') !== -1 || tag === 'cdk-virtual-scroll-viewport' || el.hasAttribute('data-virtual-scroll');
        if (!isRecycler) continue;
        var clsPreview = typeof cls === 'string' ? cls.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
        var itemCount = el.querySelectorAll('[data-index]').length;
        out.push({
          tag: tag,
          id: el.id || null,
          class_preview: clsPreview || null,
          itemCount: itemCount
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVirtualItemCount(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var indexed = document.querySelectorAll('[data-index]');
      var ariaRows = document.querySelectorAll('[aria-rowindex]');
      var totalItems = 0;
      var estimatedHeight = 0;
      var ariaCount = document.querySelector('[aria-rowcount]');
      if (ariaCount) {
        var n = parseInt(ariaCount.getAttribute('aria-rowcount') || '0', 10);
        if (n > 0) totalItems = n;
      }
      if (totalItems === 0) {
        var maxIndex = 0;
        for (var i = 0; i < indexed.length; i++) {
          var idx = parseInt(indexed[i].getAttribute('data-index') || '0', 10);
          if (idx > maxIndex) maxIndex = idx;
        }
        if (maxIndex > 0) totalItems = maxIndex + 1;
      }
      var scrollContainers = Array.from(document.querySelectorAll('*')).filter(function(el) {
        var s = window.getComputedStyle(el);
        return (s.overflow + ' ' + s.overflowY).indexOf('scroll') !== -1 && el.scrollHeight > 0;
      });
      if (scrollContainers.length > 0) {
        estimatedHeight = scrollContainers.reduce(function(max, el) { return el.scrollHeight > max ? el.scrollHeight : max; }, 0);
      }
      return {
        totalItems: totalItems,
        visibleItems: Math.max(indexed.length, ariaRows.length),
        estimatedHeight: estimatedHeight
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { totalItems: 0, visibleItems: 0, estimatedHeight: 0 };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVirtualApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var scripts = Array.from(document.querySelectorAll('script[src]')).map(function(s) { return s.getAttribute('src') || ''; }).join(' ');
      var inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).map(function(s) { return s.textContent || ''; }).join(' ').slice(0, 5000);
      var combined = scripts + ' ' + inlineScripts;
      var domClasses = Array.from(document.querySelectorAll('*')).map(function(el) { return (el.className && typeof el.className === 'string') ? el.className : ''; }).join(' ');
      return {
        hasReactVirtual: combined.indexOf('react-virtual') !== -1 || domClasses.indexOf('react-virtual') !== -1,
        hasVirtual: combined.indexOf('virtua') !== -1 || domClasses.indexOf('virtua') !== -1,
        hasTanstackVirtual: combined.indexOf('tanstack') !== -1 && combined.indexOf('virtual') !== -1,
        hasRecyclerView: domClasses.indexOf('recycler') !== -1 || combined.indexOf('RecyclerView') !== -1,
        hasClipperList: combined.indexOf('ClipperList') !== -1 || domClasses.indexOf('clipper') !== -1
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { hasReactVirtual: false, hasVirtual: false, hasTanstackVirtual: false, hasRecyclerView: false, hasClipperList: false };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getWindowedListElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var candidates = Array.from(document.querySelectorAll('[data-index], [aria-rowindex], [aria-setsize], [aria-posinset], [data-row-index], [data-item-index], [data-virtual-index]'));
      var out = [];
      for (var i = 0; i < candidates.length && out.length < 30; i++) {
        var el = candidates[i];
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        var indexPreview = el.getAttribute('data-index') || el.getAttribute('aria-rowindex') || el.getAttribute('aria-posinset') || el.getAttribute('data-row-index') || el.getAttribute('data-item-index') || el.getAttribute('data-virtual-index') || null;
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          index_preview: indexPreview
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
