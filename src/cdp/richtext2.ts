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

// ── Rich text / WYSIWYG module (8 additional functions) ──────────────────────

export async function getRichTextEditors2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const selectors = [
        '.ql-container',
        '.ql-editor',
        '.ProseMirror',
        '[data-tippy-content]',
        '.tiptap',
        '[class*="ProseMirror"]',
        '.DraftEditor-root',
        '.public-DraftEditor-content',
        '[data-slate-editor]',
        '.cke_editable',
        '.tox-edit-area',
        '.CodeMirror',
        '[class*="richtext"]',
        '[class*="RichText"]',
        '[class*="editor"][contenteditable]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          if (seen.has(el)) continue;
          seen.add(el);
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null;
          const ce = el.getAttribute('contenteditable');
          const rect = el.getBoundingClientRect();
          let editorLib = 'unknown';
          if (cls && cls.includes('ql-')) editorLib = 'Quill';
          else if (cls && cls.includes('ProseMirror')) editorLib = 'ProseMirror';
          else if (cls && (cls.includes('tiptap') || cls.includes('Tiptap'))) editorLib = 'TipTap';
          else if (el.getAttribute('data-slate-editor')) editorLib = 'Slate';
          else if (cls && cls.includes('DraftEditor')) editorLib = 'DraftJS';
          else if (cls && cls.includes('cke')) editorLib = 'CKEditor';
          else if (cls && cls.includes('tox')) editorLib = 'TinyMCE';
          else if (cls && cls.includes('CodeMirror')) editorLib = 'CodeMirror';
          results.push({
            tag,
            id: el.id || null,
            class_preview: cls,
            contenteditable: ce,
            editorLib,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
          if (results.length >= 20) break;
        }
        if (results.length >= 20) break;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getContentEditableElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const els = Array.from(document.querySelectorAll('[contenteditable]'));
      return els.slice(0, 20).map(el => {
        const rect = el.getBoundingClientRect();
        const ce = el.getAttribute('contenteditable');
        const text = (el.textContent || '').trim();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : null,
          contenteditable: ce,
          text_preview: text.slice(0, 100),
          isEmpty: !text,
          visible: rect.width > 0 && rect.height > 0,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorToolbars2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const selectors = [
        '[role="toolbar"]',
        '.ql-toolbar',
        '.tox-toolbar',
        '.ck-toolbar',
        '.ProseMirror-menubar',
        '.rdw-editor-toolbar',
        '[class*="toolbar"][class*="editor"]',
        '[class*="EditorToolbar"]',
        '[class*="editorToolbar"]',
        '[class*="RichTextToolbar"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          if (seen.has(el)) continue;
          seen.add(el);
          const buttons = el.querySelectorAll('button, [role="button"], .ql-picker');
          const rect = el.getBoundingClientRect();
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
            buttonCount: buttons.length,
            visible: rect.width > 0 && rect.height > 0,
            matchedSelector: sel
          });
          if (results.length >= 10) break;
        }
        if (results.length >= 10) break;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getWysiwygElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const frames = Array.from(document.querySelectorAll('iframe'));
      const results = [];
      for (const f of frames) {
        const src = f.src || f.getAttribute('src') || '';
        const cls = (f.className && typeof f.className === 'string') ? f.className : '';
        const id = f.id || '';
        const title = f.getAttribute('title') || '';
        let editorType = null;
        if (cls.includes('tox') || id.toLowerCase().includes('tinymce') || src.includes('tinymce') || title.toLowerCase().includes('rich text')) editorType = 'TinyMCE';
        else if (cls.includes('cke') || id.startsWith('cke_')) editorType = 'CKEditor';
        else if (id.includes('quill') || cls.includes('quill')) editorType = 'Quill';
        else if (src === '' || src === 'about:blank') editorType = 'inline-wysiwyg';
        if (!editorType) continue;
        const rect = f.getBoundingClientRect();
        results.push({
          id: id || null,
          src_preview: src.slice(0, 80),
          class_preview: cls.slice(0, 60),
          title: title || null,
          editorType,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        });
        if (results.length >= 10) break;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getRichTextState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const ceEls = Array.from(document.querySelectorAll('[contenteditable]'));
      const hasContentEditable = ceEls.length > 0;
      const hasRichTextEditor = !!(
        document.querySelector('.ql-container, .ql-editor') ||
        document.querySelector('.ProseMirror') ||
        document.querySelector('[data-slate-editor]') ||
        document.querySelector('.DraftEditor-root') ||
        document.querySelector('.tiptap') ||
        document.querySelector('[class*="RichText"][contenteditable]')
      );
      const frames = Array.from(document.querySelectorAll('iframe'));
      const hasWysiwyg = frames.some(f => {
        const cls = (f.className && typeof f.className === 'string') ? f.className : '';
        const id = f.id || '';
        return cls.includes('tox') || cls.includes('cke') || id.toLowerCase().includes('tinymce') || id.startsWith('cke_');
      });
      const hasMarkdownEditor = !!(
        document.querySelector('.CodeMirror') ||
        document.querySelector('.monaco-editor') ||
        document.querySelector('[data-mode-id="markdown"]') ||
        document.querySelector('[class*="MarkdownEditor"]') ||
        document.querySelector('[class*="markdownEditor"]')
      );
      let editorCount = 0;
      const editorSelectors = [
        '.ql-container', '.ProseMirror', '[data-slate-editor]',
        '.DraftEditor-root', '.tiptap', '.CodeMirror', '.monaco-editor'
      ];
      const seenEditors = new Set();
      for (const sel of editorSelectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          if (!seenEditors.has(el)) { seenEditors.add(el); editorCount++; }
        }
      }
      return { hasRichTextEditor, hasContentEditable, hasWysiwyg, hasMarkdownEditor, editorCount };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getEditorContent2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const candidateSelectors = [
        '[contenteditable="true"]',
        '[contenteditable=""]',
        '.ProseMirror',
        '.ql-editor',
        '.DraftEditor-content',
        '.public-DraftEditor-content',
        '[data-slate-editor]',
        '.cke_editable',
        '.tiptap'
      ];
      const results = [];
      const seen = new Set();
      const focused = document.activeElement;
      if (focused && focused.getAttribute('contenteditable') != null && !seen.has(focused)) {
        seen.add(focused);
        const text = (focused.textContent || '').trim();
        results.push({
          source: 'focused',
          tag: focused.tagName.toLowerCase(),
          id: focused.id || null,
          text_preview: text.slice(0, 200),
          charCount: text.length,
          wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
        });
      }
      for (const sel of candidateSelectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          if (seen.has(el)) continue;
          seen.add(el);
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          results.push({
            source: sel,
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            text_preview: text.slice(0, 200),
            charCount: text.length,
            wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
          });
          if (results.length >= 5) break;
        }
        if (results.length >= 5) break;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getMarkdownEditors2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const results = [];
      const seen = new Set();

      // CodeMirror 5
      for (const el of Array.from(document.querySelectorAll('.CodeMirror'))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        const modeEl = el.querySelector('.CodeMirror-code');
        results.push({
          lib: 'CodeMirror5',
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : null,
          visible: rect.width > 0 && rect.height > 0,
          hasCode: !!modeEl
        });
        if (results.length >= 10) break;
      }

      // CodeMirror 6
      for (const el of Array.from(document.querySelectorAll('.cm-editor'))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        results.push({
          lib: 'CodeMirror6',
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : null,
          visible: rect.width > 0 && rect.height > 0
        });
        if (results.length >= 10) break;
      }

      // Monaco
      for (const el of Array.from(document.querySelectorAll('.monaco-editor'))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        const modeAttr = el.getAttribute('data-mode-id') || null;
        results.push({
          lib: 'Monaco',
          id: el.id || null,
          data_mode_id: modeAttr,
          isMarkdown: modeAttr === 'markdown',
          visible: rect.width > 0 && rect.height > 0
        });
        if (results.length >= 10) break;
      }

      // Generic markdown editor class hints
      for (const el of Array.from(document.querySelectorAll('[class*="MarkdownEditor"],[class*="markdownEditor"],[class*="md-editor"]'))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        results.push({
          lib: 'generic-markdown',
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          visible: rect.width > 0 && rect.height > 0
        });
        if (results.length >= 10) break;
      }

      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getRichTextApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const hasQuill = typeof window.Quill !== 'undefined' || document.querySelector('.ql-container, .ql-editor') != null;
      const hasTiptap = document.querySelector('.tiptap') != null || document.querySelector('[class*="tiptap"]') != null ||
        (typeof window.__tiptapExtensions !== 'undefined');
      const hasProseMirror = typeof window.ProseMirror !== 'undefined' || document.querySelector('.ProseMirror') != null ||
        document.querySelector('[class*="ProseMirror"]') != null;
      const hasTinymce = typeof window.tinymce !== 'undefined' ||
        document.querySelector('.tox-tinymce, .tox-edit-area') != null;
      const hasCkeditor = typeof window.CKEDITOR !== 'undefined' ||
        typeof window.ClassicEditor !== 'undefined' ||
        typeof window.InlineEditor !== 'undefined' ||
        document.querySelector('.ck-editor, .cke_editable, .ck-content') != null;
      const hasDraftjs = typeof window.Draft !== 'undefined' ||
        document.querySelector('.DraftEditor-root, .public-DraftEditor-content') != null;
      const hasSlate = document.querySelector('[data-slate-editor]') != null;
      const hasCodeMirror = typeof window.CodeMirror !== 'undefined' ||
        document.querySelector('.CodeMirror, .cm-editor') != null;
      const hasMonaco = typeof window.monaco !== 'undefined' ||
        document.querySelector('.monaco-editor') != null;
      return { hasQuill, hasTiptap, hasProseMirror, hasTinymce, hasCkeditor, hasDraftjs, hasSlate, hasCodeMirror, hasMonaco };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
