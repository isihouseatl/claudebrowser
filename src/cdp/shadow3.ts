export async function getShadowRoots3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          var sr = el.shadowRoot;
          out.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null,
            mode: sr.mode,
            delegatesFocus: sr.delegatesFocus
          });
        }
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getShadowHosts3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          out.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null,
            childCount: el.shadowRoot.childElementCount
          });
        }
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getWebComponents3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      if (!window.customElements) return [];
      var out = [];
      var registry = window.customElements;
      var knownNames = Array.from(document.querySelectorAll('*'))
        .map(function(el) { return el.tagName.toLowerCase(); })
        .filter(function(tag) { return tag.indexOf('-') !== -1; });
      var unique = Array.from(new Set(knownNames));
      for (var i = 0; i < unique.length && out.length < 20; i++) {
        var name = unique[i];
        var ctor = registry.get(name);
        out.push({
          name: name,
          constructorName: ctor ? (ctor.name || 'anonymous') : null
        });
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getCustomElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        var tag = el.tagName.toLowerCase();
        if (tag.indexOf('-') !== -1) {
          out.push({
            tag: tag,
            id: el.id || null,
            class_preview: el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ') : null
          });
        }
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getShadowState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var shadowHostCount = 0;
      var openCount = 0;
      var closedCount = 0;
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          shadowHostCount++;
          if (el.shadowRoot.mode === 'open') openCount++;
          else closedCount++;
        }
      }
      return {
        hasShadowDom: shadowHostCount > 0,
        shadowHostCount: shadowHostCount,
        openCount: openCount,
        closedCount: closedCount
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { hasShadowDom: false, shadowHostCount: 0, openCount: 0, closedCount: 0 };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getShadowStyles3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var count = 0;
      var totalRules = 0;
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.shadowRoot && el.shadowRoot.adoptedStyleSheets) {
          var sheets = el.shadowRoot.adoptedStyleSheets;
          count += sheets.length;
          for (var j = 0; j < sheets.length; j++) {
            try { totalRules += sheets[j].cssRules ? sheets[j].cssRules.length : 0; } catch(e) {}
          }
        }
      }
      return { count: count, totalRules: totalRules };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { count: 0, totalRules: 0 };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getShadowSlots3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = Array.from(document.querySelectorAll('*'));
      var out = [];
      for (var i = 0; i < all.length && out.length < 20; i++) {
        var el = all[i];
        if (el.shadowRoot) {
          var slots = Array.from(el.shadowRoot.querySelectorAll('slot'));
          for (var j = 0; j < slots.length && out.length < 20; j++) {
            var slot = slots[j];
            var assigned = 0;
            try { assigned = slot.assignedNodes ? slot.assignedNodes().length : 0; } catch(e) {}
            out.push({
              name: slot.getAttribute('name') || null,
              assignedCount: assigned
            });
          }
        }
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getShadowApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasCustomElements = typeof window.customElements !== 'undefined';
      var hasShadowDom = typeof Element.prototype.attachShadow === 'function';
      var hasTemplateElement = typeof HTMLTemplateElement !== 'undefined';
      var hasSlots = (function() {
        var all = Array.from(document.querySelectorAll('*'));
        for (var i = 0; i < all.length; i++) {
          if (all[i].shadowRoot) {
            var slots = all[i].shadowRoot.querySelectorAll('slot');
            if (slots.length > 0) return true;
          }
        }
        return document.querySelectorAll('slot').length > 0;
      })();
      return {
        hasCustomElements: hasCustomElements,
        hasShadowDom: hasShadowDom,
        hasTemplateElement: hasTemplateElement,
        hasSlots: hasSlots
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result && result.value !== undefined ? result.value : { hasCustomElements: false, hasShadowDom: false, hasTemplateElement: false, hasSlots: false };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
