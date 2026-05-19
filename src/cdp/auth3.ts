export async function getLoginForms2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const loginKeywords = /login|sign.?in|log.?in|auth|signin/i;
      const matched = forms.filter(f => {
        const id = f.id || '';
        const cls = f.className || '';
        const action = f.action || '';
        const inputs = Array.from(f.querySelectorAll('input'));
        const hasPassword = inputs.some(i => i.type === 'password');
        const hasUsername = inputs.some(i => /user|email|phone|login/i.test(i.name + i.id + i.placeholder));
        return loginKeywords.test(id + cls + action) || (hasPassword && hasUsername);
      });
      return matched.slice(0, 10).map(f => ({
        id: f.id || null,
        class_preview: (f.className || '').slice(0, 80),
        action_preview: (f.action || '').slice(0, 100),
        hasUsernameField: Array.from(f.querySelectorAll('input')).some(i => /user|email|phone|login/i.test(i.name + i.id + i.placeholder)),
        hasPasswordField: Array.from(f.querySelectorAll('input')).some(i => i.type === 'password')
      }));
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getPasswordInputs3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
      return inputs.slice(0, 20).map(i => {
        const el = i;
        const toggle = !!(el.parentElement && el.parentElement.querySelector('[aria-label*="show" i],[aria-label*="hide" i],[data-testid*="toggle" i],button'));
        return {
          id: el.id || null,
          name: el.name || null,
          placeholder_preview: (el.placeholder || '').slice(0, 60),
          autocomplete: el.autocomplete || null,
          hasToggle: toggle
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getOAuthButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const providerMap = { google: 'Google', github: 'GitHub', facebook: 'Facebook', twitter: 'Twitter', apple: 'Apple', microsoft: 'Microsoft', linkedin: 'LinkedIn', slack: 'Slack', discord: 'Discord', gitlab: 'GitLab' };
      const oauthKeywords = /google|github|facebook|twitter|apple|microsoft|linkedin|slack|discord|gitlab|oauth|social.?login|sign.?in.?with/i;
      const candidates = Array.from(document.querySelectorAll('a,button,[role="button"]'));
      const matched = candidates.filter(el => {
        const text = (el.textContent || '').trim();
        const id = el.id || '';
        const cls = el.className || '';
        const href = el.href || '';
        return oauthKeywords.test(text + id + cls + href);
      });
      return matched.slice(0, 20).map(el => {
        const text = (el.textContent || '').trim();
        const combined = (text + (el.id || '') + (el.className || '') + (el.href || '')).toLowerCase();
        let provider = 'unknown';
        for (const [key, val] of Object.entries(providerMap)) {
          if (combined.includes(key)) { provider = val; break; }
        }
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text_preview: text.slice(0, 80),
          provider
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getSsoElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const ssoKeywords = /\\bsso\\b|single.?sign.?on|enterprise|saml|ldap|active.?directory|okta|onelogin|ping.?identity|work.?account|corporate/i;
      const candidates = Array.from(document.querySelectorAll('a,button,[role="button"],input[type="submit"],div[class],span[class]'));
      const matched = candidates.filter(el => {
        const text = (el.textContent || '').trim();
        const id = el.id || '';
        const cls = el.className || '';
        const href = el.href || '';
        return ssoKeywords.test(text + id + cls + href);
      });
      return matched.slice(0, 10).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        text_preview: (el.textContent || '').trim().slice(0, 80),
        class_preview: (el.className || '').slice(0, 80)
      }));
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getAuthState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const allText = document.body ? document.body.innerText.toLowerCase() : '';
      const allHtml = document.documentElement.innerHTML.toLowerCase();
      const hasLoginForm = !!(document.querySelector('form input[type="password"]') || document.querySelector('form[action*="login" i],form[id*="login" i],form[class*="login" i]'));
      const hasPasswordField = !!document.querySelector('input[type="password"]');
      const oauthKeywords = /google|github|facebook|twitter|apple|oauth|sign.?in.?with/i;
      const hasOAuth = Array.from(document.querySelectorAll('a,button')).some(el => oauthKeywords.test((el.textContent || '') + (el.id || '') + (el.className || '')));
      const hasSso = /\\bsso\\b|single.?sign.?on|enterprise.?login|saml|okta/i.test(allHtml);
      const mfaKeywords = /mfa|otp|two.?factor|2fa|verification.?code|authenticator/i;
      const hasMfa = mfaKeywords.test(allHtml) || !!document.querySelector('input[autocomplete="one-time-code"]');
      const loggedOutKeywords = /sign.?in|log.?in|create.?account|register|forgot.?password/i;
      const loggedInKeywords = /log.?out|sign.?out|my.?account|dashboard|profile/i;
      const hasLoggedOut = loggedOutKeywords.test(allText);
      const hasLoggedIn = loggedInKeywords.test(allText);
      const isLoggedIn = hasLoggedIn && !hasLoggedOut ? true : (hasLoggedOut && !hasLoggedIn ? false : hasLoggedIn);
      return { hasLoginForm, hasPasswordField, hasOAuth, hasSso, hasMfa, isLoggedIn };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? {};
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getMfaInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const mfaSelectors = [
        'input[autocomplete="one-time-code"]',
        'input[inputmode="numeric"]',
        'input[name*="otp" i]',
        'input[name*="mfa" i]',
        'input[name*="2fa" i]',
        'input[name*="code" i]',
        'input[id*="otp" i]',
        'input[id*="mfa" i]',
        'input[id*="2fa" i]',
        'input[id*="token" i]',
        'input[placeholder*="code" i]',
        'input[placeholder*="otp" i]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of mfaSelectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          if (!seen.has(el)) {
            seen.add(el);
            const inp = el;
            results.push({
              id: inp.id || null,
              type: inp.type || 'text',
              placeholder_preview: (inp.placeholder || '').slice(0, 60),
              length: inp.maxLength > 0 ? inp.maxLength : null
            });
          }
        }
      }
      return results.slice(0, 10);
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getRememberMeCheckboxes2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const rememberKeywords = /remember.?me|stay.?logged.?in|keep.?me.?signed.?in|keep.?me.?logged.?in|remember.?this.?device/i;
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const matched = checkboxes.filter(cb => {
        const id = cb.id || '';
        const name = cb.name || '';
        const label = (() => {
          if (id) {
            const lbl = document.querySelector('label[for="' + id + '"]');
            if (lbl) return lbl.textContent || '';
          }
          const parent = cb.parentElement;
          return parent ? (parent.textContent || '') : '';
        })();
        return rememberKeywords.test(id + name + label);
      });
      return matched.slice(0, 10).map(cb => {
        const id = cb.id || '';
        let label = '';
        if (id) {
          const lbl = document.querySelector('label[for="' + id + '"]');
          if (lbl) label = (lbl.textContent || '').trim();
        }
        if (!label && cb.parentElement) {
          label = (cb.parentElement.textContent || '').trim();
        }
        return {
          id: id || null,
          checked: cb.checked,
          label_preview: label.slice(0, 80)
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getAuthApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const html = document.documentElement.innerHTML;
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '').join(' ');
      const combined = html + scripts;
      const hasJwt = /\\bjwt\\b|eyJ[A-Za-z0-9_-]{10,}/i.test(combined) || /localStorage\\.setItem.*token|sessionStorage\\.setItem.*token/i.test(combined);
      const hasOAuth = /oauth|authorization_code|access_token|refresh_token|openid.?connect|\\boidc\\b/i.test(combined);
      const hasSaml = /\\bsaml\\b|samlResponse|SAMLRequest|urn:oasis:names:tc:SAML/i.test(combined);
      const hasWebAuthn = /webauthn|navigator\\.credentials|PublicKeyCredential|\\bcredentials\\.create\\b|\\bcredentials\\.get\\b/i.test(combined);
      const hasPasskey = /passkey|\\bFIDO\\b|platform authenticator|\\blargeBlob\\b/i.test(combined);
      return { hasJwt, hasOAuth, hasSaml, hasWebAuthn, hasPasskey };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? {};
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
