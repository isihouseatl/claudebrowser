export async function getMutationObservers2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{supported:typeof MutationObserver!=='undefined',nativeMutationObserver:typeof MutationObserver!=='undefined'} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getIntersectionObservers2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{supported:typeof IntersectionObserver!=='undefined'} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getResizeObservers2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{supported:typeof ResizeObserver!=='undefined'} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getPerformanceObservers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { try{return{supported:typeof PerformanceObserver!=='undefined',entryTypes:PerformanceObserver.supportedEntryTypes?Array.from(PerformanceObserver.supportedEntryTypes):[]}}catch(e){return{supported:false,entryTypes:[]}} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getObservableMutations(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const res=[];document.querySelectorAll('[data-observe],[aria-live],[data-watch],[data-bind]').forEach(el=>{if(res.length<20)res.push({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),reason:el.getAttribute('aria-live')?'aria-live':el.getAttribute('data-observe')?'data-observe':'data-watch/bind'})});return res })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getObserverTargets(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('img[data-src],img[loading="lazy"],[data-lazy-src]')).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,dataSrc:el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||null,loading:el.getAttribute('loading')||null})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getObserverCallbacks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const html=document.documentElement.innerHTML;return{hasLazyLoad:html.includes('IntersectionObserver')||document.querySelectorAll('[data-src],[loading="lazy"]').length>0,hasInfiniteScroll:document.querySelectorAll('[class*="infinite"],[class*="load-more"],[data-infinite]').length>0,hasAnimationTrigger:document.querySelectorAll('[class*="animate"],[class*="fade-in"],[class*="reveal"]').length>0} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getObserverThresholds(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{lazyCount:document.querySelectorAll('[data-src],[loading="lazy"]').length,animateCount:document.querySelectorAll('[class*="animate"],[class*="fade-in"]').length,stickyCount:document.querySelectorAll('[class*="sticky"],[style*="sticky"]').length,revealCount:document.querySelectorAll('[class*="reveal"],[class*="appear"]').length} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
