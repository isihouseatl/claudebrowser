// src/cdp/auth2.ts

export async function getLoginForms(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('form')).filter(f=>f.querySelector('input[type="password"]')||f.querySelector('input[type="email"]')||f.querySelector('[name*="password"]')||f.querySelector('[name*="email"]')).slice(0,10).map(f=>({id:f.id||null,class_preview:(f.className||'').slice(0,40),hasEmail:!!f.querySelector('input[type="email"],[name*="email"],[name*="username"]'),hasPassword:!!f.querySelector('input[type="password"]'),submitText:(f.querySelector('[type="submit"],button[type="submit"]')||{textContent:''}).textContent.trim().slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSocialLoginButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('button,a,[role="button"]'));const kw=['google','facebook','twitter','github','apple','microsoft','linkedin','discord','slack','oauth'];return all.filter(el=>{const t=(el.textContent||'').toLowerCase();const c=(el.className||'').toString().toLowerCase();const i=(el.id||'').toLowerCase();return kw.some(k=>t.includes(k)||c.includes(k)||i.includes(k))}).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getOAuthButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[href*="oauth"],[href*="auth/google"],[href*="auth/facebook"],[href*="auth/github"],[data-provider],[class*="oauth"],[id*="oauth"]';return Array.from(document.querySelectorAll(sel)).slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getPasswordFields2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('input[type="password"]')).slice(0,10).map(el=>({id:el.id||null,name:el.name||null,autocomplete:el.getAttribute('autocomplete')||null,class_preview:(el.className||'').slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getTwoFactorInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('input'));return all.filter(el=>{const id=(el.id||'').toLowerCase();const name=(el.name||'').toLowerCase();const cls=(el.className||'').toLowerCase();return id.includes('otp')||id.includes('2fa')||id.includes('mfa')||id.includes('code')||name.includes('otp')||name.includes('code')||cls.includes('otp')||cls.includes('pin-input')}).slice(0,10).map(el=>({id:el.id||null,name:el.name||null,maxlength:el.maxLength||null,pattern_preview:(el.pattern||'').slice(0,40)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getRememberMeCheckboxes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const all=Array.from(document.querySelectorAll('input[type="checkbox"]'));return all.filter(el=>{const id=(el.id||'').toLowerCase();const name=(el.name||'').toLowerCase();const label=document.querySelector('label[for="'+el.id+'"]');const ltext=(label?label.textContent:'').toLowerCase();return id.includes('remember')||name.includes('remember')||ltext.includes('remember')}).slice(0,5).map(el=>{const label=document.querySelector('label[for="'+el.id+'"]');return{id:el.id||null,name:el.name||null,checked:el.checked,label_text:(label?label.textContent:'').trim().slice(0,60)}}) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getForgotPasswordLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('a')).filter(a=>{const t=(a.textContent||'').toLowerCase();return t.includes('forgot')||t.includes('reset password')||t.includes('lost password')}).slice(0,5).map(a=>({text_preview:(a.textContent||'').trim().slice(0,60),href_preview:a.href.slice(-80)})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

export async function getSignupLinks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('a,button,[role="button"]')).filter(el=>{const t=(el.textContent||'').toLowerCase().trim();return t.includes('sign up')||t.includes('register')||t.includes('create account')||t.includes('join')}).slice(0,10).map(el=>({text_preview:(el.textContent||'').trim().slice(0,60),href_preview:el.href?el.href.slice(-80):null})) })()`,
    returnByValue: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
