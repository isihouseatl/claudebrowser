// src/cdp/context2.ts
// Context menu and right-click menu inspection helpers.

type Result = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): Result {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
function err(msg: string): Result {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ─── getContextMenuItems ──────────────────────────────────────────────────────
// Elements with context menu role or contextmenu attribute.
// Returns [{tag, id, class_preview, text_preview}] (max 20).
export async function getContextMenuItems(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var found = [];
        var all = Array.prototype.slice.call(document.querySelectorAll('[role="menu"],[role="menuitem"],[role="context"],[contextmenu],[data-contextmenu]'));
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
          var txt = (el.textContent || '').trim().slice(0, 60);
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            text_preview: txt
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

// ─── getContextMenuTriggers ───────────────────────────────────────────────────
// Elements that show a context menu on right click (oncontextmenu attribute or
// data-contextmenu / aria-haspopup="menu" heuristics).
// Returns [{tag, id, class_preview}] (max 20).
export async function getContextMenuTriggers(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var found = [];
        var all = Array.prototype.slice.call(document.querySelectorAll('[oncontextmenu],[data-contextmenu],[aria-haspopup="menu"],[aria-haspopup="true"]'));
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls
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

// ─── getRightClickTargets ─────────────────────────────────────────────────────
// Elements with contextmenu event listeners (detected via attribute heuristics
// and class/role patterns — true listener detection is not possible from JS).
// Returns [{tag, id, class_preview}] (max 20).
export async function getRightClickTargets(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var found = [];
        var pattern = /context[-_]?menu|right[-_]?click|ctx[-_]?menu/i;
        var all = Array.prototype.slice.call(document.querySelectorAll('*'));
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var cls = (el.className && typeof el.className === 'string') ? el.className : '';
          var id = el.id || '';
          var role = el.getAttribute('role') || '';
          var hasCtxAttr = el.hasAttribute('oncontextmenu') || el.hasAttribute('data-contextmenu');
          var hasCtxClass = pattern.test(cls) || pattern.test(id);
          var hasCtxRole = role === 'menu' || role === 'menuitem';
          if (!hasCtxAttr && !hasCtxClass && !hasCtxRole) continue;
          found.push({
            tag: el.tagName.toLowerCase(),
            id: id,
            class_preview: cls.trim().split(/\\s+/).slice(0, 3).join(' ')
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

// ─── getContextMenuState ──────────────────────────────────────────────────────
// Context menu state: whether a context menu exists, is custom, is currently
// visible, and how many items it has.
// Returns {hasContextMenu, hasCustomMenu, menuVisible, menuItemCount}.
export async function getContextMenuState(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var menuEls = Array.prototype.slice.call(document.querySelectorAll('[role="menu"]'));
        var hasContextMenu = menuEls.length > 0 || document.querySelectorAll('[oncontextmenu],[data-contextmenu]').length > 0;
        var hasCustomMenu = document.querySelectorAll('[data-radix-menu-content],[data-headlessui-state],[data-floating-ui-portal]').length > 0
          || document.querySelectorAll('[class*="context-menu"],[class*="contextmenu"],[class*="ctx-menu"]').length > 0;
        var visibleMenu = null;
        for (var i = 0; i < menuEls.length; i++) {
          var style = window.getComputedStyle(menuEls[i]);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            visibleMenu = menuEls[i];
            break;
          }
        }
        var menuVisible = visibleMenu !== null;
        var menuItemCount = 0;
        if (visibleMenu) {
          menuItemCount = visibleMenu.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]').length;
        }
        return {
          hasContextMenu: hasContextMenu,
          hasCustomMenu: hasCustomMenu,
          menuVisible: menuVisible,
          menuItemCount: menuItemCount
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { hasContextMenu: false, hasCustomMenu: false, menuVisible: false, menuItemCount: 0 });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getMenuItemElements ──────────────────────────────────────────────────────
// Menu item elements (role=menuitem, menuitemcheckbox, menuitemradio).
// Returns [{tag, id, text_preview, disabled, checked}] (max 30).
export async function getMenuItemElements(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var found = [];
        var items = Array.prototype.slice.call(document.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]'));
        for (var i = 0; i < items.length && found.length < 30; i++) {
          var el = items[i];
          var txt = (el.textContent || '').trim().slice(0, 60);
          var disabled = el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled');
          var checked = el.getAttribute('aria-checked');
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            text_preview: txt,
            disabled: disabled,
            checked: checked === null ? null : checked === 'true'
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

// ─── getContextMenuPopup ──────────────────────────────────────────────────────
// Active (visible) context menu popup element.
// Returns {visible, tag, id, class_preview, itemCount}.
export async function getContextMenuPopup(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.prototype.slice.call(document.querySelectorAll(
          '[role="menu"],[data-radix-menu-content],[data-headlessui-state],[class*="context-menu"],[class*="contextmenu"],[class*="ctx-menu"]'
        ));
        for (var i = 0; i < candidates.length; i++) {
          var el = candidates[i];
          var style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) continue;
          var rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          var cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : '';
          var itemCount = el.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]').length;
          return {
            visible: true,
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class_preview: cls,
            itemCount: itemCount
          };
        }
        return { visible: false, tag: '', id: '', class_preview: '', itemCount: 0 };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { visible: false, tag: '', id: '', class_preview: '', itemCount: 0 });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ─── getContextActions ────────────────────────────────────────────────────────
// Elements with data-action or data-context attributes (custom action patterns).
// Returns [{tag, id, action_preview, text_preview}] (max 20).
export async function getContextActions(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var found = [];
        var all = Array.prototype.slice.call(document.querySelectorAll('[data-action],[data-context],[data-menu-action],[data-ctx]'));
        for (var i = 0; i < all.length && found.length < 20; i++) {
          var el = all[i];
          var action = el.getAttribute('data-action') || el.getAttribute('data-context') || el.getAttribute('data-menu-action') || el.getAttribute('data-ctx') || '';
          var txt = (el.textContent || '').trim().slice(0, 60);
          found.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            action_preview: action.slice(0, 80),
            text_preview: txt
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

// ─── getContextApiUsage ───────────────────────────────────────────────────────
// Detected context menu patterns on the page.
// Returns {hasNativeContextMenu, hasCustomContextMenu, hasRadixMenu, hasHeadlessUiMenu}.
export async function getContextApiUsage(cdp: any): Promise<Result> {
  try {
    const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
      expression: `(function() {
        var hasNativeContextMenu = document.querySelectorAll('menu[type="context"],menuitem').length > 0
          || document.querySelectorAll('[oncontextmenu]').length > 0;
        var hasCustomContextMenu = document.querySelectorAll('[class*="context-menu"],[class*="contextmenu"],[class*="ctx-menu"],[data-contextmenu]').length > 0;
        var hasRadixMenu = document.querySelectorAll('[data-radix-menu-content],[data-radix-context-menu-content],[data-radix-dropdown-menu-content]').length > 0
          || (typeof (window as any).__radixMenuRoot !== 'undefined');
        var hasHeadlessUiMenu = document.querySelectorAll('[data-headlessui-state]').length > 0
          || document.querySelectorAll('[id^="headlessui-menu"]').length > 0;
        if (!hasRadixMenu) {
          var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
          for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src') || '';
            if (/@radix-ui\\/react-context-menu|radix-context-menu/i.test(src)) { hasRadixMenu = true; break; }
          }
        }
        return {
          hasNativeContextMenu: hasNativeContextMenu,
          hasCustomContextMenu: hasCustomContextMenu,
          hasRadixMenu: hasRadixMenu,
          hasHeadlessUiMenu: hasHeadlessUiMenu
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'JS error');
    }
    return ok(result.value ?? { hasNativeContextMenu: false, hasCustomContextMenu: false, hasRadixMenu: false, hasHeadlessUiMenu: false });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
