// src/cdp/security2.ts
// DOM-inspection security helpers.
// Conflicts with security.ts: getContentSecurityPolicy -> getContentSecurityPolicy2
//                              getExternalScripts       -> getExternalScripts2
//                              getSubresourceIntegrity  -> getSubresourceIntegrity2

export async function getContentSecurityPolicy2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  const metas = Array.from(document.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"], meta[http-equiv="Content-Security-Policy-Report-Only"]'
  ));
  return metas.slice(0, 5).map(function(m) {
    const content = m.getAttribute('content') || '';
    return {
      source: 'meta',
      http_equiv: m.getAttribute('http-equiv') || '',
      policy_preview: content.slice(0, 100)
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getMixedContentLinks(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  if (location.protocol !== 'https:') return [];
  var items = [];
  document.querySelectorAll('a[href^="http://"]').forEach(function(el) {
    if (items.length < 20) items.push({ tag: 'a', src_preview: el.getAttribute('href').slice(0, 100), type: 'link' });
  });
  document.querySelectorAll('script[src^="http://"]').forEach(function(el) {
    if (items.length < 20) items.push({ tag: 'script', src_preview: el.getAttribute('src').slice(0, 100), type: 'script' });
  });
  document.querySelectorAll('iframe[src^="http://"]').forEach(function(el) {
    if (items.length < 20) items.push({ tag: 'iframe', src_preview: el.getAttribute('src').slice(0, 100), type: 'iframe' });
  });
  document.querySelectorAll('img[src^="http://"]').forEach(function(el) {
    if (items.length < 20) items.push({ tag: 'img', src_preview: el.getAttribute('src').slice(0, 100), type: 'image' });
  });
  document.querySelectorAll('link[href^="http://"]').forEach(function(el) {
    if (items.length < 20) items.push({ tag: 'link', src_preview: el.getAttribute('href').slice(0, 100), type: 'stylesheet' });
  });
  return items.slice(0, 20);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getCrossOriginLinks(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var origin = window.location.origin;
  var items = [];
  document.querySelectorAll('a[href]').forEach(function(el) {
    if (items.length >= 20) return;
    var href = el.getAttribute('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      try {
        var u = new URL(href);
        if (u.origin !== origin) {
          items.push({
            href_preview: href.slice(0, 100),
            text_preview: (el.textContent || '').trim().slice(0, 80)
          });
        }
      } catch(e) {}
    }
  });
  return items.slice(0, 20);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSubresourceIntegrity2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  document.querySelectorAll('script[integrity], link[integrity]').forEach(function(el) {
    if (items.length >= 20) return;
    var src = el.getAttribute('src') || el.getAttribute('href') || '';
    var integrity = el.getAttribute('integrity') || '';
    items.push({
      tag: el.tagName.toLowerCase(),
      src_preview: src.slice(0, 100),
      integrity_preview: integrity.slice(0, 80)
    });
  });
  return items;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getIframePermissions(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  document.querySelectorAll('iframe').forEach(function(el) {
    if (items.length >= 10) return;
    var src = el.getAttribute('src') || '';
    var allow = el.getAttribute('allow') || null;
    var sandbox = el.getAttribute('sandbox') || null;
    if (allow !== null || sandbox !== null) {
      items.push({
        src_preview: src.slice(0, 100),
        allow: allow,
        sandbox: sandbox
      });
    }
  });
  return items;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getExternalScripts2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  document.querySelectorAll('script[src]').forEach(function(el) {
    if (items.length >= 20) return;
    var src = el.getAttribute('src') || '';
    items.push({
      src_preview: src.slice(0, 100),
      async: el.hasAttribute('async'),
      defer: el.hasAttribute('defer'),
      type: el.getAttribute('type') || null
    });
  });
  return items;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getPasswordFields(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  document.querySelectorAll('input[type=password]').forEach(function(el) {
    if (items.length >= 10) return;
    var form = el.form;
    items.push({
      id: el.id || null,
      name: el.name || null,
      autocomplete: el.getAttribute('autocomplete') || null,
      form_id: form ? (form.id || null) : null
    });
  });
  return items;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getFormActions(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  document.querySelectorAll('form').forEach(function(el) {
    if (items.length >= 20) return;
    var action = el.getAttribute('action') || null;
    items.push({
      id: el.id || null,
      action: action ? action.slice(0, 100) : null,
      method: (el.getAttribute('method') || 'get').toUpperCase(),
      enctype: el.getAttribute('enctype') || null
    });
  });
  return items;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

// --- Security Indicators Block (appended) ---
// Conflicts resolved:
//   getContentSecurityPolicy (security.ts) + getContentSecurityPolicy2 (above) -> getContentSecurityPolicy3

export async function getCspHeaders(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var metas = Array.from(document.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"], meta[http-equiv="Content-Security-Policy-Report-Only"]'
  ));
  return metas.slice(0, 10).map(function(m) {
    var content = m.getAttribute('content') || '';
    return {
      http_equiv: m.getAttribute('http-equiv') || '',
      directives: content.split(';').map(function(d) { return d.trim(); }).filter(Boolean).slice(0, 20),
      raw_preview: content.slice(0, 200)
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getHttpsState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  return {
    isHttps: location.protocol === 'https:',
    protocol: location.protocol,
    host: location.host,
    href_preview: location.href.slice(0, 200),
    isSecureContext: (typeof isSecureContext !== 'undefined') ? isSecureContext : null
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSecurityHeaders(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var relevant = [
    'x-frame-options', 'referrer-policy', 'x-content-type-options',
    'strict-transport-security', 'permissions-policy', 'feature-policy',
    'x-xss-protection', 'cross-origin-opener-policy', 'cross-origin-embedder-policy',
    'cross-origin-resource-policy'
  ];
  var found = [];
  document.querySelectorAll('meta[http-equiv]').forEach(function(m) {
    var name = (m.getAttribute('http-equiv') || '').toLowerCase();
    if (relevant.indexOf(name) !== -1) {
      found.push({
        source: 'meta',
        name: name,
        value: (m.getAttribute('content') || '').slice(0, 200)
      });
    }
  });
  // Referrer-Policy via meta[name=referrer]
  document.querySelectorAll('meta[name="referrer"]').forEach(function(m) {
    found.push({
      source: 'meta[name]',
      name: 'referrer-policy',
      value: (m.getAttribute('content') || '').slice(0, 100)
    });
  });
  return found.slice(0, 20);
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getMixedContent(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  if (location.protocol !== 'https:') return { skipped: true, reason: 'page is not HTTPS' };
  var items = [];
  [
    { sel: 'img[src^="http://"]', type: 'image', attr: 'src' },
    { sel: 'script[src^="http://"]', type: 'script', attr: 'src' },
    { sel: 'link[rel="stylesheet"][href^="http://"]', type: 'stylesheet', attr: 'href' },
    { sel: 'source[src^="http://"]', type: 'source', attr: 'src' },
    { sel: 'video[src^="http://"]', type: 'video', attr: 'src' },
    { sel: 'audio[src^="http://"]', type: 'audio', attr: 'src' },
    { sel: 'iframe[src^="http://"]', type: 'iframe', attr: 'src' }
  ].forEach(function(def) {
    document.querySelectorAll(def.sel).forEach(function(el) {
      if (items.length < 30) {
        items.push({ type: def.type, url_preview: (el.getAttribute(def.attr) || '').slice(0, 120) });
      }
    });
  });
  return { count: items.length, items: items.slice(0, 30) };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getContentSecurityPolicy3(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var metas = Array.from(document.querySelectorAll('meta[http-equiv]')).filter(function(m) {
    var he = (m.getAttribute('http-equiv') || '').toLowerCase();
    return he === 'content-security-policy' || he === 'content-security-policy-report-only';
  });
  if (metas.length === 0) return { found: false, directives: {} };
  var policy = metas[0].getAttribute('content') || '';
  var directives = {};
  policy.split(';').forEach(function(part) {
    var trimmed = part.trim();
    if (!trimmed) return;
    var space = trimmed.indexOf(' ');
    var key = space === -1 ? trimmed : trimmed.slice(0, space);
    var val = space === -1 ? '' : trimmed.slice(space + 1).trim();
    directives[key.toLowerCase()] = val.slice(0, 150);
  });
  return { found: true, source: 'meta', directive_count: Object.keys(directives).length, directives: directives };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getFrameOptions(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  // X-Frame-Options via meta http-equiv
  var xfo = null;
  document.querySelectorAll('meta[http-equiv]').forEach(function(m) {
    if ((m.getAttribute('http-equiv') || '').toLowerCase() === 'x-frame-options') {
      xfo = (m.getAttribute('content') || '').slice(0, 100);
    }
  });
  // frame-ancestors from CSP meta
  var frameAncestors = null;
  document.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]').forEach(function(m) {
    var content = m.getAttribute('content') || '';
    content.split(';').forEach(function(d) {
      var t = d.trim();
      if (t.toLowerCase().startsWith('frame-ancestors')) {
        frameAncestors = t.slice(0, 150);
      }
    });
  });
  // Iframes embedding this page — check if window has a parent
  var isIframed = (window.self !== window.top);
  return {
    x_frame_options_meta: xfo,
    frame_ancestors_csp: frameAncestors,
    page_is_in_iframe: isIframed
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getCorsIndicators(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var items = [];
  var selectors = [
    { sel: 'script[crossorigin]', type: 'script', srcAttr: 'src' },
    { sel: 'link[crossorigin]', type: 'link', srcAttr: 'href' },
    { sel: 'img[crossorigin]', type: 'img', srcAttr: 'src' },
    { sel: 'video[crossorigin]', type: 'video', srcAttr: 'src' },
    { sel: 'audio[crossorigin]', type: 'audio', srcAttr: 'src' }
  ];
  selectors.forEach(function(def) {
    document.querySelectorAll(def.sel).forEach(function(el) {
      if (items.length >= 20) return;
      items.push({
        tag: def.type,
        crossorigin: el.getAttribute('crossorigin') || '',
        src_preview: (el.getAttribute(def.srcAttr) || '').slice(0, 100),
        has_integrity: el.hasAttribute('integrity')
      });
    });
  });
  return { count: items.length, items: items };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export async function getSecurityApiUsage(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
  var hasCspMeta = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]').length > 0;
  var hasSri = document.querySelectorAll('[integrity]').length > 0;
  var hasCrossorigin = document.querySelectorAll('[crossorigin]').length > 0;
  var hasHttps = location.protocol === 'https:';
  // HSTS detection: can only confirm if page is HTTPS; actual header not accessible from JS
  // We detect hsts indirectly via meta if present
  var hasHstsMeta = false;
  document.querySelectorAll('meta[http-equiv]').forEach(function(m) {
    if ((m.getAttribute('http-equiv') || '').toLowerCase() === 'strict-transport-security') {
      hasHstsMeta = true;
    }
  });
  var sriCount = document.querySelectorAll('[integrity]').length;
  var crossoriginCount = document.querySelectorAll('[crossorigin]').length;
  var cspDirectiveCount = 0;
  if (hasCspMeta) {
    var cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]');
    if (cspMeta) {
      cspDirectiveCount = (cspMeta.getAttribute('content') || '').split(';').filter(function(d) { return d.trim().length > 0; }).length;
    }
  }
  return {
    hasCSP: hasCspMeta,
    hasSri: hasSri,
    hasCrossorigin: hasCrossorigin,
    hasHttps: hasHttps,
    hasHsts: hasHstsMeta,
    sriCount: sriCount,
    crossoriginCount: crossoriginCount,
    cspDirectiveCount: cspDirectiveCount,
    isSecureContext: (typeof isSecureContext !== 'undefined') ? isSecureContext : null
  };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  const data = exceptionDetails
    ? { error: exceptionDetails.text || 'evaluation failed' }
    : result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
