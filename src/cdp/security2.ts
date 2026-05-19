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
