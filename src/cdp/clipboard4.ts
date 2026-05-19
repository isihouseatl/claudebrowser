/**
 * clipboard4.ts — Clipboard introspection: permissions, state, interactive elements,
 * event listeners, API usage patterns, and select-all contexts.
 */

// ─── 1. getClipboardPermission2 ────────────────────────────────────────────

/**
 * getClipboardPermission2 — Clipboard read/write permissions: {readState, writeState, isGranted}
 */
export async function getClipboardPermission2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => {
      const out = { readState: 'unknown', writeState: 'unknown', isGranted: false };
      try {
        const r = await navigator.permissions.query({ name: 'clipboard-read' });
        out.readState = r.state;
      } catch (e) {
        out.readState = 'error:' + e.message;
      }
      try {
        const w = await navigator.permissions.query({ name: 'clipboard-write' });
        out.writeState = w.state;
      } catch (e) {
        out.writeState = 'error:' + e.message;
      }
      out.isGranted = out.readState === 'granted' && out.writeState === 'granted';
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 2. getClipboardState ───────────────────────────────────────────────────

/**
 * getClipboardState — Clipboard API availability:
 * {hasClipboardApi, hasExecCommandCopy, hasExecCommandPaste}
 */
export async function getClipboardState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      return {
        hasClipboardApi: !!(navigator.clipboard && typeof navigator.clipboard.readText === 'function'),
        hasExecCommandCopy: document.queryCommandSupported ? document.queryCommandSupported('copy') : false,
        hasExecCommandPaste: document.queryCommandSupported ? document.queryCommandSupported('paste') : false,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 3. getCopyButtons2 ────────────────────────────────────────────────────

/**
 * getCopyButtons2 — Buttons/elements that trigger copy:
 * [{tag, id, text_preview, class_preview}] (max 20)
 */
export async function getCopyButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const COPY_PATTERN = /copy|clipboard/i;
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, span, div'));
      const hits = [];
      for (const el of candidates) {
        const id = el.id || '';
        const cls = el.className && typeof el.className === 'string' ? el.className : '';
        const aria = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const dataAction = el.getAttribute('data-action') || el.getAttribute('data-clipboard-action') || '';
        const text = (el.textContent || '').trim().slice(0, 80);
        const combined = id + ' ' + cls + ' ' + aria + ' ' + title + ' ' + dataAction + ' ' + text;
        if (COPY_PATTERN.test(combined)) {
          hits.push({
            tag: el.tagName.toLowerCase(),
            id: id.slice(0, 60),
            text_preview: text.slice(0, 60),
            class_preview: cls.slice(0, 60),
          });
          if (hits.length >= 20) break;
        }
      }
      return hits;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 4. getCutButtons ──────────────────────────────────────────────────────

/**
 * getCutButtons — Buttons/elements that trigger cut:
 * [{tag, id, text_preview, class_preview}] (max 20)
 */
export async function getCutButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const CUT_PATTERN = /\\bcut\\b/i;
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, span, div'));
      const hits = [];
      for (const el of candidates) {
        const id = el.id || '';
        const cls = el.className && typeof el.className === 'string' ? el.className : '';
        const aria = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const dataAction = el.getAttribute('data-action') || '';
        const text = (el.textContent || '').trim().slice(0, 80);
        const combined = id + ' ' + cls + ' ' + aria + ' ' + title + ' ' + dataAction + ' ' + text;
        if (CUT_PATTERN.test(combined)) {
          hits.push({
            tag: el.tagName.toLowerCase(),
            id: id.slice(0, 60),
            text_preview: text.slice(0, 60),
            class_preview: cls.slice(0, 60),
          });
          if (hits.length >= 20) break;
        }
      }
      return hits;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 5. getPasteTargets ────────────────────────────────────────────────────

/**
 * getPasteTargets — Elements that accept paste input:
 * [{tag, id, type, contenteditable}] (max 20)
 */
export async function getPasteTargets(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const hits = [];
      const candidates = Array.from(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]), textarea, [contenteditable]'
      ));
      for (const el of candidates) {
        const tag = el.tagName.toLowerCase();
        const id = (el.id || '').slice(0, 60);
        const type = el.getAttribute('type') || '';
        const ce = el.getAttribute('contenteditable') || '';
        hits.push({ tag, id, type, contenteditable: ce });
        if (hits.length >= 20) break;
      }
      return hits;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 6. getClipboardEventListeners ─────────────────────────────────────────

/**
 * getClipboardEventListeners — Summary of clipboard event handler presence:
 * {hasCopy, hasCut, hasPaste, listenerCount}
 */
export async function getClipboardEventListeners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      // Inspect inline handlers on document and body, and scan all elements for oncopy/oncut/onpaste attributes
      let hasCopy = false, hasCut = false, hasPaste = false, listenerCount = 0;

      // Check document-level
      if (typeof document.oncopy === 'function') { hasCopy = true; listenerCount++; }
      if (typeof document.oncut === 'function')  { hasCut = true;  listenerCount++; }
      if (typeof document.onpaste === 'function') { hasPaste = true; listenerCount++; }

      // Check body-level
      const body = document.body;
      if (body) {
        if (typeof body.oncopy === 'function') { hasCopy = true; listenerCount++; }
        if (typeof body.oncut === 'function')  { hasCut = true;  listenerCount++; }
        if (typeof body.onpaste === 'function') { hasPaste = true; listenerCount++; }
      }

      // Walk all elements for attribute-based handlers
      const all = Array.from(document.querySelectorAll('[oncopy],[oncut],[onpaste]'));
      for (const el of all) {
        if (el.hasAttribute('oncopy')) { hasCopy = true; listenerCount++; }
        if (el.hasAttribute('oncut'))  { hasCut = true;  listenerCount++; }
        if (el.hasAttribute('onpaste')) { hasPaste = true; listenerCount++; }
      }

      return { hasCopy, hasCut, hasPaste, listenerCount };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 7. getClipboardApiUsage ───────────────────────────────────────────────

/**
 * getClipboardApiUsage — Detected clipboard-related patterns:
 * {usesClipboardApi, usesExecCommand, hasClipboardButton}
 */
export async function getClipboardApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      // Detect navigator.clipboard usage by checking if any script text contains it
      let usesClipboardApi = false;
      let usesExecCommand = false;

      const scripts = Array.from(document.querySelectorAll('script'));
      for (const s of scripts) {
        const src = s.textContent || '';
        if (!usesClipboardApi && src.includes('navigator.clipboard')) usesClipboardApi = true;
        if (!usesExecCommand && src.includes('execCommand')) usesExecCommand = true;
        if (usesClipboardApi && usesExecCommand) break;
      }

      // hasClipboardButton: any element whose attributes/text strongly suggest clipboard
      const CLIP_PATTERN = /copy|clipboard|cut/i;
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      let hasClipboardButton = false;
      for (const el of buttons) {
        const combined = (el.id || '') + ' ' + (el.className || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '').trim();
        if (CLIP_PATTERN.test(combined)) { hasClipboardButton = true; break; }
      }

      return { usesClipboardApi, usesExecCommand, hasClipboardButton };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// ─── 8. getSelectAllElements ───────────────────────────────────────────────

/**
 * getSelectAllElements — Elements/contexts with select-all behavior:
 * [{tag, id, class_preview, text_preview}] (max 20)
 */
export async function getSelectAllElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const SA_PATTERN = /select.?all|selectAll/i;
      const hits = [];

      // Inline handlers + aria + data attrs
      const candidates = Array.from(document.querySelectorAll('*'));
      for (const el of candidates) {
        const id = el.id || '';
        const cls = el.className && typeof el.className === 'string' ? el.className : '';
        const aria = el.getAttribute('aria-label') || '';
        const dataAction = el.getAttribute('data-action') || el.getAttribute('data-shortcut') || '';
        const title = el.getAttribute('title') || '';
        const text = (el.textContent || '').trim().slice(0, 80);
        const combined = id + ' ' + cls + ' ' + aria + ' ' + dataAction + ' ' + title + ' ' + text;
        if (SA_PATTERN.test(combined)) {
          const tag = el.tagName.toLowerCase();
          if (['script', 'style', 'head', 'html', 'body', 'meta', 'link'].includes(tag)) continue;
          hits.push({
            tag,
            id: id.slice(0, 60),
            class_preview: cls.slice(0, 60),
            text_preview: text.slice(0, 60),
          });
          if (hits.length >= 20) break;
        }
      }
      return hits;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const data = result.value ?? result;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
