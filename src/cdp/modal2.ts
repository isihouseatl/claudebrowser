// src/cdp/modal2.ts
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getModals — elements with role="dialog" or .modal class that are visible (max 10)
// (No conflict with existing exports — getActiveModals in dialog2.ts is different)
export async function getModals(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[role="dialog"], .modal'));
        var results = [];
        for (var i = 0; i < candidates.length && results.length < 10; i++) {
          var el = candidates[i];
          var rect = el.getBoundingClientRect();
          var style = window.getComputedStyle(el);
          var isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
          var titleEl = el.querySelector('[aria-label], [aria-labelledby], .modal-title, .dialog-title, h1, h2, h3');
          var title = '';
          if (titleEl) {
            title = titleEl.getAttribute('aria-label') || titleEl.textContent.trim().slice(0, 80);
          }
          results.push({
            id: el.id || null,
            class: el.className || null,
            title: title || null,
            isOpen: isVisible,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. getDialogs — native <dialog> elements: id, class, open attribute, text_preview (max 10)
export async function getDialogs(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var dialogs = Array.from(document.querySelectorAll('dialog'));
        var results = [];
        for (var i = 0; i < dialogs.length && results.length < 10; i++) {
          var el = dialogs[i];
          results.push({
            id: el.id || null,
            class: el.className || null,
            open: el.hasAttribute('open'),
            text_preview: el.textContent.trim().slice(0, 120) || null,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. getOverlays — elements with high z-index (>100) and position fixed/absolute covering most of the screen (max 10)
export async function getOverlays(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var allEls = Array.from(document.querySelectorAll('*'));
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var minArea = vw * vh * 0.25;
        var results = [];
        for (var i = 0; i < allEls.length && results.length < 10; i++) {
          var el = allEls[i];
          var style = window.getComputedStyle(el);
          var pos = style.position;
          if (pos !== 'fixed' && pos !== 'absolute') continue;
          var zIndex = parseInt(style.zIndex, 10);
          if (isNaN(zIndex) || zIndex <= 100) continue;
          var rect = el.getBoundingClientRect();
          if (rect.width * rect.height < minArea) continue;
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            zIndex: zIndex,
          });
        }
        results.sort(function(a, b) { return b.zIndex - a.zIndex; });
        return JSON.stringify(results.slice(0, 10));
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. getDrawers2 — side drawer panels by .drawer/.sidebar/.panel class or aria-label containing "drawer" (max 5)
// Renamed to getDrawers2 — conflicts with getDrawers in dialog2.ts (imported in server.ts)
export async function getDrawers2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('.drawer, .sidebar, .panel, [aria-label]'));
        var results = [];
        for (var i = 0; i < candidates.length && results.length < 5; i++) {
          var el = candidates[i];
          var ariaLabel = el.getAttribute('aria-label') || '';
          var cls = el.className || '';
          var isDrawerClass = /\\bdrawer\\b|\\bsidebar\\b|\\bpanel\\b/i.test(cls);
          var isDrawerAria = /drawer/i.test(ariaLabel);
          if (!isDrawerClass && !isDrawerAria) continue;
          var style = window.getComputedStyle(el);
          var isOpen = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          results.push({
            id: el.id || null,
            class: cls || null,
            isOpen: isOpen,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. getPopups — role="tooltip" or elements with .popup/.popover class: id, class, text_preview (max 10)
// (No exact conflict — dialog2.ts has getPopupMenus, not getPopups)
export async function getPopups(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[role="tooltip"], .popup, .popover'));
        var results = [];
        for (var i = 0; i < candidates.length && results.length < 10; i++) {
          var el = candidates[i];
          var style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          results.push({
            id: el.id || null,
            class: el.className || null,
            text_preview: el.textContent.trim().slice(0, 100) || null,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. getTooltips2 — elements with title attribute or role="tooltip": tag, id, title_preview (max 20)
// Renamed to getTooltips2 — conflicts with getTooltips in dialog2.ts (imported in server.ts)
export async function getTooltips2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var byRole = Array.from(document.querySelectorAll('[role="tooltip"]'));
        var byTitle = Array.from(document.querySelectorAll('[title]'));
        var seen = new Set();
        var combined = [];
        byRole.forEach(function(el) { if (!seen.has(el)) { seen.add(el); combined.push(el); } });
        byTitle.forEach(function(el) { if (!seen.has(el)) { seen.add(el); combined.push(el); } });
        var results = [];
        for (var i = 0; i < combined.length && results.length < 20; i++) {
          var el = combined[i];
          var titleAttr = el.getAttribute('title') || null;
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            title_preview: titleAttr ? titleAttr.slice(0, 80) : null,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. getPopovers — elements with popover attribute (HTML Popover API) or [data-popover]: id, class, state (max 10)
// (No conflict — modal.ts has getPopoverElements, not getPopovers)
export async function getPopovers(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[popover], [data-popover]'));
        var results = [];
        for (var i = 0; i < candidates.length && results.length < 10; i++) {
          var el = candidates[i];
          var popoverAttr = el.getAttribute('popover');
          var dataPopover = el.getAttribute('data-popover');
          var style = window.getComputedStyle(el);
          var isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          var state = isVisible ? 'open' : 'closed';
          results.push({
            id: el.id || null,
            class: el.className || null,
            state: state,
            popoverType: popoverAttr !== null ? (popoverAttr || 'auto') : null,
            dataPopover: dataPopover || null,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. getAlertDialogs — elements with role="alertdialog": id, class, text_preview (max 5)
// (No conflict — dialog2.ts has getAlertElements, not getAlertDialogs)
export async function getAlertDialogs(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[role="alertdialog"]'));
        var results = [];
        for (var i = 0; i < candidates.length && results.length < 5; i++) {
          var el = candidates[i];
          results.push({
            id: el.id || null,
            class: el.className || null,
            text_preview: el.textContent.trim().slice(0, 150) || null,
          });
        }
        return JSON.stringify(results);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
