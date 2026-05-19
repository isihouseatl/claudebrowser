import type CRI from 'chrome-remote-interface';

export async function getPriceElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="price"]', '[class*="Price"]', '[id*="price"]', '[id*="Price"]',
      '[class*="cost"]', '[class*="amount"]', '[class*="Amount"]',
      '[data-price]', '[itemprop="price"]', '[itemprop="priceCurrency"]',
      '.price', '.Price', '#price', '.product-price', '.item-price',
      '[class*="sale-price"]', '[class*="regular-price"]', '[class*="current-price"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 20) break;
      let els;
      try { els = document.querySelectorAll(sel); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 20) break;
        if (seen.has(el)) continue;
        seen.add(el);
        const text = (el.textContent || '').trim().slice(0, 60);
        if (!text) continue;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          text_preview: text
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getAddToCartButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="add-to-cart"]', '[class*="addToCart"]', '[class*="add_to_cart"]',
      '[id*="add-to-cart"]', '[id*="addToCart"]',
      '[data-action*="cart"]', '[aria-label*="Add to cart"]',
      'button[class*="cart"]', 'button[class*="Cart"]',
      'input[value*="Add to Cart"]', 'input[value*="Add to Bag"]',
      'button[name="add"]', '[class*="btn-cart"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 20) break;
      let els;
      try { els = document.querySelectorAll(sel); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 20) break;
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          text_preview: (el.textContent || el.getAttribute('value') || '').trim().slice(0, 60),
          disabled: el.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true'
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCartCount(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="cart-count"]', '[class*="cartCount"]', '[class*="cart-badge"]',
      '[class*="cart-qty"]', '[class*="cart-quantity"]', '[class*="cartQty"]',
      '[aria-label*="cart"]', '[data-cart-count]', '[data-count]',
      '.cart-count', '.cart-badge', '.badge', '#cart-count', '#cartCount',
      '[class*="minicart"] [class*="count"]', '[class*="mini-cart"] [class*="badge"]'
    ];
    for (const sel of selectors) {
      let el;
      try { el = document.querySelector(sel); } catch(e) { continue; }
      if (!el) continue;
      const text = (el.textContent || '').trim();
      if (!text) continue;
      const countMatch = text.match(/\d+/);
      return {
        count: countMatch ? parseInt(countMatch[0], 10) : null,
        text_preview: text.slice(0, 40),
        element_preview: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')
      };
    }
    return { count: null, text_preview: null, element_preview: null };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCheckoutButton(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="checkout"]', '[id*="checkout"]', '[href*="checkout"]',
      'button[class*="buy"]', 'button[class*="Buy"]', '[class*="buy-now"]',
      '[class*="buyNow"]', '[aria-label*="checkout"]', '[aria-label*="Checkout"]',
      '[data-action*="checkout"]', 'input[value*="Checkout"]', 'input[value*="Buy Now"]',
      'a[href*="checkout"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 10) break;
      let els;
      try { els = document.querySelectorAll(sel); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 10) break;
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          text_preview: (el.textContent || el.getAttribute('value') || '').trim().slice(0, 60),
          disabled: el.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true'
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getProductPrices2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const containers = document.querySelectorAll(
      '[class*="product"], [class*="Product"], [itemtype*="Product"], [class*="item-price"], [class*="price-box"], [class*="priceBox"]'
    );
    const results = [];
    const seen = new Set();
    const priceRe = /[\$\£\€\¥\₦\₵\₹\₩]?\s*\d[\d,\.]+/;

    const scanEl = (el) => {
      if (results.length >= 20) return;
      if (seen.has(el)) return;
      seen.add(el);
      const allText = el.querySelectorAll('[class*="price"], [class*="Price"], [class*="amount"], [class*="Amount"]');
      let original_preview = null;
      let sale_preview = null;
      let currency = null;
      let isOnSale = false;
      for (const t of allText) {
        const txt = (t.textContent || '').trim().slice(0, 40);
        const cls = (t.className && typeof t.className === 'string') ? t.className.toLowerCase() : '';
        if (!txt) continue;
        if (cls.includes('original') || cls.includes('was') || cls.includes('compare') || cls.includes('regular') || cls.includes('old')) {
          original_preview = txt;
          isOnSale = true;
        } else if (cls.includes('sale') || cls.includes('current') || cls.includes('final') || cls.includes('special')) {
          sale_preview = txt;
          isOnSale = true;
        } else if (!original_preview) {
          original_preview = txt;
        }
        const sym = txt.match(/[\$\£\€\¥\₦\₵\₹\₩]/);
        if (sym && !currency) currency = sym[0];
      }
      if (original_preview || sale_preview) {
        results.push({ original_preview, sale_preview, currency, isOnSale });
      }
    };

    for (const c of containers) scanEl(c);

    if (results.length === 0) {
      const priceEls = document.querySelectorAll('[class*="price"], [class*="Price"], [itemprop="price"]');
      for (const el of priceEls) {
        if (results.length >= 20) break;
        if (seen.has(el)) continue;
        seen.add(el);
        const txt = (el.textContent || '').trim().slice(0, 40);
        if (!txt || !priceRe.test(txt)) continue;
        const sym = txt.match(/[\$\£\€\¥\₦\₵\₹\₩]/);
        results.push({ original_preview: txt, sale_preview: null, currency: sym ? sym[0] : null, isOnSale: false });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getDiscountElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="discount"]', '[class*="Discount"]', '[class*="sale-badge"]',
      '[class*="saleBadge"]', '[class*="sale-tag"]', '[class*="percent-off"]',
      '[class*="percentOff"]', '[class*="savings"]', '[class*="Savings"]',
      '[class*="promo-badge"]', '[class*="promoBadge"]', '[class*="off-badge"]',
      '[class*="deal"]', '[class*="Deal"]', '[class*="clearance"]',
      '.badge[class*="sale"]', '.tag[class*="sale"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 20) break;
      let els;
      try { els = document.querySelectorAll(sel); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 20) break;
        if (seen.has(el)) continue;
        seen.add(el);
        const text = (el.textContent || '').trim().slice(0, 60);
        if (!text) continue;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          text_preview: text
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getCurrencySymbols2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const symbolRe = /[\$\£\€\¥\₦\₵\₹\₩\₨\฿\₫\₴\₺\₼\₾\﷼\₽]/g;
    const codeRe = /\b(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|NGN|GHS|KES|ZAR)\b/g;
    const walker = document.createTreeWalker(document.body, 4, null);
    const freq = {};
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.textContent || '';
      for (const m of txt.matchAll(symbolRe)) {
        freq[m[0]] = (freq[m[0]] || 0) + 1;
      }
      for (const m of txt.matchAll(codeRe)) {
        freq[m[0]] = (freq[m[0]] || 0) + 1;
      }
    }
    const symbols = Object.keys(freq);
    const mostCommon = symbols.length ? symbols.reduce((a, b) => freq[a] >= freq[b] ? a : b) : null;
    return { symbols, mostCommon, count: symbols.length };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getPromoCodeInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[id*="promo"]', '[id*="coupon"]', '[id*="discount-code"]', '[id*="voucher"]',
      '[name*="promo"]', '[name*="coupon"]', '[name*="discount"]', '[name*="voucher"]',
      '[placeholder*="promo"]', '[placeholder*="coupon"]', '[placeholder*="discount"]',
      '[placeholder*="Promo"]', '[placeholder*="Coupon"]', '[placeholder*="Discount"]',
      '[class*="promo-input"]', '[class*="coupon-input"]', '[class*="discount-input"]',
      'input[aria-label*="promo"]', 'input[aria-label*="coupon"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      if (results.length >= 10) break;
      let els;
      try { els = document.querySelectorAll(sel); } catch(e) { continue; }
      for (const el of els) {
        if (results.length >= 10) break;
        if (seen.has(el)) continue;
        if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') continue;
        seen.add(el);
        results.push({
          id: el.id || null,
          placeholder_preview: (el.placeholder || '').slice(0, 60),
          value_preview: (el.value || '').slice(0, 40)
        });
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
