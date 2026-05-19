// hover2.ts — hover/mouseover detection module

export async function getHoverElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var all = document.querySelectorAll('*');
      var count = 0;
      for (var i = 0; i < all.length && count < 25; i++) {
        var el = all[i];
        var tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'head' || tag === 'meta') continue;
        var style = window.getComputedStyle(el);
        var hasTransition = style.transition && style.transition !== 'none' && style.transition !== 'all 0s ease 0s';
        var hasCursor = style.cursor === 'pointer';
        var hasTitle = el.hasAttribute('title');
        var hasDataTooltip = el.hasAttribute('data-tooltip') || el.hasAttribute('data-tip') || el.hasAttribute('data-hover');
        if (hasTransition || (hasCursor && (hasTitle || hasDataTooltip))) {
          var text = (el.textContent || '').trim().slice(0, 60);
          results.push({
            tag: tag,
            id: el.id || null,
            className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
            hasTransition: hasTransition,
            cursor: style.cursor,
            hasTitle: hasTitle,
            hasDataTooltip: hasDataTooltip,
            text: text
          });
          count++;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getHoverState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasHoverEffects = false;
      var hasTooltips = false;
      var hasDropdowns = false;
      var hasHoverCards = false;

      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style') continue;

        var style = window.getComputedStyle(el);
        if (style.transition && style.transition !== 'none' && style.transition !== 'all 0s ease 0s') {
          hasHoverEffects = true;
        }
        if (el.hasAttribute('title') || el.hasAttribute('data-tooltip') || el.hasAttribute('data-tip') || el.hasAttribute('aria-describedby')) {
          hasTooltips = true;
        }
        var role = (el.getAttribute('role') || '').toLowerCase();
        if (role === 'menu' || role === 'listbox' || el.classList.contains('dropdown') || el.classList.contains('dropdown-menu')) {
          hasDropdowns = true;
        }
        var cls = (typeof el.className === 'string') ? el.className : '';
        if (cls.match(/card|preview|popover|hover-card|hovercard/i)) {
          hasHoverCards = true;
        }
      }

      return { hasHoverEffects: hasHoverEffects, hasTooltips: hasTooltips, hasDropdowns: hasDropdowns, hasHoverCards: hasHoverCards };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTooltipTriggers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var all = document.querySelectorAll('[title],[data-tooltip],[data-tip],[aria-describedby],[data-bs-toggle="tooltip"],[data-toggle="tooltip"]');
      var limit = Math.min(all.length, 25);
      for (var i = 0; i < limit; i++) {
        var el = all[i];
        var describedBy = el.getAttribute('aria-describedby');
        var tooltipEl = describedBy ? document.getElementById(describedBy) : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          title: el.getAttribute('title') || null,
          dataTooltip: el.getAttribute('data-tooltip') || el.getAttribute('data-tip') || null,
          ariaDescribedBy: describedBy || null,
          tooltipText: tooltipEl ? (tooltipEl.textContent || '').trim().slice(0, 100) : null,
          text: (el.textContent || '').trim().slice(0, 60)
        });
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getHoverEffects(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var all = document.querySelectorAll('*');
      var count = 0;
      for (var i = 0; i < all.length && count < 25; i++) {
        var el = all[i];
        var tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'head') continue;
        var style = window.getComputedStyle(el);
        var transition = style.transition;
        if (!transition || transition === 'none' || transition === 'all 0s ease 0s') continue;
        var transform = style.transform;
        var boxShadow = style.boxShadow;
        var opacity = style.opacity;
        results.push({
          tag: tag,
          id: el.id || null,
          className: (typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          transition: transition.slice(0, 120),
          transform: (transform && transform !== 'none') ? transform : null,
          boxShadow: (boxShadow && boxShadow !== 'none') ? boxShadow.slice(0, 80) : null,
          opacity: opacity !== '1' ? opacity : null,
          text: (el.textContent || '').trim().slice(0, 50)
        });
        count++;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getMouseoverListeners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var all = document.querySelectorAll('*');
      var count = 0;
      for (var i = 0; i < all.length && count < 25; i++) {
        var el = all[i];
        var tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style') continue;
        var onmouseover = el.getAttribute('onmouseover');
        var onmouseenter = el.getAttribute('onmouseenter');
        var onmouseleave = el.getAttribute('onmouseleave');
        if (onmouseover || onmouseenter || onmouseleave) {
          results.push({
            tag: tag,
            id: el.id || null,
            className: (typeof el.className === 'string') ? el.className.slice(0, 80) : null,
            onmouseover: onmouseover ? onmouseover.slice(0, 100) : null,
            onmouseenter: onmouseenter ? onmouseenter.slice(0, 100) : null,
            onmouseleave: onmouseleave ? onmouseleave.slice(0, 100) : null,
            text: (el.textContent || '').trim().slice(0, 50)
          });
          count++;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getHoverCards2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var selectors = [
        '[class*="hover-card"]',
        '[class*="hovercard"]',
        '[class*="card-hover"]',
        '[class*="preview-card"]',
        '[class*="hover-preview"]',
        '[data-hover-card]',
        '[data-hovercard]'
      ];
      var seen = new Set();
      var count = 0;
      for (var s = 0; s < selectors.length && count < 25; s++) {
        var els = document.querySelectorAll(selectors[s]);
        for (var i = 0; i < els.length && count < 25; i++) {
          var el = els[i];
          if (seen.has(el)) continue;
          seen.add(el);
          var style = window.getComputedStyle(el);
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (typeof el.className === 'string') ? el.className.slice(0, 100) : null,
            selector: selectors[s],
            display: style.display,
            visibility: style.visibility,
            position: style.position,
            text: (el.textContent || '').trim().slice(0, 80)
          });
          count++;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDropdownTriggers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var selectors = [
        '[data-bs-toggle="dropdown"]',
        '[data-toggle="dropdown"]',
        '[aria-haspopup="true"]',
        '[aria-haspopup="listbox"]',
        '[aria-haspopup="menu"]',
        '.dropdown-toggle',
        '[class*="dropdown-trigger"]',
        '[class*="menu-trigger"]',
        'nav li > a',
        'nav li > button'
      ];
      var seen = new Set();
      var count = 0;
      for (var s = 0; s < selectors.length && count < 25; s++) {
        var els = document.querySelectorAll(selectors[s]);
        for (var i = 0; i < els.length && count < 25; i++) {
          var el = els[i];
          if (seen.has(el)) continue;
          seen.add(el);
          var expanded = el.getAttribute('aria-expanded');
          var controls = el.getAttribute('aria-controls');
          var hasPopup = el.getAttribute('aria-haspopup');
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (typeof el.className === 'string') ? el.className.slice(0, 100) : null,
            selector: selectors[s],
            ariaExpanded: expanded,
            ariaControls: controls,
            ariaHasPopup: hasPopup,
            text: (el.textContent || '').trim().slice(0, 60)
          });
          count++;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getHoverApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var html = document.documentElement.outerHTML;
      var scripts = Array.from(document.querySelectorAll('script')).map(function(s) { return s.textContent || ''; }).join(' ');
      var combined = html + scripts;

      var hasTooltipLib = !!(
        window.tippy ||
        window.Tooltip ||
        (window.bootstrap && window.bootstrap.Tooltip) ||
        combined.match(/tippy|tooltip\.js|floating-ui|popper\.js/i)
      );

      var hasCssHover = !!combined.match(/:hover\s*\{|:hover\s+/);

      var hasJsHover = !!(
        combined.match(/addEventListener\s*\(\s*['"]mouseover['"]/i) ||
        combined.match(/addEventListener\s*\(\s*['"]mouseenter['"]/i) ||
        combined.match(/\.on\s*\(\s*['"]mouseover['"]/i) ||
        combined.match(/\.on\s*\(\s*['"]mouseenter['"]/i) ||
        combined.match(/onmouseover\s*=/i) ||
        combined.match(/onmouseenter\s*=/i)
      );

      var hasHoverIntent = !!(
        window.hoverIntent ||
        combined.match(/hoverIntent|jquery\.hoverIntent/i)
      );

      return {
        hasTooltipLib: hasTooltipLib,
        hasCssHover: hasCssHover,
        hasJsHover: hasJsHover,
        hasHoverIntent: hasHoverIntent
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
