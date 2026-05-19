import type CRI from 'chrome-remote-interface';

export async function getKeyboardShortcuts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[accesskey]'));
    return els.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      accesskey: el.getAttribute('accesskey'),
      text_preview: (el.textContent || '').trim().slice(0, 60)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getInputMode(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[inputmode]'));
    return els.slice(0, 20).map(el => ({
      id: el.id || null,
      inputmode: el.getAttribute('inputmode'),
      type: el.getAttribute('type') || null,
      placeholder_preview: (el.getAttribute('placeholder') || '').slice(0, 60)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getHotkeys(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[data-hotkey], [data-shortcut]'));
    return els.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      hotkey: el.getAttribute('data-hotkey') || el.getAttribute('data-shortcut'),
      text_preview: (el.textContent || '').trim().slice(0, 60)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getKeyboardNavElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(el => {
      const text = (el.textContent || '').toLowerCase();
      return text.includes('skip') || text.includes('jump') || text.includes('main content');
    });
    const trapCandidates = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], [aria-modal="true"]'));
    const allTabIndex = Array.from(document.querySelectorAll('[tabindex]'));
    const positiveTabIndex = allTabIndex.filter(el => {
      const ti = parseInt(el.getAttribute('tabindex') || '0', 10);
      return ti > 0;
    });
    return {
      hasSkipLinks: skipLinks.length > 0,
      hasKeyboardTrap: trapCandidates.length > 0,
      tabIndexCount: {
        total: allTabIndex.length,
        negative: allTabIndex.filter(el => parseInt(el.getAttribute('tabindex') || '0', 10) < 0).length,
        zero: allTabIndex.filter(el => el.getAttribute('tabindex') === '0').length,
        positive: positiveTabIndex.length
      }
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getArrowKeyTargets(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const roles = ['listbox', 'menu', 'menubar', 'tree', 'treegrid', 'tablist', 'grid', 'radiogroup'];
    const selector = roles.map(r => '[role="' + r + '"]').join(', ');
    const els = Array.from(document.querySelectorAll(selector));
    return els.slice(0, 20).map(el => {
      const role = el.getAttribute('role');
      const itemRoleMap = {
        listbox: 'option', menu: 'menuitem', menubar: 'menuitem',
        tree: 'treeitem', tablist: 'tab', grid: 'row', radiogroup: 'radio', treegrid: 'row'
      };
      const itemRole = itemRoleMap[role] || 'option';
      const items = el.querySelectorAll('[role="' + itemRole + '"]');
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        role,
        itemCount: items.length
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEnterKeyTargets(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const clickableRoles = ['button', 'link', 'menuitem', 'option', 'tab', 'treeitem', 'gridcell', 'row', 'checkbox', 'radio', 'switch'];
    const selector = [
      'button', 'a[href]', 'input[type="submit"]', 'input[type="button"]',
      ...clickableRoles.map(r => '[role="' + r + '"]')
    ].join(', ');
    const els = Array.from(document.querySelectorAll(selector));
    return els.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
      text_preview: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 60)
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEscapeKeyTargets(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selector = '[role="dialog"], [role="alertdialog"], [role="tooltip"], [role="menu"], [role="listbox"], [aria-modal]';
    const els = Array.from(document.querySelectorAll(selector));
    return els.slice(0, 10).map(el => {
      const style = window.getComputedStyle(el);
      const isHidden = style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true';
      const classes = Array.from(el.classList).join(' ').slice(0, 80);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        role: el.getAttribute('role') || null,
        class_preview: classes,
        isOpen: !isHidden
      };
    });
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getKeyboardListeners2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const interactiveTags = ['input', 'textarea', 'select', 'button', 'a'];
    const interactiveRoles = ['textbox', 'combobox', 'listbox', 'spinbutton', 'slider', 'searchbox'];
    const byTag = interactiveTags.reduce((acc, tag) => {
      acc[tag] = document.querySelectorAll(tag).length;
      return acc;
    }, {});
    const byRole = interactiveRoles.reduce((acc, role) => {
      const count = document.querySelectorAll('[role="' + role + '"]').length;
      if (count > 0) acc[role] = count;
      return acc;
    }, {});
    const withTabindex = document.querySelectorAll('[tabindex]').length;
    const withAccesskey = document.querySelectorAll('[accesskey]').length;
    const withDataHotkey = document.querySelectorAll('[data-hotkey],[data-shortcut]').length;
    const trapFocusCandidates = document.querySelectorAll('[role="dialog"][aria-modal="true"], [role="alertdialog"]');
    const estimatedCount = Object.values(byTag).reduce((a, b) => a + b, 0) + withTabindex + withAccesskey + withDataHotkey;
    return {
      estimatedCount,
      hasTrapFocus: trapFocusCandidates.length > 0,
      breakdown: { byTag, byRole, withTabindex, withAccesskey, withDataHotkey }
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
