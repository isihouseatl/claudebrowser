export async function getStepperElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="stepper"],[class*="step-indicator"],[class*="wizard"],[role="tablist"][aria-label*="step" i],[class*="progress-steps"]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),stepCount:el.querySelectorAll('[class*="step"],[role="tab"]').length})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getWizardSteps(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="wizard-step"],[class*="step-item"],[class*="step-tab"],[role="tab"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,40),isActive:el.classList.contains('active')||el.getAttribute('aria-selected')==='true',isCompleted:el.classList.contains('completed')||el.classList.contains('done')})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getProgressSteps(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="step"][class*="progress"],[class*="progress-step"],[class*="step-number"],[class*="step-circle"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map((el,i)=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),stepNumber:i+1,text_preview:(el.textContent||'').trim().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getStepIndicators(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="step-num"],[class*="step-count"],[class*="step-label"],[class*="step-title"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,number:(el.textContent||'').trim().match(/^\\d+$/)?parseInt((el.textContent||'').trim()):null,text_preview:(el.textContent||'').trim().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCurrentStep(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const active=document.querySelector('[class*="step"].active,[class*="step"][aria-current="step"],[class*="step-active"],[class*="current-step"]');if(!active)return{tag:null,id:null,class_preview:null,text_preview:null,stepIndex:null};const parent=active.parentElement;const siblings=parent?Array.from(parent.children):[];return{tag:active.tagName.toLowerCase(),id:active.id||null,class_preview:(active.className||'').toString().slice(0,40),text_preview:(active.textContent||'').trim().slice(0,60),stepIndex:siblings.indexOf(active)} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCompletedSteps(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="step-complete"],[class*="step-done"],[class*="step-finished"],[class*="step"].completed,[class*="step"].done';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getStepNavigation(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('button,a,[role="button"]'));return all.filter(el=>{const t=(el.textContent||'').toLowerCase().trim();const c=(el.className||'').toString().toLowerCase();return t==='next'||t==='previous'||t==='back'||t==='next step'||t==='prev'||c.includes('step-next')||c.includes('step-prev')||c.includes('wizard-next')||c.includes('wizard-prev')}).slice(0,20).map(el=>{const t=(el.textContent||'').toLowerCase().trim();return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,40),type:t.includes('next')?'next':t.includes('prev')||t.includes('back')?'prev':'other'}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getMultiStepForms(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="multi-step"],[class*="multistep"],[class*="step-form"],[data-steps],[class*="wizard-form"]';return Array.from(document.querySelectorAll(sel)).slice(0,5).map(el=>({id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),totalSteps:el.querySelectorAll('[class*="step"],[data-step]').length,currentStepIndex:Array.from(el.querySelectorAll('[class*="step"],[data-step]')).findIndex(s=>s.classList.contains('active'))})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
