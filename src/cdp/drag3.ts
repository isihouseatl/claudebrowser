// src/cdp/drag3.ts
// Drag-and-drop introspection helpers: draggable elements, drop zones, handles,
// sortable lists, drag state, drop targets, listener summary, and DnD library detection.
//
// Naming note (suffixes chosen to avoid collisions with existing exports):
//   getDraggableElements  = drag2.ts
//   getDraggableElements2 = pointer.ts
//   getDraggableElements3 = drag2.ts   → this file uses getDraggableElements4
//   getDropZones          = drag2.ts
//   getDropZones2         = clipboard3.ts → this file uses getDropZones3
//   getDragHandles        = drag2.ts   → this file uses getDragHandles2
//   getDropTargets        = pointer.ts
//   getDropTargets2       = drag2.ts   → this file uses getDropTargets3
//   getSortableElements, getDragState, getDragListeners, getDragApiUsage = new (no suffix)

// ─── getDraggableElements4 ───────────────────────────────────────────────────
// Elements with draggable="true": [{tag, id, class_preview, text_preview}] (max 20)
export async function getDraggableElements4(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.prototype.slice.call(document.querySelectorAll('[draggable="true"]'), 0, 20);
        return els.map(function(el) {
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 60) : '';
          var txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            text_preview: txt
          };
        });
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? [];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDropZones3 ───────────────────────────────────────────────────────────
// Drop zone containers (elements with dropzone attr, ondrop, or role="listbox"/"grid"):
// [{tag, id, class_preview, text_preview}] (max 20)
export async function getDropZones3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var seen = new Set();
        var results = [];
        function add(el) {
          if (results.length >= 20 || seen.has(el)) return;
          seen.add(el);
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 60) : '';
          var txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            text_preview: txt
          });
        }
        var byAttr = document.querySelectorAll('[dropzone], [data-droptarget], [data-drop-target]');
        Array.prototype.forEach.call(byAttr, add);
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length && results.length < 20; i++) {
          var el = all[i];
          if (typeof el.ondrop === 'function' || typeof el.ondragover === 'function') {
            add(el);
          }
        }
        return results;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? [];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDragHandles2 ─────────────────────────────────────────────────────────
// Drag handle elements (elements with drag-handle class / aria patterns):
// [{tag, id, class_preview}] (max 20)
export async function getDragHandles2(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var seen = new Set();
        var results = [];
        function add(el) {
          if (results.length >= 20 || seen.has(el)) return;
          seen.add(el);
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 60) : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls
          });
        }
        var handlePatterns = [
          '[class*="drag-handle"]',
          '[class*="dragHandle"]',
          '[class*="drag_handle"]',
          '[data-drag-handle]',
          '[aria-roledescription="sortable"]',
          '[role="button"][class*="handle"]',
          '[class*="handle"][draggable]'
        ];
        handlePatterns.forEach(function(sel) {
          var els = document.querySelectorAll(sel);
          Array.prototype.forEach.call(els, add);
        });
        return results;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? [];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getSortableElements ─────────────────────────────────────────────────────
// Sortable list containers (Sortable.js and similar patterns):
// [{tag, id, class_preview, itemCount}] (max 20)
export async function getSortableElements(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var seen = new Set();
        var results = [];
        function addEl(el) {
          if (results.length >= 20 || seen.has(el)) return;
          seen.add(el);
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 60) : '';
          var childCount = 0;
          for (var i = 0; i < el.children.length; i++) {
            var child = el.children[i];
            var childCls = (child.className && typeof child.className === 'string') ? child.className : '';
            if (/sortable-item|sort-item|draggable-item|drag-item/i.test(childCls) ||
                child.getAttribute('draggable') === 'true') {
              childCount++;
            }
          }
          if (childCount === 0) childCount = el.children.length;
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            itemCount: childCount
          });
        }
        var sortableSelectors = [
          '[class*="sortable"]',
          '[data-sortable]',
          '[class*="SortableList"]',
          '[class*="sort-list"]',
          '[class*="draggable-list"]',
          '[class*="drag-list"]'
        ];
        sortableSelectors.forEach(function(sel) {
          var els = document.querySelectorAll(sel);
          Array.prototype.forEach.call(els, addEl);
        });
        if (typeof window.Sortable !== 'undefined' && window.Sortable._list) {
          window.Sortable._list.forEach(addEl);
        }
        return results;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? [];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDragState ────────────────────────────────────────────────────────────
// Current drag state summary: {hasDraggable, hasDropZone, hasSortable, dragLibrary}
export async function getDragState(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasDraggable = document.querySelectorAll('[draggable="true"]').length > 0;
        var hasDropZone = document.querySelectorAll('[dropzone], [data-droptarget]').length > 0;
        var hasSortable = (
          document.querySelectorAll('[class*="sortable"], [data-sortable]').length > 0 ||
          typeof window.Sortable !== 'undefined'
        );
        var dragLibrary = 'none';
        if (typeof window.Sortable !== 'undefined') dragLibrary = 'Sortable.js';
        else if (typeof window.Draggable !== 'undefined' && window.Draggable.Draggable) dragLibrary = '@shopify/draggable';
        else if (typeof window.__reactDndContext !== 'undefined') dragLibrary = 'react-dnd';
        else if (typeof window.interact !== 'undefined') dragLibrary = 'interact.js';
        else if (hasDraggable) dragLibrary = 'html5-native';
        return {
          hasDraggable: hasDraggable,
          hasDropZone: hasDropZone,
          hasSortable: hasSortable,
          dragLibrary: dragLibrary
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? { hasDraggable: false, hasDropZone: false, hasSortable: false, dragLibrary: 'none' };
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDropTargets3 ─────────────────────────────────────────────────────────
// Elements with dragover/drop event listeners (addEventListener pattern):
// [{tag, id, class_preview}] (max 20)
export async function getDropTargets3(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var results = [];
        var seen = new Set();
        function add(el) {
          if (results.length >= 20 || seen.has(el)) return;
          seen.add(el);
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 60) : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls
          });
        }
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length && results.length < 20; i++) {
          var el = all[i];
          if (typeof el.ondrop === 'function' || typeof el.ondragover === 'function') {
            add(el);
            continue;
          }
          var cls2 = (el.className && typeof el.className === 'string') ? el.className : '';
          if (/drop-target|dropTarget|drop_target|droptarget/i.test(cls2) ||
              el.getAttribute('data-droptarget') !== null ||
              el.getAttribute('data-drop-target') !== null ||
              el.getAttribute('dropzone') !== null) {
            add(el);
          }
        }
        return results;
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? [];
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDragListeners ────────────────────────────────────────────────────────
// Summary of drag event handler presence on the document:
// {hasDragstart, hasDragover, hasDrop, hasDragend, listenerCount}
export async function getDragListeners(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var dragEvents = ['dragstart', 'dragover', 'drop', 'dragend', 'dragenter', 'dragleave', 'drag'];
        var counts = { dragstart: 0, dragover: 0, drop: 0, dragend: 0, dragenter: 0, dragleave: 0, drag: 0 };
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (typeof el.ondragstart === 'function') counts.dragstart++;
          if (typeof el.ondragover === 'function') counts.dragover++;
          if (typeof el.ondrop === 'function') counts.drop++;
          if (typeof el.ondragend === 'function') counts.dragend++;
          if (typeof el.ondragenter === 'function') counts.dragenter++;
          if (typeof el.ondragleave === 'function') counts.dragleave++;
          if (typeof el.ondrag === 'function') counts.drag++;
        }
        if (typeof document.ondragstart === 'function') counts.dragstart++;
        if (typeof document.ondragover === 'function') counts.dragover++;
        if (typeof document.ondrop === 'function') counts.drop++;
        if (typeof document.ondragend === 'function') counts.dragend++;
        var total = counts.dragstart + counts.dragover + counts.drop + counts.dragend +
                    counts.dragenter + counts.dragleave + counts.drag;
        return {
          hasDragstart: counts.dragstart > 0,
          hasDragover: counts.dragover > 0,
          hasDrop: counts.drop > 0,
          hasDragend: counts.dragend > 0,
          listenerCount: total
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? { hasDragstart: false, hasDragover: false, hasDrop: false, hasDragend: false, listenerCount: 0 };
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}

// ─── getDragApiUsage ─────────────────────────────────────────────────────────
// Detected DnD library presence:
// {hasHTML5DnD, hasSortableJs, hasDraggableJs, hasReactDnd, hasInteractJs}
export async function getDragApiUsage(
  cdp: any,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasHTML5DnD = document.querySelectorAll('[draggable="true"]').length > 0;
        var hasSortableJs = (
          typeof window.Sortable !== 'undefined' ||
          document.querySelectorAll('[class*="sortable-chosen"], [class*="sortable-ghost"], [class*="sortable-drag"]').length > 0
        );
        var hasDraggableJs = (
          typeof window.Draggable !== 'undefined' ||
          document.querySelectorAll('[class*="draggable--original"], [class*="draggable-mirror"]').length > 0
        );
        var hasReactDnd = (
          typeof window.__reactDndContext !== 'undefined' ||
          document.querySelectorAll('[data-react-dnd-backend]').length > 0 ||
          document.querySelectorAll('[class*="react-dnd"]').length > 0
        );
        var hasInteractJs = (
          typeof window.interact !== 'undefined' ||
          document.querySelectorAll('.can-be-dropped-into, .dropzone').length > 0
        );
        return {
          hasHTML5DnD: hasHTML5DnD,
          hasSortableJs: hasSortableJs,
          hasDraggableJs: hasDraggableJs,
          hasReactDnd: hasReactDnd,
          hasInteractJs: hasInteractJs
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    const data = result.value ?? { hasHTML5DnD: false, hasSortableJs: false, hasDraggableJs: false, hasReactDnd: false, hasInteractJs: false };
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (e: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }] };
  }
}
