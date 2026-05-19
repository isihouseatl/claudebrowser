export async function getTooltipElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[data-tooltip],[data-tip],[data-bs-toggle="tooltip"],[class*="tooltip"],[title]:not(head title)';return Array.from(document.querySelectorAll(sel)).slice(0,30).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),tooltipText:(el.getAttribute('data-tooltip')||el.getAttribute('data-tip')||el.getAttribute('title')||'').slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTitleAttributes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('[title]')).filter(el=>el.tagName!=='HTML'&&el.tagName!=='HEAD').slice(0,30).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,title_preview:(el.getAttribute('title')||'').slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getAriaDescribedBy(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('[aria-describedby]')).slice(0,20).map(el=>{const ids=(el.getAttribute('aria-describedby')||'').split(' ');const text=ids.map(id=>{const d=document.getElementById(id);return d?(d.textContent||'').trim().slice(0,60):null}).filter(Boolean).join('; ');return{tag:el.tagName.toLowerCase(),id:el.id||null,describedBy:el.getAttribute('aria-describedby'),descriptionText:text.slice(0,100)}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getPopoverTriggers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[data-bs-toggle="popover"],[data-toggle="popover"],[popovertarget],[class*="popover-trigger"],[data-popover]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),popoverContent_preview:(el.getAttribute('data-bs-content')||el.getAttribute('data-content')||'').slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getHelpTexts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="help-text"],[class*="hint"],[class*="helper"],[class*="field-help"],[role="note"],[class*="form-text"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getInfoIcons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="info-icon"],[class*="help-icon"],[class*="icon-info"],[aria-label*="info" i],[aria-label*="help" i],[data-info],[class*="question-mark"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),ariaLabel_preview:(el.getAttribute('aria-label')||'').slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTooltipContent(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="tooltip-content"],[class*="tooltip-inner"],[class*="tippy-content"],[class*="tooltip-text"],[role="tooltip"]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80),visible:getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getHoverCards(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="hover-card"],[class*="hovercard"],[class*="card-hover"],[class*="preview-card"],[data-hovercard]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
