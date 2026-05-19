// src/cdp/responsive2.ts
import type { CdpClient } from './client';

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// Check which common CSS breakpoints match the current viewport width.
// Breakpoints: xs(<576), sm(>=576), md(>=768), lg(>=992), xl(>=1200), xxl(>=1400)
export async function getBreakpointInfo(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var w = window.innerWidth;
    var result = {
      width: w,
      xs: w < 576,
      sm: w >= 576,
      md: w >= 768,
      lg: w >= 992,
      xl: w >= 1200,
      xxl: w >= 1400,
      active: []
    };
    if (w < 576) result.active.push('xs');
    else if (w < 768) result.active.push('sm');
    else if (w < 992) result.active.push('md');
    else if (w < 1200) result.active.push('lg');
    else if (w < 1400) result.active.push('xl');
    else result.active.push('xxl');
    return JSON.stringify(result);
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// If query is provided, evaluate that specific media query and return { query, matches }.
// If omitted, return a fixed set of common media query results.
export async function getMediaQueryMatches(
  client: CdpClient,
  query?: string
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = query
    ? `JSON.stringify({ query: ${JSON.stringify(query)}, matches: window.matchMedia(${JSON.stringify(query)}).matches })`
    : `(function() {
    var queries = [
      { name: 'prefers-dark', query: '(prefers-color-scheme: dark)' },
      { name: 'prefers-reduced-motion', query: '(prefers-reduced-motion: reduce)' },
      { name: 'portrait', query: '(orientation: portrait)' },
      { name: 'landscape', query: '(orientation: landscape)' },
      { name: 'hover', query: '(hover: hover)' },
      { name: 'pointer-coarse', query: '(pointer: coarse)' }
    ];
    var result = {};
    for (var i = 0; i < queries.length; i++) {
      result[queries[i].name] = window.matchMedia(queries[i].query).matches;
    }
    return JSON.stringify(result);
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// Check if the current viewport width is <= 768px (mobile breakpoint).
export async function isMobileViewport(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `JSON.stringify({ isMobile: window.innerWidth <= 768, width: window.innerWidth })`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// Get the current window.devicePixelRatio.
export async function getDevicePixelRatio(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `JSON.stringify({ devicePixelRatio: window.devicePixelRatio })`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// Return portrait or landscape based on width vs height comparison.
export async function getViewportOrientation(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    return JSON.stringify({
      orientation: w >= h ? 'landscape' : 'portrait',
      width: w,
      height: h
    });
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// enable=true injects a <style id="cdp-print-test"> with @media print overrides.
// enable=false removes it. Idempotent in both directions.
export async function simulatePrintMedia(
  client: CdpClient,
  enable: boolean
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var existingId = 'cdp-print-test';
    var existing = document.getElementById(existingId);
    if (${enable ? 'false' : 'true'}) {
      if (existing) { existing.parentNode.removeChild(existing); return JSON.stringify({ active: false, message: 'Print test style removed.' }); }
      return JSON.stringify({ active: false, message: 'Print test style was not active.' });
    }
    if (existing) existing.parentNode.removeChild(existing);
    var style = document.createElement('style');
    style.id = existingId;
    style.setAttribute('data-cdp-print-marker', 'true');
    style.textContent = [
      '@media print {',
      '  [data-print-hidden] { display: none !important; }',
      '  [data-print-show] { display: block !important; }',
      '  body::before { content: "CDP Print Test Active"; display: block; font-size: 10px; color: #999; }',
      '}'
    ].join('\\n');
    document.head.appendChild(style);
    return JSON.stringify({ active: true, styleId: existingId });
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// Find elements that use container queries by checking getComputedStyle container-type.
export async function getContainerQueries(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var all = document.querySelectorAll('*');
    var containers = [];
    for (var i = 0; i < all.length && containers.length < 20; i++) {
      var el = all[i];
      var style = getComputedStyle(el);
      var containerType = style.getPropertyValue('container-type');
      if (containerType && containerType !== 'normal' && containerType.trim() !== '') {
        var tag = el.tagName.toLowerCase();
        var id = el.id ? '#' + el.id : null;
        var cls = el.className && typeof el.className === 'string' && el.className.trim()
          ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ')
          : null;
        var containerName = style.getPropertyValue('container-name') || null;
        var rect = el.getBoundingClientRect();
        containers.push({
          tag: tag,
          id: id,
          class: cls,
          containerType: containerType.trim(),
          containerName: containerName && containerName.trim() !== 'none' ? containerName.trim() : null,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    }
    return JSON.stringify({ count: containers.length, containers: containers });
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// List elements with display:flex or display:inline-flex (max 15).
// Returns tag, id, class, flex-direction, flex-wrap for each.
export async function getFlexContainers(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    var all = document.querySelectorAll('*');
    var flexEls = [];
    for (var i = 0; i < all.length && flexEls.length < 15; i++) {
      var el = all[i];
      var style = getComputedStyle(el);
      var display = style.display;
      if (display === 'flex' || display === 'inline-flex') {
        var tag = el.tagName.toLowerCase();
        var id = el.id ? el.id : null;
        var cls = el.className && typeof el.className === 'string' && el.className.trim()
          ? el.className.trim().split(/\\s+/).slice(0, 3).join(' ')
          : null;
        flexEls.push({
          tag: tag,
          id: id,
          class: cls,
          display: display,
          direction: style.flexDirection,
          wrap: style.flexWrap
        });
      }
    }
    return JSON.stringify({ count: flexEls.length, elements: flexEls });
  })()`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  if (exceptionDetails) {
    return err(exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error');
  }

  return ok(JSON.parse(result.value as string));
}

// Detect active CSS breakpoints from stylesheets by parsing @media rules.
export async function getBreakpoints(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var breakpoints = [];
      var seen = {};
      try {
        var sheets = document.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
          var rules;
          try { rules = sheets[s].cssRules; } catch(e) { continue; }
          if (!rules) continue;
          for (var r = 0; r < rules.length; r++) {
            var rule = rules[r];
            if (rule.type === 4 && rule.conditionText) {
              var cond = rule.conditionText;
              if (seen[cond]) continue;
              seen[cond] = true;
              var matches = window.matchMedia(cond).matches;
              var widthMatch = cond.match(/(?:min|max)-width:\\s*([\\d.]+)(px|em|rem)/i);
              breakpoints.push({
                query: cond,
                matches: matches,
                width: widthMatch ? parseFloat(widthMatch[1]) + widthMatch[2] : null,
                type: cond.indexOf('min-width') !== -1 ? 'min-width' : cond.indexOf('max-width') !== -1 ? 'max-width' : 'other'
              });
              if (breakpoints.length >= 25) break;
            }
          }
          if (breakpoints.length >= 25) break;
        }
      } catch(e) {}
      return JSON.stringify({ count: breakpoints.length, breakpoints: breakpoints });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// Return which media queries are currently matching from a standard set.
export async function getMediaQueryState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var checks = [
        { name: 'prefers-dark', q: '(prefers-color-scheme: dark)' },
        { name: 'prefers-light', q: '(prefers-color-scheme: light)' },
        { name: 'prefers-reduced-motion', q: '(prefers-reduced-motion: reduce)' },
        { name: 'portrait', q: '(orientation: portrait)' },
        { name: 'landscape', q: '(orientation: landscape)' },
        { name: 'hover', q: '(hover: hover)' },
        { name: 'pointer-coarse', q: '(pointer: coarse)' },
        { name: 'pointer-fine', q: '(pointer: fine)' },
        { name: 'min-width-576', q: '(min-width: 576px)' },
        { name: 'min-width-768', q: '(min-width: 768px)' },
        { name: 'min-width-992', q: '(min-width: 992px)' },
        { name: 'min-width-1200', q: '(min-width: 1200px)' },
        { name: 'min-width-1400', q: '(min-width: 1400px)' },
        { name: 'high-dpr', q: '(min-resolution: 2dppx)' },
        { name: 'print', q: 'print' }
      ];
      var state = {};
      for (var i = 0; i < checks.length; i++) {
        state[checks[i].name] = window.matchMedia(checks[i].q).matches;
      }
      return JSON.stringify({ state: state });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// Return the current viewport width and which common breakpoint it falls in (xs/sm/md/lg/xl).
export async function getViewportBreakpoint(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var bp;
      if (w < 576) bp = 'xs';
      else if (w < 768) bp = 'sm';
      else if (w < 992) bp = 'md';
      else if (w < 1200) bp = 'lg';
      else bp = 'xl';
      return JSON.stringify({
        viewportWidth: w,
        viewportHeight: h,
        breakpoint: bp,
        devicePixelRatio: window.devicePixelRatio,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// Find images with srcset attributes or inside <picture> elements (max 20).
// Named getResponsiveImages2 to avoid conflict with getResponsiveImages in image2.ts.
export async function getResponsiveImages2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var items = [];
      var imgs = document.querySelectorAll('img[srcset], picture img, source[srcset]');
      for (var i = 0; i < imgs.length && items.length < 20; i++) {
        var el = imgs[i];
        var inPicture = el.closest ? !!el.closest('picture') : false;
        var srcset = el.getAttribute('srcset') || '';
        var sizes = el.getAttribute('sizes') || null;
        var src = el.getAttribute('src') || null;
        var alt = el.getAttribute('alt') || null;
        var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {};
        items.push({
          tag: el.tagName.toLowerCase(),
          src: src ? src.split('?')[0].split('/').slice(-1)[0] : null,
          inPicture: inPicture,
          hasSrcset: !!srcset,
          srcsetEntries: srcset ? srcset.split(',').length : 0,
          sizes: sizes,
          alt: alt,
          width: Math.round(rect.width || 0),
          height: Math.round(rect.height || 0)
        });
      }
      return JSON.stringify({ count: items.length, images: items });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// List elements using flexbox layout (max 20).
// Named getFlexContainers4 to avoid conflict with getFlexContainers (responsive2),
// getFlexContainers2 (grid2), and getFlexContainers3 (layout2).
export async function getFlexContainers4(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = document.querySelectorAll('*');
      var items = [];
      var skip = { HTML: 1, HEAD: 1, SCRIPT: 1, STYLE: 1, META: 1, LINK: 1, TITLE: 1 };
      for (var i = 0; i < all.length && items.length < 20; i++) {
        var el = all[i];
        if (skip[el.tagName]) continue;
        var style = getComputedStyle(el);
        var display = style.display;
        if (display !== 'flex' && display !== 'inline-flex') continue;
        var id = el.id ? '#' + el.id : null;
        var cls = el.className && typeof el.className === 'string' && el.className.trim()
          ? el.className.trim().split(/\\s+/).slice(0, 3).join('.')
          : null;
        var rect = el.getBoundingClientRect();
        items.push({
          tag: el.tagName.toLowerCase(),
          id: id,
          class: cls,
          display: display,
          flexDirection: style.flexDirection,
          flexWrap: style.flexWrap,
          justifyContent: style.justifyContent,
          alignItems: style.alignItems,
          childCount: el.children.length,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
      return JSON.stringify({ count: items.length, elements: items });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// List elements using CSS grid layout (max 20).
// Named getGridContainers3 to avoid conflict with getGridContainers (grid2) and getGridContainers2 (layout2).
export async function getGridContainers3(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var all = document.querySelectorAll('*');
      var items = [];
      var skip = { HTML: 1, HEAD: 1, SCRIPT: 1, STYLE: 1, META: 1, LINK: 1, TITLE: 1 };
      for (var i = 0; i < all.length && items.length < 20; i++) {
        var el = all[i];
        if (skip[el.tagName]) continue;
        var style = getComputedStyle(el);
        var display = style.display;
        if (display !== 'grid' && display !== 'inline-grid') continue;
        var id = el.id ? '#' + el.id : null;
        var cls = el.className && typeof el.className === 'string' && el.className.trim()
          ? el.className.trim().split(/\\s+/).slice(0, 3).join('.')
          : null;
        var rect = el.getBoundingClientRect();
        items.push({
          tag: el.tagName.toLowerCase(),
          id: id,
          class: cls,
          display: display,
          templateColumns: style.gridTemplateColumns,
          templateRows: style.gridTemplateRows,
          gap: style.gap,
          columnCount: style.gridTemplateColumns !== 'none' ? style.gridTemplateColumns.trim().split(/\\s+/).length : null,
          childCount: el.children.length,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
      return JSON.stringify({ count: items.length, elements: items });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// Summary of responsive state: viewport dimensions, breakpoint, flex/grid/responsive image presence.
export async function getResponsiveState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var bp;
      if (w < 576) bp = 'xs';
      else if (w < 768) bp = 'sm';
      else if (w < 992) bp = 'md';
      else if (w < 1200) bp = 'lg';
      else bp = 'xl';
      var hasFlex = false, hasGrid = false;
      var all = document.querySelectorAll('*');
      var skip = { HTML: 1, HEAD: 1, SCRIPT: 1, STYLE: 1, META: 1, LINK: 1, TITLE: 1 };
      for (var i = 0; i < all.length; i++) {
        if (skip[all[i].tagName]) continue;
        var d = getComputedStyle(all[i]).display;
        if (d === 'flex' || d === 'inline-flex') hasFlex = true;
        if (d === 'grid' || d === 'inline-grid') hasGrid = true;
        if (hasFlex && hasGrid) break;
      }
      var hasResponsiveImages = document.querySelectorAll('img[srcset], picture img').length > 0;
      return JSON.stringify({
        viewportWidth: w,
        viewportHeight: h,
        breakpoint: bp,
        hasFlex: hasFlex,
        hasGrid: hasGrid,
        hasResponsiveImages: hasResponsiveImages
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// Detect which responsive CSS frameworks and layout patterns are in use on the page.
export async function getResponsiveApiUsage(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var allClasses = Array.from(document.querySelectorAll('[class]')).map(function(el) {
        return el.className && typeof el.className === 'string' ? el.className : '';
      }).join(' ');
      var hasTailwind = /\\b(flex|grid|container|mx-auto|px-|py-|text-|bg-|w-|h-|sm:|md:|lg:|xl:)/.test(allClasses);
      var hasBootstrap = /\\b(col-|row|container|d-flex|d-grid|navbar|btn|card)/.test(allClasses);
      var hasMui = /\\bMui[A-Z]/.test(allClasses) || !!document.querySelector('[data-mui-color-scheme]');
      var hasFlexbox = false, hasCssGrid = false;
      var all = document.querySelectorAll('*');
      var skip = { HTML: 1, HEAD: 1, SCRIPT: 1, STYLE: 1, META: 1, LINK: 1, TITLE: 1 };
      for (var i = 0; i < all.length; i++) {
        if (skip[all[i].tagName]) continue;
        var d = getComputedStyle(all[i]).display;
        if (d === 'flex' || d === 'inline-flex') hasFlexbox = true;
        if (d === 'grid' || d === 'inline-grid') hasCssGrid = true;
        if (hasFlexbox && hasCssGrid) break;
      }
      var hasContainerQueries = false;
      try {
        var sheets = document.styleSheets;
        for (var s = 0; s < sheets.length && !hasContainerQueries; s++) {
          var rules;
          try { rules = sheets[s].cssRules; } catch(e) { continue; }
          if (!rules) continue;
          for (var r = 0; r < rules.length; r++) {
            if (rules[r].type === 6) { hasContainerQueries = true; break; }
          }
        }
      } catch(e) {}
      return JSON.stringify({
        hasTailwind: hasTailwind,
        hasBootstrap: hasBootstrap,
        hasMui: hasMui,
        hasFlexbox: hasFlexbox,
        hasCssGrid: hasCssGrid,
        hasContainerQueries: hasContainerQueries
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
