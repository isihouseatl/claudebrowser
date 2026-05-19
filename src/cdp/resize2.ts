// src/cdp/resize2.ts
// Resize, split-pane, and layout constraint inspection helpers.

type Result = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): Result {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
function err(msg: string): Result {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ─── getResizableElements2 ────────────────────────────────────────────────────
// Elements with a non-'none' CSS resize property.
// Returns [{tag, id, class_preview, resize}] (max 20).
// NOTE: Named getResizableElements2 — getResizableElements already exists in drag2.ts.
export async function getResizableElements2(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var found = [];
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var resize = window.getComputedStyle(el).resize;
          if (resize && resize !== 'none') {
            found.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              class_preview: (el.className && typeof el.className === 'string')
                ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ')
                : '',
              resize: resize
            });
          }
        }
        return found;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? []);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResizeHandles ─────────────────────────────────────────────────────────
// Elements that appear to be resize handles (by class/role/aria heuristics).
// Returns [{tag, id, class_preview}] (max 20).
export async function getResizeHandles(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var handlePattern = /resize[-_]?handle|resizer|split[-_]?handle|drag[-_]?handle|pane[-_]?resizer|divider[-_]?handle/i;
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var found = [];
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          var role = el.getAttribute('role') || '';
          var ariaLabel = el.getAttribute('aria-label') || '';
          if (handlePattern.test(cls) || handlePattern.test(role) || handlePattern.test(ariaLabel)) {
            found.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              class_preview: cls.trim().split(/\\s+/).slice(0, 3).join(' ')
            });
          }
        }
        return found;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? []);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getSplitPanels ───────────────────────────────────────────────────────────
// Split-pane or divider container elements.
// Returns [{tag, id, class_preview, orientation}] (max 20).
export async function getSplitPanels(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var splitPattern = /split[-_]?pane|split[-_]?panel|split[-_]?view|split[-_]?container|pane[-_]?container|divider/i;
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var found = [];
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          var id = el.id || '';
          if (!splitPattern.test(cls) && !splitPattern.test(id)) continue;
          var style = window.getComputedStyle(el);
          var orientation = 'unknown';
          if (/horizontal/i.test(cls) || /horizontal/i.test(id)) {
            orientation = 'horizontal';
          } else if (/vertical/i.test(cls) || /vertical/i.test(id)) {
            orientation = 'vertical';
          } else {
            var flex = style.flexDirection;
            if (flex === 'row' || flex === 'row-reverse') orientation = 'horizontal';
            else if (flex === 'column' || flex === 'column-reverse') orientation = 'vertical';
          }
          found.push({
            tag: el.tagName.toLowerCase(),
            id: id,
            class_preview: cls.trim().split(/\\s+/).slice(0, 3).join(' '),
            orientation: orientation
          });
        }
        return found;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? []);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResizeObservers3 ──────────────────────────────────────────────────────
// Detects whether ResizeObserver is used and how many observed elements exist.
// Returns {count, hasResizeObserver}.
// NOTE: Named getResizeObservers3 — getResizeObservers exists in event2.ts and
//       getResizeObservers2 exists in observer2.ts.
export async function getResizeObservers3(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasResizeObserver = typeof ResizeObserver !== 'undefined';
        var count = 0;
        if (hasResizeObserver) {
          try {
            var probe = new ResizeObserver(function() {});
            var all = Array.prototype.slice.call(document.querySelectorAll('*'));
            for (var i = 0; i < all.length; i++) {
              probe.observe(all[i]);
              count++;
              probe.unobserve(all[i]);
            }
            probe.disconnect();
            count = 0;
          } catch (ex) {
            count = -1;
          }
        }
        return { count: count, hasResizeObserver: hasResizeObserver };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { count: 0, hasResizeObserver: false });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResizeState ───────────────────────────────────────────────────────────
// Overall resize-related state of the page.
// Returns {hasResizable, hasSplitPane, hasDivider, resizeLibrary}.
export async function getResizeState(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var hasResizable = false;
        var hasSplitPane = false;
        var hasDivider = false;
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          var style = window.getComputedStyle(el);
          if (!hasResizable && style.resize && style.resize !== 'none') hasResizable = true;
          if (!hasSplitPane && /split[-_]?pane|split[-_]?panel|split[-_]?view/i.test(cls)) hasSplitPane = true;
          if (!hasDivider && /\\bdivider\\b/i.test(cls)) hasDivider = true;
          if (hasResizable && hasSplitPane && hasDivider) break;
        }
        var resizeLibrary = 'none';
        var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
        for (var j = 0; j < scripts.length; j++) {
          var src = scripts[j].getAttribute('src') || '';
          if (/split\.js|split-grid/i.test(src)) { resizeLibrary = 'split.js'; break; }
          if (/interact\.js|interact\.min/i.test(src)) { resizeLibrary = 'interact.js'; break; }
          if (/re-resizable|re_resizable/i.test(src)) { resizeLibrary = 're-resizable'; break; }
        }
        return {
          hasResizable: hasResizable,
          hasSplitPane: hasSplitPane,
          hasDivider: hasDivider,
          resizeLibrary: resizeLibrary
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { hasResizable: false, hasSplitPane: false, hasDivider: false, resizeLibrary: 'none' });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResizableContainers ───────────────────────────────────────────────────
// Overflow containers that are scrollable (potential resize targets).
// Returns [{tag, id, class_preview, overflow}] (max 20).
export async function getResizableContainers(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var found = [];
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var style = window.getComputedStyle(el);
          var overflowX = style.overflowX;
          var overflowY = style.overflowY;
          var isScrollable = overflowX === 'auto' || overflowX === 'scroll' ||
                             overflowY === 'auto' || overflowY === 'scroll';
          if (!isScrollable) continue;
          var rect = el.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 10) continue;
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls.trim().split(/\\s+/).slice(0, 3).join(' '),
            overflow: overflowX === overflowY ? overflowX : overflowX + '/' + overflowY
          });
        }
        return found;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? []);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getMinMaxConstraints ─────────────────────────────────────────────────────
// Elements with explicit min/max width or height CSS constraints.
// Returns [{tag, id, minWidth, maxWidth, minHeight, maxHeight}] (max 20).
export async function getMinMaxConstraints(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var none = ['none', '0px', 'auto', ''];
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        var found = [];
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var style = window.getComputedStyle(el);
          var minW = style.minWidth;
          var maxW = style.maxWidth;
          var minH = style.minHeight;
          var maxH = style.maxHeight;
          var hasMin = none.indexOf(minW) === -1 || none.indexOf(minH) === -1;
          var hasMax = none.indexOf(maxW) === -1 || none.indexOf(maxH) === -1;
          if (!hasMin && !hasMax) continue;
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            minWidth: minW,
            maxWidth: maxW,
            minHeight: minH,
            maxHeight: maxH
          });
        }
        return found;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? []);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getResizeApiUsage ────────────────────────────────────────────────────────
// Detects known resize library patterns on the page.
// Returns {hasResizeObserver, hasSplitJs, hasInteractJs, hasReResizable}.
export async function getResizeApiUsage(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasResizeObserver = typeof ResizeObserver !== 'undefined';
        var hasSplitJs = false;
        var hasInteractJs = false;
        var hasReResizable = false;
        var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
        for (var i = 0; i < scripts.length; i++) {
          var src = scripts[i].getAttribute('src') || '';
          if (/split(\.min)?\.js|split-grid/i.test(src)) hasSplitJs = true;
          if (/interact(\.min)?\.js/i.test(src)) hasInteractJs = true;
          if (/re-resizable|re_resizable/i.test(src)) hasReResizable = true;
        }
        if (typeof window !== 'undefined') {
          if (typeof (window as any).Split !== 'undefined') hasSplitJs = true;
          if (typeof (window as any).interact !== 'undefined') hasInteractJs = true;
        }
        return {
          hasResizeObserver: hasResizeObserver,
          hasSplitJs: hasSplitJs,
          hasInteractJs: hasInteractJs,
          hasReResizable: hasReResizable
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { hasResizeObserver: false, hasSplitJs: false, hasInteractJs: false, hasReResizable: false });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
