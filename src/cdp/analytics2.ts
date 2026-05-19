// analytics2.ts — Analytics and tracking detection

export async function getAnalyticsScripts(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const analyticsPatterns = [
        'google-analytics', 'googletagmanager', 'gtag', 'gtm.js',
        'analytics.js', 'ga.js', 'fbevents', 'facebook.net', 'connect.facebook',
        'tiktok', 'hotjar', 'mixpanel', 'amplitude', 'segment',
        'clarity', 'heap', 'fullstory', 'logrocket', 'datadog'
      ];
      const results = [];
      for (const s of scripts) {
        const src = s.getAttribute('src') || '';
        const lsrc = src.toLowerCase();
        const matched = analyticsPatterns.find(p => lsrc.includes(p));
        if (matched) {
          results.push({
            src: src,
            async: s.hasAttribute('async'),
            defer: s.hasAttribute('defer'),
            id: s.id || null,
            type: matched
          });
        }
        if (results.length >= 20) break;
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTrackingPixels(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const results = [];
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width') || '0');
        const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height') || '0');
        const src = img.src || '';
        if ((w <= 2 && h <= 2) || src.includes('pixel') || src.includes('beacon') || src.includes('track')) {
          results.push({ src, width: w, height: h, alt: img.alt || null });
          if (results.length >= 20) break;
        }
      }
      const noscripts = Array.from(document.querySelectorAll('noscript'));
      for (const ns of noscripts) {
        const inner = ns.innerHTML || '';
        if (inner.includes('facebook.com/tr') || inner.includes('google') || inner.includes('tiktok')) {
          results.push({ type: 'noscript-pixel', snippet: inner.slice(0, 200) });
          if (results.length >= 20) break;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getAnalyticsState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const hasGa = typeof window.ga === 'function' || typeof window.gtag === 'function' ||
        !!document.querySelector('script[src*="google-analytics"], script[src*="analytics.js"], script[src*="gtag"]');
      const hasGtm = typeof window.google_tag_manager !== 'undefined' ||
        !!document.querySelector('script[src*="googletagmanager"]');
      const hasFbPixel = typeof window.fbq === 'function' ||
        !!document.querySelector('script[src*="fbevents"], script[src*="connect.facebook"]');
      const hasTikTokPixel = typeof window.ttq !== 'undefined' ||
        !!document.querySelector('script[src*="tiktok"]');
      const hasHotjar = typeof window.hj === 'function' ||
        !!document.querySelector('script[src*="hotjar"]');
      return { hasGa, hasGtm, hasFbPixel, hasTikTokPixel, hasHotjar };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getConversionEvents(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const results = [];
      const tracked = document.querySelectorAll('[data-track], [data-event], [data-analytics], [data-ga], [data-gtm]');
      for (const el of tracked) {
        const entry = {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class: el.className ? String(el.className).slice(0, 80) : null,
          dataTrack: el.getAttribute('data-track'),
          dataEvent: el.getAttribute('data-event'),
          dataAnalytics: el.getAttribute('data-analytics'),
          dataGa: el.getAttribute('data-ga'),
          dataGtm: el.getAttribute('data-gtm'),
          text: el.innerText ? el.innerText.slice(0, 60) : null
        };
        results.push(entry);
        if (results.length >= 20) break;
      }
      const onclickEls = document.querySelectorAll('[onclick]');
      for (const el of onclickEls) {
        const oc = el.getAttribute('onclick') || '';
        if (oc.includes('gtag') || oc.includes('fbq') || oc.includes('ga(') || oc.includes('ttq')) {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            onclick: oc.slice(0, 200),
            text: el.innerText ? el.innerText.slice(0, 60) : null
          });
          if (results.length >= 20) break;
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getDataLayer(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      if (!Array.isArray(window.dataLayer)) {
        return { exists: false, length: 0, items: [] };
      }
      const items = window.dataLayer.slice(0, 20).map(function(item) {
        try {
          return JSON.parse(JSON.stringify(item));
        } catch(e) {
          return String(item).slice(0, 200);
        }
      });
      return { exists: true, length: window.dataLayer.length, items };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getTagManagerElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const results = [];
      const scripts = Array.from(document.querySelectorAll('script'));
      const patterns = [
        { name: 'GTM', pattern: 'googletagmanager' },
        { name: 'GTM-noscript', pattern: 'GTM-' },
        { name: 'Segment', pattern: 'segment.com/analytics' },
        { name: 'Tealium', pattern: 'tags.tiqcdn' },
        { name: 'Adobe Launch', pattern: 'assets.adobedtm' }
      ];
      for (const s of scripts) {
        const src = s.getAttribute('src') || '';
        const inner = s.innerHTML || '';
        for (const { name, pattern } of patterns) {
          if (src.includes(pattern) || inner.includes(pattern)) {
            results.push({
              name,
              src: src || null,
              containerId: (inner.match(/GTM-[A-Z0-9]+/) || src.match(/GTM-[A-Z0-9]+/) || [null])[0],
              snippet: inner.slice(0, 150) || null,
              async: s.hasAttribute('async')
            });
            break;
          }
        }
        if (results.length >= 20) break;
      }
      const iframes = Array.from(document.querySelectorAll('iframe[src*="googletagmanager"], iframe[src*="GTM-"]'));
      for (const f of iframes) {
        results.push({ name: 'GTM-noscript-iframe', src: f.getAttribute('src') });
        if (results.length >= 20) break;
      }
      const gtmState = typeof window.google_tag_manager !== 'undefined'
        ? Object.keys(window.google_tag_manager)
        : null;
      return { containers: results, loadedContainers: gtmState };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getAnalyticsConsent(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const bannerSelectors = [
        '[id*="cookie"]', '[id*="consent"]', '[id*="gdpr"]', '[id*="privacy"]',
        '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]', '[class*="privacy-banner"]',
        '[aria-label*="cookie"]', '[aria-label*="consent"]',
        'div[role="dialog"]', '#onetrust-banner-sdk', '.cc-banner', '#cookiebanner',
        '#CybotCookiebotDialog', '.CookieConsent', '#cookie-notice'
      ];
      let bannerFound = null;
      for (const sel of bannerSelectors) {
        try {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) {
            bannerFound = {
              selector: sel,
              visible: true,
              text: el.innerText ? el.innerText.slice(0, 200) : null
            };
            break;
          }
        } catch(e) {}
      }
      const cookieKeys = document.cookie.split(';').map(function(c) {
        return c.trim().split('=')[0];
      }).filter(function(k) {
        return k && (k.toLowerCase().includes('consent') || k.toLowerCase().includes('cookie') || k.toLowerCase().includes('gdpr'));
      });
      const localKeys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || '';
          if (k.toLowerCase().includes('consent') || k.toLowerCase().includes('cookie') || k.toLowerCase().includes('gdpr')) {
            localKeys.push(k);
          }
        }
      } catch(e) {}
      const consentApi = typeof window.__tcfapi === 'function' ? 'TCF (GDPR)' :
        typeof window.__cmp === 'function' ? 'CMP' :
        typeof window.OneTrust !== 'undefined' ? 'OneTrust' :
        typeof window.Cookiebot !== 'undefined' ? 'Cookiebot' : null;
      return { bannerFound, cookieConsentKeys: cookieKeys, localStorageConsentKeys: localKeys, consentApi };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

export async function getAnalyticsApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const hasGoogleAnalytics = typeof window.ga === 'function' || typeof window.gtag === 'function' ||
        !!document.querySelector('script[src*="google-analytics"], script[src*="analytics.js"]');
      const hasGtm = typeof window.google_tag_manager !== 'undefined' ||
        !!document.querySelector('script[src*="googletagmanager"]');
      const hasFacebookPixel = typeof window.fbq === 'function' ||
        !!document.querySelector('script[src*="fbevents"], script[src*="connect.facebook"]');
      const hasTikTokPixel = typeof window.ttq !== 'undefined' ||
        !!document.querySelector('script[src*="tiktok"]');
      const hasHotjar = typeof window.hj === 'function' ||
        !!document.querySelector('script[src*="hotjar"]');
      const hasMixpanel = typeof window.mixpanel !== 'undefined' ||
        !!document.querySelector('script[src*="mixpanel"]');
      const hasAmplitude = typeof window.amplitude !== 'undefined' ||
        !!document.querySelector('script[src*="amplitude"]');
      const extras = {
        hasSegment: typeof window.analytics !== 'undefined' && typeof window.analytics.track === 'function',
        hasHeap: typeof window.heap !== 'undefined',
        hasClarity: typeof window.clarity === 'function',
        hasFullstory: typeof window.FS !== 'undefined',
        hasDatadogRum: typeof window.DD_RUM !== 'undefined',
        hasIntercom: typeof window.Intercom === 'function',
        gtagIds: (function() {
          const ids = [];
          if (typeof window.gtag === 'function') {
            const scripts = document.querySelectorAll('script[src*="gtag"]');
            scripts.forEach(function(s) {
              const m = (s.getAttribute('src') || '').match(/id=([^&]+)/);
              if (m) ids.push(m[1]);
            });
          }
          return ids;
        })()
      };
      return { hasGoogleAnalytics, hasGtm, hasFacebookPixel, hasTikTokPixel, hasHotjar, hasMixpanel, hasAmplitude, ...extras };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
