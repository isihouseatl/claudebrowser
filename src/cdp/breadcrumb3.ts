import type CRI from 'chrome-remote-interface';

export async function getBreadcrumbs3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const navEls = Array.from(document.querySelectorAll('nav[aria-label*="breadcrumb" i], nav[class*="breadcrumb" i], ol[class*="breadcrumb" i], ul[class*="breadcrumb" i], [role="navigation"][aria-label*="breadcrumb" i]'));
    return navEls.slice(0, 10).map(el => {
      const items = Array.from(el.querySelectorAll('a, [aria-current], li')).slice(0, 10).map(item => ({
        text: item.textContent ? item.textContent.trim().slice(0, 60) : '',
        href_preview: item.getAttribute('href') ? item.getAttribute('href').slice(0, 80) : null
      }));
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: el.className ? el.className.toString().slice(0, 80) : '',
        items
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getBreadcrumbItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const candidates = Array.from(document.querySelectorAll('[class*="breadcrumb" i] a, [class*="breadcrumb" i] li, [aria-label*="breadcrumb" i] a, [aria-label*="breadcrumb" i] li, [class*="crumb" i]'));
    return candidates.slice(0, 20).map((el, i) => ({
      text_preview: el.textContent ? el.textContent.trim().slice(0, 60) : '',
      href_preview: el.getAttribute('href') ? el.getAttribute('href').slice(0, 80) : null,
      isActive: el.getAttribute('aria-current') === 'page' || el.classList.contains('active') || el.classList.contains('current'),
      position: i + 1
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getSidebarNavigation(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const sidebar = document.querySelector('aside nav, [class*="sidebar" i] nav, nav[class*="sidebar" i], [role="complementary"] nav, [class*="side-nav" i], [class*="sidenav" i]');
    if (!sidebar) return { exists: false, tag: null, id: null, class_preview: null, itemCount: 0 };
    const items = sidebar.querySelectorAll('a, button, [role="menuitem"]');
    return {
      exists: true,
      tag: sidebar.tagName.toLowerCase(),
      id: sidebar.id || null,
      class_preview: sidebar.className ? sidebar.className.toString().slice(0, 80) : '',
      itemCount: items.length
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getTreeNavigation(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const treeItems = Array.from(document.querySelectorAll('[role="tree"] [role="treeitem"], [class*="tree-item" i], [class*="treeitem" i], details summary, [class*="accordion" i] [class*="item" i]'));
    return treeItems.slice(0, 30).map(el => {
      let level = 0;
      let parent = el.parentElement;
      while (parent) {
        if (parent.getAttribute('role') === 'tree' || parent.tagName === 'BODY') break;
        if (parent.getAttribute('role') === 'group' || parent.tagName === 'DETAILS' || parent.tagName === 'UL' || parent.tagName === 'OL') level++;
        parent = parent.parentElement;
      }
      const isExpanded = el.getAttribute('aria-expanded') === 'true' || (el.parentElement && el.parentElement.tagName === 'DETAILS' && el.parentElement.open) || false;
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        class_preview: el.className ? el.className.toString().slice(0, 80) : '',
        text_preview: el.textContent ? el.textContent.trim().slice(0, 60) : '',
        isExpanded,
        level
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getExpandedNavItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const expanded = Array.from(document.querySelectorAll('[aria-expanded="true"], details[open] summary, [class*="expanded" i][class*="nav" i], [class*="nav" i][class*="open" i]'));
    return expanded.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: el.className ? el.className.toString().slice(0, 80) : '',
      text_preview: el.textContent ? el.textContent.trim().slice(0, 60) : ''
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getActiveNavItem(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const active = document.querySelector(
      'nav [aria-current="page"], nav .active, nav [class*="active" i], nav [class*="current" i], [role="navigation"] [aria-current="page"], [class*="nav" i] [aria-current="page"]'
    );
    if (!active) return { tag: null, id: null, class_preview: null, text_preview: null, href_preview: null };
    return {
      tag: active.tagName.toLowerCase(),
      id: active.id || null,
      class_preview: active.className ? active.className.toString().slice(0, 80) : '',
      text_preview: active.textContent ? active.textContent.trim().slice(0, 80) : '',
      href_preview: active.getAttribute('href') ? active.getAttribute('href').slice(0, 100) : null
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNavDepth(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const navContainers = Array.from(document.querySelectorAll('nav, [role="navigation"]'));
    let maxDepth = 0;
    for (const nav of navContainers) {
      const measure = (el, depth) => {
        let d = depth;
        for (const child of el.children) {
          if (['UL','OL','DIV','MENU'].includes(child.tagName)) {
            const childDepth = measure(child, depth + 1);
            if (childDepth > d) d = childDepth;
          }
        }
        return d;
      };
      const depth = measure(nav, 0);
      if (depth > maxDepth) maxDepth = depth;
    }
    return { maxDepth, navContainerCount: navContainers.length };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getNavBreadcrumb(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const container = document.querySelector('[class*="breadcrumb" i], [aria-label*="breadcrumb" i], nav[class*="breadcrumb" i], ol[class*="breadcrumb" i]');
    if (!container) return { items: [], separator_preview: null, totalItems: 0 };
    const links = Array.from(container.querySelectorAll('a, [aria-current], li'));
    const separators = Array.from(container.querySelectorAll('[class*="separator" i], [class*="divider" i], [aria-hidden="true"]'));
    const sep = separators.length > 0 ? separators[0].textContent.trim().slice(0, 10) : null;
    const items = links.slice(0, 20).map(el => ({
      text: el.textContent ? el.textContent.trim().slice(0, 60) : '',
      href_preview: el.getAttribute('href') ? el.getAttribute('href').slice(0, 100) : null
    })).filter(i => i.text.length > 0);
    return { items, separator_preview: sep, totalItems: items.length };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
