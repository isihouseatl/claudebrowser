import type CRI from 'chrome-remote-interface';

export async function getContentEditableElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const els = Array.from(document.querySelectorAll('[contenteditable]'));
    return els.slice(0, 20).map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : null,
      text_preview: (el.textContent || '').trim().slice(0, 80),
      isEmpty: !(el.textContent || '').trim()
    }));
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorToolbars(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[role="toolbar"]',
      '.ql-toolbar',
      '.tox-toolbar',
      '.ck-toolbar',
      '.ProseMirror-menubar',
      '.DraftEditor-toolbar',
      '[class*="toolbar"]',
      '[class*="Toolbar"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const buttons = el.querySelectorAll('button, [role="button"]');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : null,
          buttonCount: buttons.length
        });
        if (results.length >= 10) break;
      }
      if (results.length >= 10) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorContent(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const focused = document.activeElement;
    let el = null;
    if (focused && focused.getAttribute('contenteditable') != null) {
      el = focused;
    } else {
      el = document.querySelector('[contenteditable="true"]') ||
           document.querySelector('[contenteditable=""]') ||
           document.querySelector('.ProseMirror') ||
           document.querySelector('.ql-editor') ||
           document.querySelector('.DraftEditor-content') ||
           document.querySelector('.cke_editable') ||
           document.querySelector('.tox-edit-area__iframe');
    }
    if (!el) return { tag: null, id: null, html_preview: null, text_preview: null, wordCount: 0 };
    const text = (el.textContent || '').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      html_preview: el.innerHTML.slice(0, 200),
      text_preview: text.slice(0, 150),
      wordCount: words
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorSelection(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const sel = window.getSelection();
    if (!sel) return { text_preview: null, isCollapsed: true, length: 0 };
    const text = sel.toString();
    return {
      text_preview: text.slice(0, 120),
      isCollapsed: sel.isCollapsed,
      length: text.length
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getWysiwygFrames(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const frames = Array.from(document.querySelectorAll('iframe'));
    const results = [];
    for (const f of frames) {
      const src = f.src || f.getAttribute('src') || '';
      const cls = (f.className && typeof f.className === 'string') ? f.className : '';
      const id = f.id || '';
      let editorType = 'unknown';
      if (cls.includes('tox') || id.includes('tinymce') || src.includes('tinymce')) editorType = 'TinyMCE';
      else if (cls.includes('cke') || id.includes('cke')) editorType = 'CKEditor';
      else if (id.includes('quill') || cls.includes('quill')) editorType = 'Quill';
      else if (src === '' || src === 'about:blank') editorType = 'inline-wysiwyg';
      const rect = f.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0 || editorType !== 'unknown') {
        results.push({
          src_preview: src.slice(0, 80),
          id: id || null,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          editorType
        });
      }
      if (results.length >= 10) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const toolbarSelectors = [
      '[role="toolbar"] button',
      '[role="toolbar"] [role="button"]',
      '.ql-toolbar button',
      '.ql-toolbar .ql-picker',
      '.tox-toolbar button',
      '.ck-toolbar button',
      '.ck-toolbar .ck-button',
      '.ProseMirror-menubar button',
      '[class*="toolbar"] button',
      '[class*="Toolbar"] button'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of toolbarSelectors) {
      for (const btn of Array.from(document.querySelectorAll(sel))) {
        if (seen.has(btn)) continue;
        seen.add(btn);
        const cls = (btn.className && typeof btn.className === 'string') ? btn.className : '';
        const isActive = cls.includes('active') || cls.includes('ql-active') || btn.getAttribute('aria-pressed') === 'true';
        results.push({
          tag: btn.tagName.toLowerCase(),
          id: btn.id || null,
          text_preview: (btn.textContent || btn.getAttribute('title') || btn.getAttribute('aria-label') || '').trim().slice(0, 40),
          class_preview: cls.slice(0, 60),
          isActive
        });
        if (results.length >= 30) break;
      }
      if (results.length >= 30) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorPlugins(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    return {
      hasTinyMCE: typeof window.tinymce !== 'undefined',
      hasCKEditor: typeof window.CKEDITOR !== 'undefined' || typeof window.ClassicEditor !== 'undefined',
      hasQuill: typeof window.Quill !== 'undefined' || document.querySelector('.ql-container') != null,
      hasDraft: document.querySelector('.DraftEditor-root') != null || document.querySelector('.public-DraftEditor-content') != null,
      hasSlate: document.querySelector('[data-slate-editor]') != null,
      hasProseMirror: typeof window.ProseMirror !== 'undefined' || document.querySelector('.ProseMirror') != null
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const sel = window.getSelection();
    const hasSelection = !!(sel && !sel.isCollapsed && sel.toString().length > 0);
    const focused = document.activeElement;
    const isContentEditable = focused ? focused.getAttribute('contenteditable') != null : false;

    let editorType = 'none';
    let hasEditor = false;

    if (typeof window.tinymce !== 'undefined' && window.tinymce.activeEditor) {
      editorType = 'TinyMCE'; hasEditor = true;
    } else if (typeof window.CKEDITOR !== 'undefined' || typeof window.ClassicEditor !== 'undefined') {
      editorType = 'CKEditor'; hasEditor = true;
    } else if (typeof window.Quill !== 'undefined' || document.querySelector('.ql-container') != null) {
      editorType = 'Quill'; hasEditor = true;
    } else if (document.querySelector('[data-slate-editor]') != null) {
      editorType = 'Slate'; hasEditor = true;
    } else if (document.querySelector('.ProseMirror') != null) {
      editorType = 'ProseMirror'; hasEditor = true;
    } else if (document.querySelector('[contenteditable]') != null) {
      editorType = 'contenteditable'; hasEditor = true;
    }

    return {
      hasEditor,
      editorType,
      isEditing: isContentEditable,
      isFocused: isContentEditable,
      hasSelection
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
