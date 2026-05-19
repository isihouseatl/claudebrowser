// src/cdp/text2.ts
import { CdpClient } from './client';

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpResult {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// 1. Get document.body.innerText trimmed. Returns { text, wordCount, charCount }. Truncated to 5000 chars.
export async function getPageTextContent(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const raw = (document.body.innerText || '').trim();
  const text = raw.slice(0, 5000);
  const words = text.trim().split(/\\s+/).filter(function(w) { return w.length > 0; });
  return JSON.stringify({ text: text, wordCount: words.length, charCount: text.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 2. Get innerText of all elements matching selector. Returns { texts, count }. Max 20 elements, each truncated to 500 chars.
export async function getTextBySelector(client: CdpClient, selector: string): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var sel = ${JSON.stringify(selector)};
  var els = Array.from(document.querySelectorAll(sel)).slice(0, 20);
  var texts = els.map(function(el) {
    return (el.innerText || el.textContent || '').trim().slice(0, 500);
  });
  return JSON.stringify({ texts: texts, count: texts.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 3. Find all text nodes containing query (case-insensitive). Returns { matches: [{text, parentTag, parentId}], count }. Max 20 matches.
export async function searchPageText(client: CdpClient, query: string): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var needle = ${JSON.stringify(query)}.toLowerCase();
  var walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
  var matches = [];
  var node;
  while ((node = walker.nextNode()) && matches.length < 20) {
    var text = node.textContent || '';
    if (text.toLowerCase().indexOf(needle) !== -1) {
      var parent = node.parentElement;
      matches.push({
        text: text.trim().slice(0, 200),
        parentTag: parent ? parent.tagName.toLowerCase() : '',
        parentId: parent ? (parent.id || '') : ''
      });
    }
  }
  return JSON.stringify({ matches: matches, count: matches.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 4. Get text from only visible elements (not display:none or visibility:hidden). Returns { text, wordCount }. Truncated to 3000 chars.
export async function getVisibleText(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  function isVisible(el) {
    var style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  var all = Array.from(document.body.querySelectorAll('*'));
  var parts = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (!isVisible(el)) continue;
    var children = el.childNodes;
    for (var j = 0; j < children.length; j++) {
      var node = children[j];
      if (node.nodeType === 3) {
        var t = (node.textContent || '').trim();
        if (t.length > 0) parts.push(t);
      }
    }
  }
  var text = parts.join(' ').slice(0, 3000);
  var words = text.trim().split(/\\s+/).filter(function(w) { return w.length > 0; });
  return JSON.stringify({ text: text, wordCount: words.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 5. Get all <p> element text content. Returns { paragraphs, count }. Max 30, each truncated to 300 chars.
export async function getParagraphs2(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var els = Array.from(document.querySelectorAll('p')).slice(0, 30);
  var paragraphs = els.map(function(el) {
    return (el.innerText || el.textContent || '').trim().slice(0, 300);
  }).filter(function(t) { return t.length > 0; });
  return JSON.stringify({ paragraphs: paragraphs, count: paragraphs.length });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 6. Get character count and word count of text inside selector. Returns { charCount, wordCount, text_preview }.
export async function getTextLength(client: CdpClient, selector: string): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var sel = ${JSON.stringify(selector)};
  var el = document.querySelector(sel);
  if (!el) return JSON.stringify({ error: 'No element found for selector: ' + sel });
  var text = (el.innerText || el.textContent || '').trim();
  var words = text.split(/\\s+/).filter(function(w) { return w.length > 0; });
  return JSON.stringify({
    charCount: text.length,
    wordCount: words.length,
    text_preview: text.slice(0, 100)
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  if (data.error) return err(data.error);
  return ok(data);
}

// 7. Get all <a> elements: { text, href, id, class, target, isExternal }. isExternal = href starts with http and not current domain. Max 50.
export async function getLinks(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var currentDomain = location.hostname;
  var els = Array.from(document.querySelectorAll('a')).slice(0, 50);
  var links = els.map(function(el) {
    var href = el.getAttribute('href') || '';
    var isExternal = /^https?:\\/\\//.test(href) && href.indexOf(currentDomain) === -1;
    return {
      text: (el.innerText || el.textContent || '').trim().slice(0, 100),
      href: href,
      id: el.id || '',
      class: el.className || '',
      target: el.getAttribute('target') || '',
      isExternal: isExternal
    };
  });
  return JSON.stringify(links);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}

// 8. Return link counts: { total, internal, external, withoutText, broken_possible }.
export async function getLinksCount(client: CdpClient): Promise<McpResult> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  var currentDomain = location.hostname;
  var els = Array.from(document.querySelectorAll('a'));
  var total = els.length;
  var external = 0;
  var internal = 0;
  var withoutText = 0;
  var broken_possible = 0;
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var href = el.getAttribute('href') || '';
    var text = (el.innerText || el.textContent || '').trim();
    if (/^https?:\\/\\//.test(href) && href.indexOf(currentDomain) === -1) {
      external++;
    } else {
      internal++;
    }
    if (text.length === 0) withoutText++;
    if (href === '' || href === '#') broken_possible++;
  }
  return JSON.stringify({ total: total, internal: internal, external: external, withoutText: withoutText, broken_possible: broken_possible });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  }
  const data = JSON.parse(result.value as string);
  return ok(data);
}
