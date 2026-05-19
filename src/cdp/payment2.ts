// src/cdp/payment2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getPaymentForms — forms likely used for payment (action/class patterns)
export async function getPaymentForms(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const allForms = Array.from(document.querySelectorAll('form'));
      const paymentRe = /pay|checkout|billing|credit|card|stripe|payment|purchase|order/i;
      for (const f of allForms) {
        const action = f.getAttribute('action') || '';
        const cls = f.className ? String(f.className).trim().replace(/\\s+/g, ' ') : '';
        const id = f.id || '';
        if (!paymentRe.test(action) && !paymentRe.test(cls) && !paymentRe.test(id)) continue;
        if (seen.has(f)) continue;
        seen.add(f);
        results.push({
          id: id || null,
          action_preview: action ? action.slice(0, 80) : null,
          class_preview: cls ? cls.slice(0, 80) : null,
          fieldCount: f.elements.length
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 2. getCreditCardInputs — credit card number/CVV/expiry inputs
export async function getCreditCardInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const ccRe = /card.?number|cardnum|cc.?num|credit.?card|cvv|cvc|csc|expir|exp.?date|exp.?month|exp.?year|card.?expiry/i;
      const autocompleteRe = /cc-number|cc-csc|cc-exp/i;
      const allInputs = Array.from(document.querySelectorAll('input'));
      for (const el of allInputs) {
        if (seen.has(el)) continue;
        const name = el.getAttribute('name') || '';
        const id = el.id || '';
        const placeholder = el.getAttribute('placeholder') || '';
        const autocomplete = el.getAttribute('autocomplete') || '';
        const type = el.getAttribute('type') || '';
        if (!ccRe.test(name) && !ccRe.test(id) && !ccRe.test(placeholder) && !autocompleteRe.test(autocomplete)) continue;
        seen.add(el);
        results.push({
          id: id || null,
          name: name || null,
          type: type || null,
          placeholder_preview: placeholder ? placeholder.slice(0, 80) : null,
          autocomplete: autocomplete || null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 3. getPaymentButtons — pay/checkout/buy now buttons
export async function getPaymentButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const textRe = /pay now|pay \\$|buy now|checkout|place order|submit order|complete purchase|confirm payment|submit payment/i;
      const classRe = /pay.?btn|checkout.?btn|buy.?btn|payment.?btn|stripe.?btn|paypal.?btn/i;
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], a'));
      for (const el of candidates) {
        if (seen.has(el)) continue;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : '';
        const id = el.id || '';
        if (!textRe.test(textRaw) && !classRe.test(cls) && !classRe.test(id)) continue;
        seen.add(el);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: id || null,
          text_preview: textRaw.slice(0, 80),
          class_preview: cls ? cls.slice(0, 80) : null,
          disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getPaymentState — payment UI summary
export async function getPaymentState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const payFormRe = /pay|checkout|billing|credit|card|stripe|payment|purchase|order/i;
      const hasPaymentForm = Array.from(document.querySelectorAll('form')).some(f => {
        const action = f.getAttribute('action') || '';
        const cls = f.className ? String(f.className) : '';
        const id = f.id || '';
        return payFormRe.test(action) || payFormRe.test(cls) || payFormRe.test(id);
      });
      const ccRe = /card.?number|cardnum|cc.?num|credit.?card|cvv|cvc|csc|expir|exp.?date|cc-number|cc-csc|cc-exp/i;
      const hasCreditCardInput = Array.from(document.querySelectorAll('input')).some(el => {
        return ccRe.test(el.getAttribute('name') || '') ||
               ccRe.test(el.id || '') ||
               ccRe.test(el.getAttribute('placeholder') || '') ||
               ccRe.test(el.getAttribute('autocomplete') || '');
      });
      const payBtnRe = /pay now|pay \\$|buy now|checkout|place order|submit order|complete purchase|confirm payment/i;
      const hasPaymentButton = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]')).some(el => {
        const text = el.textContent ? el.textContent.trim() : '';
        return payBtnRe.test(text);
      });
      const scriptSrc = Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src') || '').join(' ');
      const scriptContent = Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent || '').join(' ');
      const allText = scriptSrc + ' ' + scriptContent;
      const hasStripe = /stripe/i.test(allText) || !!document.querySelector('[class*="stripe"], [id*="stripe"], iframe[src*="stripe"]');
      const hasPaypal = /paypal/i.test(allText) || !!document.querySelector('[class*="paypal"], [id*="paypal"], iframe[src*="paypal"]');
      return { hasPaymentForm, hasCreditCardInput, hasPaymentButton, hasStripe, hasPaypal };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getStripeElements — Stripe-hosted iframes/elements
export async function getStripeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      // Stripe iframes
      const iframes = Array.from(document.querySelectorAll('iframe'));
      for (const el of iframes) {
        const src = el.getAttribute('src') || '';
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : '';
        const id = el.id || '';
        const name = el.getAttribute('name') || '';
        if (!/stripe/i.test(src) && !/stripe/i.test(cls) && !/stripe/i.test(id) && !/stripe/i.test(name)) continue;
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          id: id || null,
          src_preview: src ? src.slice(0, 80) : null,
          class_preview: cls ? cls.slice(0, 80) : null
        });
        if (results.length >= 10) break;
      }
      // Stripe DOM elements (non-iframe)
      const stripeEls = Array.from(document.querySelectorAll('[class*="stripe"], [id*="stripe"], [data-stripe]'));
      for (const el of stripeEls) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : '';
        const id = el.id || '';
        results.push({
          id: id || null,
          src_preview: null,
          class_preview: cls ? cls.slice(0, 80) : null
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getPaymentIframes — payment provider iframes
export async function getPaymentIframes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const paymentOrigins = /stripe\\.com|paypal\\.com|braintreegateway\\.com|squareup\\.com|adyen\\.com|checkout\\.com|worldpay\\.com|authorize\\.net|2checkout\\.com|klarna\\.com|afterpay\\.com|affirm\\.com/i;
      const iframes = Array.from(document.querySelectorAll('iframe'));
      for (const el of iframes) {
        if (seen.has(el)) continue;
        const src = el.getAttribute('src') || '';
        let origin = null;
        try {
          if (src) {
            const u = new URL(src, location.href);
            origin = u.origin;
          }
        } catch(_) {}
        if (!paymentOrigins.test(src) && !paymentOrigins.test(el.getAttribute('name') || '') && !paymentOrigins.test(el.className || '')) continue;
        seen.add(el);
        const id = el.id || '';
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : '';
        results.push({
          id: id || null,
          src_preview: src ? src.slice(0, 80) : null,
          origin: origin
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 7. getCheckoutForms — checkout/order forms
export async function getCheckoutForms(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      const checkoutRe = /checkout|order|billing|shipping|address|payment/i;
      const addressFieldNames = /address|street|city|state|zip|postal|country|province/i;
      const allForms = Array.from(document.querySelectorAll('form'));
      for (const f of allForms) {
        if (seen.has(f)) continue;
        const action = f.getAttribute('action') || '';
        const cls = f.className ? String(f.className).trim().replace(/\\s+/g, ' ') : '';
        const id = f.id || '';
        if (!checkoutRe.test(action) && !checkoutRe.test(cls) && !checkoutRe.test(id)) continue;
        seen.add(f);
        const inputs = Array.from(f.querySelectorAll('input, select, textarea'));
        const hasAddressFields = inputs.some(el => {
          return addressFieldNames.test(el.getAttribute('name') || '') ||
                 addressFieldNames.test(el.getAttribute('placeholder') || '') ||
                 addressFieldNames.test(el.getAttribute('autocomplete') || '');
        });
        results.push({
          id: id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          inputCount: inputs.length,
          hasAddressFields: hasAddressFields
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 8. getPaymentApiUsage — detected payment library patterns
export async function getPaymentApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src') || '').join(' ');
      const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent || '').join(' ');
      const allScriptText = scriptSrcs + ' ' + inlineScripts;
      const windowKeys = typeof window !== 'undefined' ? Object.keys(window) : [];
      const windowStr = windowKeys.join(' ');
      const hasStripe = /js\\.stripe\\.com|stripe\\.js|Stripe\\(/i.test(allScriptText) || windowKeys.includes('Stripe');
      const hasPaypal = /paypal\\.com\\/sdk|paypal\\.js|paypal\\.Buttons/i.test(allScriptText) || windowKeys.includes('paypal') || windowKeys.includes('PAYPAL');
      const hasSquare = /squareup\\.com|square\\.js|Square\\./i.test(allScriptText) || windowKeys.includes('Square');
      const hasAdyen = /adyen\\.com|adyen\\.js|AdyenCheckout/i.test(allScriptText) || windowKeys.includes('AdyenCheckout');
      const hasBraintree = /braintree\\.js|braintreegateway|braintree\\.client/i.test(allScriptText) || windowKeys.includes('braintree');
      return { hasStripe, hasPaypal, hasSquare, hasAdyen, hasBraintree };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
