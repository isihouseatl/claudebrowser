export async function getCommentElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="comment"],[id*="comment"],[class*="reply"],[id*="reply"],[data-testid*="comment"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80)})) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCommentForms(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const forms=Array.from(document.querySelectorAll('form'));return forms.filter(f=>{const s=(f.id||'')+(f.className||'').toString();return /comment|reply|respond/i.test(s)}).slice(0,10).map(f=>({id:f.id||null,class_preview:(f.className||'').toString().slice(0,40),hasTextarea:!!f.querySelector('textarea'),hasSubmitButton:!!f.querySelector('[type="submit"],button[type="submit"]')})) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCommentCount(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="comment-count"],[id*="comment-count"],[class*="comments-count"],[class*="comment_count"],[data-comment-count],[aria-label*="comment"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),count_preview:(el.textContent||'').trim().slice(0,30)})) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getNestedComments(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="comment"],[id*="comment"]';const els=Array.from(document.querySelectorAll(sel));return els.filter(el=>{const p=el.closest('[class*="comment"],[id*="comment"]');return p&&p!==el}).slice(0,20).map(el=>{let depth=0,cur=el.parentElement;while(cur){if(/comment/i.test(cur.className||cur.id||''))depth++;cur=cur.parentElement}return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),depth,childCount:el.querySelectorAll('[class*="comment"],[id*="comment"]').length}}) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCommentState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const commentEls=document.querySelectorAll('[class*="comment"],[id*="comment"]');const forms=Array.from(document.querySelectorAll('form')).filter(f=>/comment|reply|respond/i.test((f.id||'')+(f.className||'').toString()));const nested=Array.from(commentEls).filter(el=>{const p=el.closest('[class*="comment"],[id*="comment"]');return p&&p!==el});const pagination=document.querySelectorAll('[class*="comment-pag"],[id*="comment-pag"],[class*="comments-nav"]');return{hasComments:commentEls.length>0,commentCount:commentEls.length,hasForm:forms.length>0,hasNested:nested.length>0,hasPagination:pagination.length>0} })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getReplyButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="reply"],[id*="reply"],[data-action*="reply"],[aria-label*="reply"],[aria-label*="Reply"]';const byText=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(el=>/^reply$/i.test((el.textContent||'').trim()));const bySel=Array.from(document.querySelectorAll(sel));const all=[...new Set([...bySel,...byText])].slice(0,20);return all.map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,text_preview:(el.textContent||'').trim().slice(0,40),class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCommentAuthors(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="comment-author"],[id*="comment-author"],[class*="comment__author"],[class*="comment-name"],[class*="commenter"],[itemprop="author"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCommentApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const scripts=Array.from(document.querySelectorAll('script[src]')).map(s=>s.src||'');return{hasDisqus:typeof window.DISQUS!=='undefined'||typeof window.disqus_config!=='undefined'||scripts.some(s=>/disqus/i.test(s)),hasDiscourse:typeof window.Discourse!=='undefined'||scripts.some(s=>/discourse/i.test(s)),hasNativeComments:document.querySelector('#comments,#respond,.comments-area,.comment-section')!==null,hasWordpressComments:document.querySelector('#commentform,#comments.comments-area,.comment-form')!==null} })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}
