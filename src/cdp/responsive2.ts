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
