// src/cdp/badge2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getBadgeElements2 — badge/pill UI elements: [{tag, id, class_preview, text_preview, color_preview}] (max 30)
export async function getBadgeElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="badge"], [class*="pill"], [class*="chip"], [class*="tag"], [class*="label"], [role="status"][class*="badge"], [data-badge]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40) : null;
        const style = window.getComputedStyle(el);
        const color = style.backgroundColor || style.color || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text,
          color_preview: color ? color.slice(0, 40) : null
        });
        if (results.length >= 30) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 2. getCounterBadges — numeric counter badges: [{tag, id, class_preview, count_preview}] (max 20)
export async function getCounterBadges(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="badge"], [class*="count"], [class*="counter"], [class*="notification-dot"], [class*="bubble"], [aria-label*="notification"], [data-count]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const dataCount = el.getAttribute('data-count') || el.getAttribute('data-badge') || null;
        const isNumeric = /^\\d+$/.test(text) || (dataCount !== null && /^\\d+$/.test(String(dataCount)));
        if (!isNumeric && !dataCount) continue;
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          count_preview: dataCount ? String(dataCount).slice(0, 20) : text.slice(0, 20)
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 3. getStatusBadges — status indicator badges (online, offline, success, error): [{tag, id, class_preview, text_preview, status}] (max 20)
export async function getStatusBadges(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="status"]', '[class*="online"]', '[class*="offline"]',
        '[class*="success"]', '[class*="error"]', '[class*="warning"]',
        '[class*="active"]', '[class*="inactive"]', '[role="status"]',
        '[aria-label*="online"]', '[aria-label*="offline"]', '[aria-label*="status"]',
        '[data-status]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40) : null;
        const dataStatus = el.getAttribute('data-status') || null;
        const clsLower = cls ? cls.toLowerCase() : '';
        let status = dataStatus;
        if (!status) {
          if (clsLower.includes('online') || clsLower.includes('active')) status = 'online';
          else if (clsLower.includes('offline') || clsLower.includes('inactive')) status = 'offline';
          else if (clsLower.includes('success')) status = 'success';
          else if (clsLower.includes('error') || clsLower.includes('danger')) status = 'error';
          else if (clsLower.includes('warning')) status = 'warning';
          else status = 'unknown';
        }
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text,
          status
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 4. getTagElements — tag/chip elements: [{tag, id, class_preview, text_preview, removable}] (max 30)
export async function getTagElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="tag"], [class*="chip"], [class*="token"], [class*="keyword"], [role="listitem"][class*="tag"], [data-tag]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40) : null;
        const hasRemove = el.querySelector('button[aria-label*="remove"], button[aria-label*="delete"], [class*="remove"], [class*="close"], [class*="dismiss"]') !== null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text,
          removable: hasRemove
        });
        if (results.length >= 30) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 5. getBadgeState — badge summary: {hasBadges, hasCounters, hasStatusBadges, hasTags, totalCount}
export async function getBadgeState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const badges = document.querySelectorAll('[class*="badge"], [data-badge]');
      const counters = Array.from(document.querySelectorAll('[class*="count"], [class*="counter"], [data-count]')).filter(el => {
        const t = el.textContent ? el.textContent.trim() : '';
        return /^\\d+$/.test(t) || el.getAttribute('data-count') !== null;
      });
      const statusEls = document.querySelectorAll('[class*="status"], [role="status"], [data-status]');
      const tags = document.querySelectorAll('[class*="tag"], [class*="chip"], [class*="token"]');
      const pills = document.querySelectorAll('[class*="pill"]');
      const labels = document.querySelectorAll('label, [class*="label"]');
      return {
        hasBadges: badges.length > 0,
        hasCounters: counters.length > 0,
        hasStatusBadges: statusEls.length > 0,
        hasTags: tags.length > 0,
        totalCount: badges.length + counters.length + statusEls.length + tags.length + pills.length + labels.length
      };
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 6. getPillElements — pill-shaped elements: [{tag, id, class_preview, text_preview}] (max 20)
export async function getPillElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="pill"], [class*="rounded-full"], [class*="capsule"], [class*="lozenge"]';
      const els = Array.from(document.querySelectorAll(sel));
      const cssRounded = [];
      for (const el of document.querySelectorAll('span, div, button, a')) {
        const style = window.getComputedStyle(el);
        const br = style.borderRadius || '';
        const w = el.getBoundingClientRect().width;
        const h = el.getBoundingClientRect().height;
        if (h > 0 && parseFloat(br) >= h / 2) {
          cssRounded.push(el);
        }
      }
      const combined = [...new Set([...els, ...cssRounded])];
      const results = [];
      for (const el of combined) {
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40) : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 7. getLabelElements — label elements (HTML label or custom labels): [{tag, id, class_preview, text_preview, forAttr}] (max 20)
export async function getLabelElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = 'label, [class*="label"], [role="label"], [aria-label]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60) : null;
        const forAttr = el.getAttribute('for') || el.getAttribute('htmlFor') || el.getAttribute('aria-labelledby') || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text,
          forAttr
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}

// 8. getBadgeApiUsage — detected badge patterns: {hasBadgeComponent, hasCounterBadge, hasStatusDot, hasTagSystem}
export async function getBadgeApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const hasBadgeComponent = document.querySelector('[class*="badge"]') !== null
        || document.querySelector('[data-badge]') !== null
        || document.querySelector('[class*="Badge"]') !== null;
      const hasCounterBadge = document.querySelector('[class*="count"], [class*="counter"], [data-count]') !== null
        || Array.from(document.querySelectorAll('[class*="badge"]')).some(el => /^\\d+$/.test((el.textContent || '').trim()));
      const hasStatusDot = document.querySelector('[class*="status-dot"], [class*="dot--"], [class*="indicator"], [class*="presence"]') !== null
        || document.querySelector('[data-status]') !== null;
      const hasTagSystem = document.querySelector('[class*="tag"], [class*="chip"], [class*="token"]') !== null
        || document.querySelector('[class*="Tag"], [class*="Chip"]') !== null;
      return {
        hasBadgeComponent,
        hasCounterBadge,
        hasStatusDot,
        hasTagSystem
      };
    } catch(e) { return { error: String(e) }; }
  })()`;
  try {
    const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
    return ok(result.value);
  } catch(e) { return err(String(e)); }
}
