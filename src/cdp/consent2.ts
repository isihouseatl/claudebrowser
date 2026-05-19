export async function getConsentBanners(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="consent"],[class*="cookie-banner"],[class*="gdpr"],[id*="consent"],[id*="cookie-banner"],[id*="gdpr"],[class*="cookie-notice"],[aria-label*="cookie" i]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getPrivacyLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('a')).filter(a=>{const t=(a.textContent||'').toLowerCase();const h=(a.href||'').toLowerCase();return t.includes('privacy')||h.includes('privacy')}).slice(0,20).map(a=>({text_preview:(a.textContent||'').trim().slice(0,60),href_preview:a.href.slice(-80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getGdprElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="gdpr"],[id*="gdpr"],[data-gdpr],[class*="ccpa"],[id*="ccpa"]';const els=Array.from(document.querySelectorAll(sel));const textEls=Array.from(document.querySelectorAll('*')).filter(el=>(el.textContent||'').toLowerCase().includes('gdpr')&&!el.querySelector('*[class*=gdpr]')).slice(0,5);return [...els,...textEls].slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getCookiePreferences(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="cookie-settings"],[class*="cookie-prefs"],[id*="cookie-settings"],[id*="cookie-prefs"],[class*="preference"],[data-cookie-settings]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getConsentButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('button,a,[role="button"]'));const kw=['accept','reject','decline','agree','disagree','manage','preferences','opt out','opt in'];return all.filter(el=>{const t=(el.textContent||'').toLowerCase().trim();return kw.some(k=>t.includes(k))}).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getPrivacyPolicyLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('a')).filter(a=>{const t=(a.textContent||'').toLowerCase();const h=(a.href||'').toLowerCase();return(t.includes('privacy policy')||h.includes('privacy-policy')||h.includes('privacy_policy'))}).slice(0,10).map(a=>({text_preview:(a.textContent||'').trim().slice(0,60),href_preview:a.href.slice(-80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTermsLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('a')).filter(a=>{const t=(a.textContent||'').toLowerCase();const h=(a.href||'').toLowerCase();return t.includes('terms')||h.includes('terms')||t.includes('conditions')}).slice(0,10).map(a=>({text_preview:(a.textContent||'').trim().slice(0,60),href_preview:a.href.slice(-80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getDoNotTrack(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return{doNotTrack:window.doNotTrack||null,globalPrivacyControl:navigator.globalPrivacyControl||null,navigatorDoNotTrack:navigator.doNotTrack||null} })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
