// src/cdp/share2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getShareButtons2 — Share buttons: [{tag, id, text_preview, class_preview, platform}] (max 20)
export async function getShareButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="share"], [aria-label*="share"], [data-action*="share"], [data-share], button[class*="social"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      const platformMap = [
        ['twitter', 'Twitter'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'],
        ['whatsapp', 'WhatsApp'], ['pinterest', 'Pinterest'], ['telegram', 'Telegram'],
        ['reddit', 'Reddit'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['email', 'Email']
      ];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const combined = (cls || '') + ' ' + textRaw + ' ' + ariaLabel;
        let platform = null;
        for (const [key, label] of platformMap) {
          if (combined.toLowerCase().includes(key)) { platform = label; break; }
        }
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text_preview: textRaw.slice(0, 80),
          class_preview: cls ? cls.slice(0, 80) : null,
          platform
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 2. getSocialShareLinks — Social share links (Twitter, Facebook, LinkedIn etc): [{tag, href_preview, platform, text_preview}] (max 20)
export async function getSocialShareLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const shareHosts = [
        ['twitter.com/intent/tweet', 'Twitter'],
        ['x.com/intent/tweet', 'Twitter/X'],
        ['facebook.com/sharer', 'Facebook'],
        ['facebook.com/dialog/share', 'Facebook'],
        ['linkedin.com/shareArticle', 'LinkedIn'],
        ['linkedin.com/sharing', 'LinkedIn'],
        ['pinterest.com/pin/create', 'Pinterest'],
        ['reddit.com/submit', 'Reddit'],
        ['wa.me/', 'WhatsApp'],
        ['api.whatsapp.com/send', 'WhatsApp'],
        ['t.me/share', 'Telegram'],
        ['telegram.me/share', 'Telegram'],
        ['mailto:', 'Email'],
        ['tumblr.com/widgets/share', 'Tumblr']
      ];
      const links = Array.from(document.querySelectorAll('a[href]'));
      const seen = new Set();
      const results = [];
      for (const el of links) {
        if (seen.has(el)) continue;
        const href = el.getAttribute('href') || '';
        let platform = null;
        for (const [fragment, label] of shareHosts) {
          if (href.includes(fragment)) { platform = label; break; }
        }
        if (!platform) continue;
        seen.add(el);
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          tag: el.tagName.toLowerCase(),
          href_preview: href.slice(0, 120),
          platform,
          text_preview: textRaw.slice(0, 80)
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 3. getShareState — Share UI summary: {hasShareButton, hasSocialLinks, hasNativeShare, hasCopyLink}
export async function getShareState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const shareButtonSel = '[class*="share"], [aria-label*="share"], [data-action*="share"], [data-share]';
      const hasShareButton = document.querySelectorAll(shareButtonSel).length > 0;

      const socialHosts = ['twitter.com/intent', 'x.com/intent', 'facebook.com/sharer', 'linkedin.com/share', 'wa.me/', 'api.whatsapp.com/send', 't.me/share'];
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const hasSocialLinks = allLinks.some(function(el) {
        const href = el.getAttribute('href') || '';
        return socialHosts.some(function(h) { return href.includes(h); });
      });

      const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

      const copyLinkSel = '[class*="copy-link"], [class*="copylink"], [aria-label*="copy link"], [aria-label*="copy url"], [data-action*="copy"]';
      const copyByText = Array.from(document.querySelectorAll('button, a')).some(function(el) {
        const txt = (el.textContent || '').toLowerCase().trim();
        return txt === 'copy link' || txt === 'copy url' || txt === 'copy';
      });
      const hasCopyLink = document.querySelectorAll(copyLinkSel).length > 0 || copyByText;

      return { hasShareButton, hasSocialLinks, hasNativeShare, hasCopyLink };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getCopyLinkButtons — Copy link/URL buttons: [{tag, id, text_preview, class_preview}] (max 20)
export async function getCopyLinkButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const bySel = Array.from(document.querySelectorAll(
        '[class*="copy-link"], [class*="copylink"], [class*="copy-url"], [class*="copyurl"], [aria-label*="copy link"], [aria-label*="copy url"], [data-action*="copy"]'
      ));
      const byText = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(function(el) {
        const txt = (el.textContent || '').toLowerCase().trim();
        return txt === 'copy link' || txt === 'copy url' || txt === 'copy' || txt === 'copy to clipboard';
      });
      const seen = new Set();
      const results = [];
      const combined = bySel.concat(byText);
      for (const el of combined) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text_preview: textRaw.slice(0, 80),
          class_preview: cls ? cls.slice(0, 80) : null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getShareDialog — Share modal/dialog: {visible, tag, id, class_preview, hasOptions}
export async function getShareDialog(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const dialogSel = '[class*="share-modal"], [class*="sharemodal"], [class*="share-dialog"], [class*="sharedialog"], [role="dialog"][class*="share"], dialog[class*="share"]';
      const dialogs = Array.from(document.querySelectorAll(dialogSel));
      // Also check any visible dialog/modal that contains share content
      const genericDialogs = Array.from(document.querySelectorAll('[role="dialog"], dialog, [class*="modal"]'));
      const allCandidates = dialogs.concat(genericDialogs.filter(function(d) {
        return (d.textContent || '').toLowerCase().includes('share');
      }));
      const seen = new Set();
      for (const el of allCandidates) {
        if (seen.has(el)) continue;
        seen.add(el);
        const style = window.getComputedStyle(el);
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const socialCount = el.querySelectorAll('[class*="share"], a[href*="twitter"], a[href*="facebook"], a[href*="linkedin"]').length;
        return {
          visible,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          hasOptions: socialCount > 1
        };
      }
      return { visible: false, tag: null, id: null, class_preview: null, hasOptions: false };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getShareApiUsage — Detected share patterns: {hasWebShareApi, hasSocialButtons, hasCopyLink, hasEmbedCode}
export async function getShareApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const hasWebShareApi = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

      const socialHosts = ['twitter.com/intent', 'x.com/intent', 'facebook.com/sharer', 'facebook.com/dialog/share', 'linkedin.com/share', 'wa.me/', 'api.whatsapp.com', 't.me/share', 'reddit.com/submit', 'pinterest.com/pin'];
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const hasSocialButtons = allLinks.some(function(el) {
        const href = el.getAttribute('href') || '';
        return socialHosts.some(function(h) { return href.includes(h); });
      }) || document.querySelectorAll('[class*="share"][class*="button"], [class*="share"][class*="btn"], [class*="social-share"]').length > 0;

      const copyLinkSel = '[class*="copy-link"], [class*="copylink"], [aria-label*="copy link"], [data-action*="copy"]';
      const copyByText = Array.from(document.querySelectorAll('button, a, [role="button"]')).some(function(el) {
        const txt = (el.textContent || '').toLowerCase().trim();
        return txt === 'copy link' || txt === 'copy url' || txt === 'copy';
      });
      const hasCopyLink = document.querySelectorAll(copyLinkSel).length > 0 || copyByText;

      const hasEmbedCode = document.querySelectorAll(
        '[class*="embed"], textarea[class*="share"], input[class*="embed-code"], [data-embed], [id*="embed-code"]'
      ).length > 0;

      return { hasWebShareApi, hasSocialButtons, hasCopyLink, hasEmbedCode };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 7. getEmbedShareElements — Embed code/iframe share elements: [{tag, id, class_preview, value_preview}] (max 10)
export async function getEmbedShareElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="embed"], textarea[class*="share"], input[class*="embed-code"], [data-embed], [id*="embed-code"], [id*="embed"], [class*="embed-code"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const tag = el.tagName.toLowerCase();
        let value_preview = null;
        if (tag === 'input' || tag === 'textarea') {
          value_preview = ((el.value || el.getAttribute('value') || el.getAttribute('placeholder') || '')).slice(0, 120);
        } else {
          const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
          value_preview = textRaw.slice(0, 120);
        }
        results.push({
          tag,
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          value_preview
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 8. getShareCount — Share count display elements: [{tag, id, class_preview, count_preview, platform}] (max 20)
export async function getShareCount(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="share-count"], [class*="sharecount"], [class*="share-number"], [data-share-count], [class*="social-count"]';
      const bySel = Array.from(document.querySelectorAll(sel));
      // Also find any small numeric elements adjacent to share icons
      const byText = Array.from(document.querySelectorAll('[class*="share"] + *, [class*="share"] span, [class*="share"] [class*="count"]'));
      const seen = new Set();
      const results = [];
      const platformMap = [
        ['twitter', 'Twitter'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'],
        ['pinterest', 'Pinterest'], ['reddit', 'Reddit'], ['whatsapp', 'WhatsApp']
      ];
      const combined = bySel.concat(byText);
      for (const el of combined) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        // Only include if it looks like a count (numeric or K/M suffix)
        if (!/^[\\d,.]+[KkMm]?$/.test(textRaw.replace(/,/g, '')) && textRaw.length > 10) continue;
        const combined2 = (cls || '') + ' ' + (el.id || '') + ' ' + textRaw;
        let platform = null;
        for (const [key, label] of platformMap) {
          if (combined2.toLowerCase().includes(key)) { platform = label; break; }
        }
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          count_preview: textRaw.slice(0, 20),
          platform
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
