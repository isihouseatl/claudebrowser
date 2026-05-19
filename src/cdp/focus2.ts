// focus2.ts — Focus management and keyboard accessibility

export async function getFocusableElements4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), area[href], details > summary';
      var els = Array.from(document.querySelectorAll(sel)).slice(0, 30);
      return els.map(function(el) {
        var rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          name: el.getAttribute('name') || null,
          type: el.getAttribute('type') || null,
          tabindex: el.getAttribute('tabindex'),
          text: (el.textContent || '').trim().slice(0, 60),
          visible: rect.width > 0 && rect.height > 0,
          disabled: el.disabled || false
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFocusState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var focused = document.activeElement;
      var focusSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), area[href], details > summary';
      var focusableCount = document.querySelectorAll(focusSel).length;
      var hasFocusTrap = !!(document.querySelector('[aria-modal="true"]') || document.querySelector('dialog[open]') || document.querySelector('[role="dialog"]'));
      var hasFocusVisible = (function() {
        try {
          return document.querySelector(':focus-visible') !== null;
        } catch(e) { return false; }
      })();
      return {
        currentFocusTag: focused ? focused.tagName.toLowerCase() : null,
        currentFocusId: focused ? (focused.id || null) : null,
        currentFocusText: focused ? (focused.textContent || '').trim().slice(0, 80) : null,
        currentFocusRole: focused ? (focused.getAttribute('role') || null) : null,
        focusableCount: focusableCount,
        hasFocusTrap: hasFocusTrap,
        hasFocusVisible: hasFocusVisible,
        bodyFocused: focused === document.body || focused === document.documentElement
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFocusRing(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var focusSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      var els = Array.from(document.querySelectorAll(focusSel)).slice(0, 30);
      return els.map(function(el) {
        var cs = window.getComputedStyle(el);
        var outlineWidth = cs.outlineWidth;
        var outlineStyle = cs.outlineStyle;
        var outlineColor = cs.outlineColor;
        var boxShadow = cs.boxShadow;
        var hasFocusRing = (outlineStyle !== 'none' && outlineWidth !== '0px') || boxShadow !== 'none';
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          outlineWidth: outlineWidth,
          outlineStyle: outlineStyle,
          outlineColor: outlineColor,
          boxShadow: boxShadow !== 'none' ? boxShadow.slice(0, 80) : null,
          hasFocusRing: hasFocusRing,
          hasOutlineNone: outlineStyle === 'none' || outlineWidth === '0px'
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTabOrder4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex], area[href], details > summary';
      var els = Array.from(document.querySelectorAll(sel));
      var withTabindex = els.filter(function(el) {
        var ti = el.getAttribute('tabindex');
        return ti !== null && parseInt(ti, 10) > 0;
      });
      var natural = els.filter(function(el) {
        var ti = el.getAttribute('tabindex');
        return ti === null || parseInt(ti, 10) === 0;
      });
      var sorted = withTabindex.sort(function(a, b) {
        return parseInt(a.getAttribute('tabindex'), 10) - parseInt(b.getAttribute('tabindex'), 10);
      }).concat(natural);
      return sorted.slice(0, 25).map(function(el, i) {
        var rect = el.getBoundingClientRect();
        return {
          order: i + 1,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          tabindex: el.getAttribute('tabindex'),
          text: (el.textContent || '').trim().slice(0, 60),
          visible: rect.width > 0 && rect.height > 0,
          inViewport: rect.top >= 0 && rect.top <= window.innerHeight
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getAutoFocusElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var els = Array.from(document.querySelectorAll('[autofocus]')).slice(0, 20);
      return {
        count: els.length,
        elements: els.map(function(el) {
          var rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            type: el.getAttribute('type') || null,
            name: el.getAttribute('name') || null,
            placeholder: el.getAttribute('placeholder') || null,
            visible: rect.width > 0 && rect.height > 0,
            currentlyFocused: document.activeElement === el
          };
        })
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFocusTrap2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var trapSelectors = [
        'dialog[open]',
        '[aria-modal="true"]',
        '[role="dialog"]',
        '[role="alertdialog"]',
        '.modal:not([hidden])',
        '[data-focus-trap]',
        '[data-modal]'
      ];
      var traps = [];
      trapSelectors.forEach(function(sel) {
        try {
          var found = Array.from(document.querySelectorAll(sel));
          found.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            var focusableSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
            var focusableInside = el.querySelectorAll(focusableSel).length;
            traps.push({
              selector: sel,
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              role: el.getAttribute('role') || null,
              ariaModal: el.getAttribute('aria-modal'),
              ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || null,
              focusableCount: focusableInside,
              visible: rect.width > 0 && rect.height > 0
            });
          });
        } catch(e) {}
      });
      return {
        trapCount: traps.length,
        traps: traps.slice(0, 10)
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFocusListeners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var focusSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [onfocus], [onblur], [onfocusin], [onfocusout]';
      var els = Array.from(document.querySelectorAll(focusSel)).slice(0, 25);
      var results = [];
      els.forEach(function(el) {
        var hasFocusAttr = !!(el.getAttribute('onfocus') || el.getAttribute('onblur') || el.getAttribute('onfocusin') || el.getAttribute('onfocusout'));
        var hasTabindex = el.getAttribute('tabindex') !== null;
        if (hasFocusAttr || hasTabindex) {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            hasFocusAttr: hasFocusAttr,
            onfocus: el.getAttribute('onfocus') ? el.getAttribute('onfocus').slice(0, 60) : null,
            onblur: el.getAttribute('onblur') ? el.getAttribute('onblur').slice(0, 60) : null,
            tabindex: el.getAttribute('tabindex'),
            text: (el.textContent || '').trim().slice(0, 40)
          });
        }
      });
      return {
        count: results.length,
        elements: results
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getFocusApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasFocusTrap = !!(
        document.querySelector('[aria-modal="true"]') ||
        document.querySelector('dialog[open]') ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('[role="alertdialog"]')
      );
      var hasFocusVisible = (function() {
        try { return document.querySelector(':focus-visible') !== null; } catch(e) { return false; }
      })();
      var hasAutoFocus = document.querySelectorAll('[autofocus]').length > 0;
      var hasRovingTabindex = (function() {
        var minusOnes = Array.from(document.querySelectorAll('[tabindex="-1"]'));
        var zeros = Array.from(document.querySelectorAll('[tabindex="0"]'));
        if (minusOnes.length === 0) return false;
        var parent = minusOnes[0].parentElement;
        if (!parent) return false;
        var siblings = Array.from(parent.children);
        var siblingTabindexes = siblings.map(function(s) { return s.getAttribute('tabindex'); });
        var hasMixed = siblingTabindexes.some(function(t) { return t === '-1'; }) &&
                       siblingTabindexes.some(function(t) { return t === '0' || t === null; });
        return hasMixed && minusOnes.length >= 2;
      })();
      var hasFocusManager = (function() {
        var scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.some(function(s) {
          var src = (s.getAttribute('src') || '').toLowerCase();
          return src.includes('focus-trap') || src.includes('focus-lock') || src.includes('aria-hidden');
        });
      })();
      var negativeTabindexCount = document.querySelectorAll('[tabindex="-1"]').length;
      var positiveTabindexCount = document.querySelectorAll('[tabindex]').length - negativeTabindexCount;
      return {
        hasFocusTrap: hasFocusTrap,
        hasFocusVisible: hasFocusVisible,
        hasAutoFocus: hasAutoFocus,
        hasRovingTabindex: hasRovingTabindex,
        hasFocusManager: hasFocusManager,
        negativeTabindexCount: negativeTabindexCount,
        positiveTabindexCount: positiveTabindexCount,
        openDialogCount: document.querySelectorAll('dialog[open]').length,
        ariaModalCount: document.querySelectorAll('[aria-modal="true"]').length
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
