// theme2.ts — Color/theme/dark-mode inspection functions

export async function getDarkModeSupport(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        var supportsColorScheme = typeof window.matchMedia === 'function';
        return { prefersDark: prefersDark, prefersLight: prefersLight, supportsColorScheme: supportsColorScheme };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getColorScheme3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var meta = document.querySelector('meta[name="color-scheme"]');
        var metaColorScheme = meta ? meta.getAttribute('content') : null;
        var cssColorScheme = getComputedStyle(document.documentElement).colorScheme || null;
        var bodyBg = getComputedStyle(document.body).backgroundColor || null;
        var bodyColor = getComputedStyle(document.body).color || null;
        return {
          metaColorScheme: metaColorScheme,
          cssColorScheme: cssColorScheme,
          bodyBg: bodyBg,
          bodyColor: bodyColor
        };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getBackgroundColors(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
        var counts = {};
        var examples = {};
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          var bg = getComputedStyle(el).backgroundColor;
          if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue;
          if (!counts[bg]) {
            counts[bg] = 0;
            var tag = el.tagName.toLowerCase();
            var id = el.id ? '#' + el.id : '';
            var cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
            examples[bg] = (tag + id + cls).slice(0, 80);
          }
          counts[bg]++;
        }
        var result = Object.keys(counts).map(function(c) {
          return { color: c, count: counts[c], element_example: examples[c] };
        });
        result.sort(function(a, b) { return b.count - a.count; });
        return result.slice(0, 20);
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTextColors(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
        var counts = {};
        var examples = {};
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          var color = getComputedStyle(el).color;
          if (!color || color === '' || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') continue;
          if (!counts[color]) {
            counts[color] = 0;
            var tag = el.tagName.toLowerCase();
            var id = el.id ? '#' + el.id : '';
            var cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
            examples[color] = (tag + id + cls).slice(0, 80);
          }
          counts[color]++;
        }
        var result = Object.keys(counts).map(function(c) {
          return { color: c, count: counts[c], element_example: examples[c] };
        });
        result.sort(function(a, b) { return b.count - a.count; });
        return result.slice(0, 20);
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getBorderColors(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
        var counts = {};
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          var style = getComputedStyle(el);
          var bw = parseFloat(style.borderTopWidth) + parseFloat(style.borderRightWidth) +
                   parseFloat(style.borderBottomWidth) + parseFloat(style.borderLeftWidth);
          if (bw <= 0) continue;
          var bc = style.borderColor;
          if (!bc || bc === 'rgba(0, 0, 0, 0)' || bc === 'transparent') continue;
          counts[bc] = (counts[bc] || 0) + 1;
        }
        var result = Object.keys(counts).map(function(c) {
          return { color: c, count: counts[c] };
        });
        result.sort(function(a, b) { return b.count - a.count; });
        return result.slice(0, 20);
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getContrastRatios(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var selectors = ['h1', 'h2', 'h3', 'p', 'button', 'a', 'label', 'span', 'li'];
        var pairs = [];
        for (var s = 0; s < selectors.length; s++) {
          var els = Array.from(document.querySelectorAll(selectors[s])).slice(0, 3);
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var style = getComputedStyle(el);
            var textColor = style.color;
            var bgColor = style.backgroundColor;
            var tag = el.tagName.toLowerCase();
            var id = el.id ? el.id.slice(0, 40) : '';
            pairs.push({ tag: tag, id: id, text_color: textColor, bg_color: bgColor });
            if (pairs.length >= 20) break;
          }
          if (pairs.length >= 20) break;
        }
        return pairs;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getThemeClasses(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var elements = Array.from(document.querySelectorAll('*'));
        var found = [];
        var pattern = /\\b(dark|light|theme)\\b/i;
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          if (!el.className || typeof el.className !== 'string') continue;
          if (!pattern.test(el.className)) continue;
          var tag = el.tagName.toLowerCase();
          var id = el.id ? el.id.slice(0, 40) : '';
          var cls = el.className.trim().slice(0, 80);
          found.push({ tag: tag, id: id, class_preview: cls });
          if (found.length >= 20) break;
        }
        return found;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getColorDataAttrs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `
      (function() {
        var elements = Array.from(document.querySelectorAll('[data-theme],[data-color-scheme]'));
        var found = [];
        for (var i = 0; i < elements.length && i < 20; i++) {
          var el = elements[i];
          var tag = el.tagName.toLowerCase();
          var id = el.id ? el.id.slice(0, 40) : '';
          var dataTheme = el.getAttribute('data-theme') || null;
          var dataColorScheme = el.getAttribute('data-color-scheme') || null;
          found.push({ tag: tag, id: id, dataTheme: dataTheme, dataColorScheme: dataColorScheme });
        }
        return found;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime error' }, null, 2) }] };
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
