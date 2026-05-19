// src/cdp/breadcrumb2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

function preview(s: string | null | undefined, len = 80): string {
  if (!s) return '';
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length > len ? t.slice(0, len) + '…' : t;
}

// 1. getBreadcrumbs2 — nav[aria-label*="breadcrumb"] or ol/ul with breadcrumb class
export async function getBreadcrumbs2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const containers = Array.from(document.querySelectorAll(
        'nav[aria-label*="breadcrumb" i], nav[aria-label*="crumb" i], ' +
        'ol[class*="breadcrumb" i], ul[class*="breadcrumb" i], ' +
        '[aria-label*="breadcrumb" i]'
      ));
      for (const el of containers) {
        if (seen.has(el)) continue;
        seen.add(el);
        const items = Array.from(el.querySelectorAll('li, a, [aria-current]')).map(function(item) {
          return item.textContent ? item.textContent.trim().replace(/\\s+/g, ' ').slice(0, 80) : '';
        }).filter(function(t) { return t.length > 0; });
        const unique = Array.from(new Set(items));
        results.push({
          id: el.id || null,
          tag: el.tagName.toLowerCase(),
          ariaLabel: el.getAttribute('aria-label') || null,
          items: unique.slice(0, 20),
          itemCount: unique.length
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 2. getNavMenus — All <nav> elements with link counts
export async function getNavMenus(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const navs = Array.from(document.querySelectorAll('nav'));
      return navs.slice(0, 20).map(function(nav) {
        const links = nav.querySelectorAll('a');
        const labelRaw = nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby') || null;
        const textRaw = nav.textContent ? nav.textContent.trim().replace(/\\s+/g, ' ') : '';
        return {
          id: nav.id || null,
          ariaLabel_preview: labelRaw ? labelRaw.slice(0, 80) : null,
          linkCount: links.length,
          text_preview: textRaw.slice(0, 80)
        };
      });
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 3. getMenuItems3 — Elements with role="menuitem"|"menuitemcheckbox"|"menuitemradio"
export async function getMenuItems3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const roles = ['menuitem', 'menuitemcheckbox', 'menuitemradio'];
      const selector = roles.map(function(r) { return '[role="' + r + '"]'; }).join(', ');
      const items = Array.from(document.querySelectorAll(selector));
      return items.slice(0, 30).map(function(el) {
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          role: el.getAttribute('role'),
          text_preview: textRaw.slice(0, 80),
          ariaDisabled: el.getAttribute('aria-disabled') || null
        };
      });
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getMenuBars — Elements with role="menubar"
export async function getMenuBars(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const bars = Array.from(document.querySelectorAll('[role="menubar"]'));
      return bars.slice(0, 10).map(function(el) {
        const items = el.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: el.className ? String(el.className).slice(0, 80) : null,
          itemCount: items.length
        };
      });
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getTreeItems — Elements with role="treeitem"
export async function getTreeItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const items = Array.from(document.querySelectorAll('[role="treeitem"]'));
      return items.slice(0, 20).map(function(el) {
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text_preview: textRaw.slice(0, 80),
          ariaExpanded: el.getAttribute('aria-expanded') || null,
          ariaLevel: el.getAttribute('aria-level') || null
        };
      });
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getTabList — Elements with role="tablist" and their tabs
export async function getTabList(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const lists = Array.from(document.querySelectorAll('[role="tablist"]'));
      return lists.slice(0, 10).map(function(el) {
        const tabs = Array.from(el.querySelectorAll('[role="tab"]'));
        const selected = tabs.find(function(t) { return t.getAttribute('aria-selected') === 'true'; });
        const selectedText = selected && selected.textContent
          ? selected.textContent.trim().replace(/\\s+/g, ' ').slice(0, 80)
          : null;
        return {
          id: el.id || null,
          tag: el.tagName.toLowerCase(),
          tabCount: tabs.length,
          selectedTab_preview: selectedText
        };
      });
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 7. getSiteLinks — Links in <header> or <nav>
export async function getSiteLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const links = Array.from(document.querySelectorAll('header a, nav a'));
      for (const a of links) {
        const el = a;
        const href = el.getAttribute('href') || '';
        if (seen.has(href + '||' + (el.textContent || ''))) continue;
        seen.add(href + '||' + (el.textContent || ''));
        const inHeader = el.closest('header') !== null;
        const inNav = el.closest('nav') !== null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          href_preview: href.slice(0, 80),
          text_preview: textRaw.slice(0, 80),
          inHeader,
          inNav
        });
        if (results.length >= 30) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 8. getSkipLinks2 — Links with "skip" in href or text (accessibility skip navigation)
export async function getSkipLinks2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
      const results = [];
      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        const textRaw = a.textContent ? a.textContent.trim().replace(/\\s+/g, ' ') : '';
        const hrefLower = href.toLowerCase();
        const textLower = textRaw.toLowerCase();
        if (hrefLower.includes('skip') || textLower.includes('skip')) {
          results.push({
            href,
            text_preview: textRaw.slice(0, 80)
          });
          if (results.length >= 10) break;
        }
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
