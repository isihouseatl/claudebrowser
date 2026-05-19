// src/cdp/nav2.ts
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. All <nav> elements and elements with role="navigation"
// Renamed with suffix 2 only if conflict exists — no conflict, use plain name.
export async function getNavElements(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.from(document.querySelectorAll('nav, [role="navigation"]'));
        var result = els.slice(0, 20).map(function(el) {
          var links = el.querySelectorAll('a');
          var texts = Array.from(links).slice(0, 10).map(function(a) { return (a.textContent || '').trim(); }).filter(Boolean);
          return {
            id: el.id || null,
            class: el.className || null,
            tagName: el.tagName.toLowerCase(),
            ariaLabel: el.getAttribute('aria-label') || null,
            linkCount: links.length,
            text_preview: texts
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. Breadcrumb navs — aria-label containing "breadcrumb" or .breadcrumb class
export async function getBreadcrumbs(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[aria-label], nav, ol, ul'));
        var breadcrumbEls = candidates.filter(function(el) {
          var label = (el.getAttribute('aria-label') || '').toLowerCase();
          var cls = (el.className || '').toLowerCase();
          return label.indexOf('breadcrumb') !== -1 || cls.indexOf('breadcrumb') !== -1;
        });
        var result = breadcrumbEls.slice(0, 5).map(function(el) {
          var links = Array.from(el.querySelectorAll('a, [aria-current]')).slice(0, 10);
          var items = links.map(function(a) {
            return {
              text: (a.textContent || '').trim(),
              href: (a as HTMLAnchorElement).href || null,
              current: a.getAttribute('aria-current') === 'page' || a.getAttribute('aria-current') === 'true'
            };
          });
          return {
            ariaLabel: el.getAttribute('aria-label') || null,
            class: el.className || null,
            items: items
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. Pagination — aria-label containing "pagination" or .pagination class
export async function getPaginationLinks(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var candidates = Array.from(document.querySelectorAll('[aria-label], nav, ol, ul, div'));
        var pagEls = candidates.filter(function(el) {
          var label = (el.getAttribute('aria-label') || '').toLowerCase();
          var cls = (el.className || '').toLowerCase();
          return label.indexOf('pagination') !== -1 || cls.indexOf('pagination') !== -1;
        });
        var result = pagEls.slice(0, 5).map(function(el) {
          var links = Array.from(el.querySelectorAll('a, button, [role="link"]'));
          var items = links.slice(0, 20).map(function(a) {
            return {
              text: (a.textContent || '').trim(),
              href: (a as HTMLAnchorElement).href || null,
              current: a.getAttribute('aria-current') === 'page' || a.getAttribute('aria-current') === 'true'
                || (a.className || '').toLowerCase().indexOf('active') !== -1
                || (a.className || '').toLowerCase().indexOf('current') !== -1
            };
          });
          return {
            ariaLabel: el.getAttribute('aria-label') || null,
            class: el.className || null,
            items: items
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. Menu items — role="menuitem" or li elements inside nav (RENAMED: getMenuItems2 due to conflict in list2.ts)
export async function getMenuItems2(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var byRole = Array.from(document.querySelectorAll('[role="menuitem"]'));
        var byNavLi = Array.from(document.querySelectorAll('nav li'));
        var seen = new Set();
        var combined = byRole.concat(byNavLi).filter(function(el) {
          if (seen.has(el)) return false;
          seen.add(el);
          return true;
        });
        var result = combined.slice(0, 30).map(function(el) {
          var anchor = el.tagName.toLowerCase() === 'a' ? el : el.querySelector('a');
          var submenu = el.querySelector('[role="menu"], [role="menuitem"], ul, .dropdown-menu, .submenu') !== null;
          return {
            text: (el.textContent || '').trim().slice(0, 80),
            href: anchor ? (anchor as HTMLAnchorElement).href || null : null,
            hasSubmenu: submenu,
            role: el.getAttribute('role') || null
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. Dropdown menus — role="menu" or .dropdown-menu class
export async function getDropdownMenus(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.from(document.querySelectorAll('[role="menu"], .dropdown-menu'));
        var result = els.slice(0, 10).map(function(el) {
          var items = el.querySelectorAll('[role="menuitem"], li, a');
          var style = window.getComputedStyle(el);
          var isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          return {
            id: el.id || null,
            class: el.className || null,
            role: el.getAttribute('role') || null,
            itemCount: items.length,
            isVisible: isVisible
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. Sidebar elements — aside and role="complementary"
export async function getSidebarElements(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var els = Array.from(document.querySelectorAll('aside, [role="complementary"]'));
        var seen = new Set();
        var unique = els.filter(function(el) {
          if (seen.has(el)) return false;
          seen.add(el);
          return true;
        });
        var result = unique.slice(0, 5).map(function(el) {
          var links = el.querySelectorAll('a');
          return {
            id: el.id || null,
            class: el.className || null,
            tagName: el.tagName.toLowerCase(),
            ariaLabel: el.getAttribute('aria-label') || null,
            linkCount: links.length
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. Footer links — <a> inside <footer>
export async function getFooterLinks(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var links = Array.from(document.querySelectorAll('footer a'));
        var result = links.slice(0, 30).map(function(a) {
          return {
            text: (a.textContent || '').trim(),
            href: (a as HTMLAnchorElement).href || null,
            ariaLabel: a.getAttribute('aria-label') || null
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. Header links — <a> inside <header>
export async function getHeaderLinks(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var links = Array.from(document.querySelectorAll('header a'));
        var result = links.slice(0, 20).map(function(a) {
          return {
            text: (a.textContent || '').trim(),
            href: (a as HTMLAnchorElement).href || null,
            ariaLabel: a.getAttribute('aria-label') || null
          };
        });
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
