// src/cdp/ecommerce2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getAddToCartButtons — Add-to-cart / Buy buttons
export async function getAddToCartButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      // Selector-based matches
      const bySel = Array.from(document.querySelectorAll(
        '[class*="add-to-cart"], [class*="addtocart"], [class*="buy-now"], [id*="add-to-cart"], button[class*="cart"]'
      ));
      for (const el of bySel) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: textRaw.slice(0, 80),
          disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        });
        if (results.length >= 20) return results;
      }
      // Text-based matches on buttons/anchors
      const textTargets = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const textRe = /add to cart|buy now|add to bag/i;
      for (const el of textTargets) {
        if (seen.has(el)) continue;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        if (!textRe.test(textRaw)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: textRaw.slice(0, 80),
          disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 2. getProductImages — Product images (main/gallery)
export async function getProductImages(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="product"] img, [class*="gallery"] img, img[itemprop="image"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || null;
        const alt = el.getAttribute('alt') || null;
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          src_preview: src ? src.slice(0, 80) : null,
          alt_preview: alt ? alt.slice(0, 80) : null,
          class_preview: cls ? cls.slice(0, 80) : null,
          width: el.getAttribute('width') ? parseInt(el.getAttribute('width'), 10) : (el.naturalWidth || null),
          height: el.getAttribute('height') ? parseInt(el.getAttribute('height'), 10) : (el.naturalHeight || null)
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 3. getCartIndicator — Cart icon/count badge
export async function getCartIndicator(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="cart-count"], [class*="cart-badge"], [aria-label*="cart"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const ariaLabel = el.getAttribute('aria-label') || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: textRaw.slice(0, 80),
          ariaLabel_preview: ariaLabel ? ariaLabel.slice(0, 80) : null
        });
        if (results.length >= 5) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getWishlistButtons — Wishlist/favorite buttons
export async function getWishlistButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="wishlist"], [class*="favorite"], [aria-label*="wishlist"], [aria-label*="save"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const ariaLabel = el.getAttribute('aria-label') || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          ariaLabel_preview: ariaLabel ? ariaLabel.slice(0, 80) : null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getQuantityInputs — Quantity selectors
export async function getQuantityInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = 'input[name*="qty"], input[name*="quantity"], input[class*="qty"], input[class*="quantity"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          name: el.getAttribute('name') || null,
          value: el.value || null,
          min: el.getAttribute('min') || null,
          max: el.getAttribute('max') || null,
          type: el.getAttribute('type') || null
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getProductVariants — Color/size selectors
export async function getProductVariants(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = 'select[class*="variant"], select[class*="color"], select[class*="size"], select[name*="variant"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const opts = Array.from(el.options || []);
        const selectedOpt = opts.find(o => o.selected);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          optionCount: opts.length,
          selectedValue: selectedOpt ? (selectedOpt.value || selectedOpt.text || null) : null
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 7. getShippingInfo — Shipping/delivery text blocks
export async function getShippingInfo(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="shipping"], [class*="delivery"], [class*="dispatch"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: textRaw.slice(0, 80)
        });
        if (results.length >= 10) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 8. getPromoElements — Promo/discount/coupon elements
export async function getPromoElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="promo"], [class*="discount"], [class*="coupon"], [class*="sale"], [class*="offer"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: textRaw.slice(0, 80)
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// ── E-commerce UI Detection (batch 2) ─────────────────────────────────────────

// 9. getProductCards — product listing card elements
export async function getProductCards(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="product-card"]', '[class*="productCard"]', '[class*="product-item"]',
        '[class*="productItem"]', '[class*="product-tile"]', '[class*="productTile"]',
        '[data-component-type="s-search-result"]', 'li[class*="product"]', 'article[class*="product"]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const titleEl = el.querySelector('h2, h3, h4, [class*="title"], [class*="name"]');
        const priceEl = el.querySelector('[class*="price"]');
        const imgEl = el.querySelector('img');
        const linkEl = el.querySelector('a');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          title_text: titleEl ? titleEl.textContent.trim().slice(0, 80) : null,
          price_text: priceEl ? priceEl.textContent.trim().slice(0, 40) : null,
          img_src: imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || null) : null,
          link_href: linkEl ? (linkEl.getAttribute('href') || null) : null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 10. getAddToCartButtons3 — add to cart / buy now buttons (variant 3)
// (getAddToCartButtons exists in ecommerce2.ts; getAddToCartButtons2 exists in pricing2.ts)
export async function getAddToCartButtons3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const seen = new Set();
      const results = [];
      const textRe = /add to (cart|bag|basket)|buy now|purchase|order now|shop now/i;
      const selRe = /add.?to.?cart|addtocart|buy.?now|add.?to.?bag|add.?to.?basket/i;
      const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"], input[type="button"]'));
      for (const el of candidates) {
        if (seen.has(el)) continue;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const cls = el.className ? String(el.className) : '';
        const id = el.id || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const dataAction = el.getAttribute('data-action') || '';
        if (!textRe.test(text) && !selRe.test(cls) && !selRe.test(id) && !selRe.test(ariaLabel) && !selRe.test(dataAction)) continue;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        results.push({
          tag: el.tagName.toLowerCase(),
          id: id || null,
          class_preview: cls.trim().slice(0, 80),
          text_preview: text.slice(0, 80),
          aria_label: ariaLabel.slice(0, 80) || null,
          data_action: dataAction.slice(0, 80) || null,
          disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
          visible: rect.width > 0 && rect.height > 0
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 11. getPriceElements2 — price display elements (variant 2; getPriceElements exists in pricing2.ts)
export async function getPriceElements2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="price"]', '[class*="Price"]', '[itemprop="price"]',
        '[data-price]', '[class*="amount"]', '[class*="cost"]',
        'span[class*="currency"]', 'span[class*="money"]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      const priceRe = /[\\$\\€\\£\\¥\\₦]|\\d+[.,]\\d{2}/;
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        if (!text || text.length > 40) continue;
        if (!priceRe.test(text)) continue;
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text: text,
          data_price: el.getAttribute('data-price') || null,
          itemprop: el.getAttribute('itemprop') || null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 12. getProductImages2 — product image elements (variant 2; getProductImages exists in ecommerce2.ts)
export async function getProductImages2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="product"] img', '[class*="gallery"] img', 'img[itemprop="image"]',
        '[class*="pdp"] img', '[class*="product-detail"] img', 'figure img',
        'img[data-zoom-image]', 'img[data-large-image]', '[class*="carousel"] img'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-lazy') || el.getAttribute('data-original') || null;
        const srcset = el.getAttribute('srcset') || null;
        const alt = el.getAttribute('alt') || null;
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const rect = el.getBoundingClientRect();
        results.push({
          src_preview: src ? src.slice(0, 120) : null,
          srcset_preview: srcset ? srcset.slice(0, 80) : null,
          alt_preview: alt ? alt.slice(0, 80) : null,
          class_preview: cls ? cls.slice(0, 80) : null,
          natural_width: el.naturalWidth || null,
          natural_height: el.naturalHeight || null,
          rendered_width: Math.round(rect.width) || null,
          rendered_height: Math.round(rect.height) || null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 13. getCartState — shopping cart summary
export async function getCartState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Detect cart presence
      const cartSelectors = [
        '[class*="cart"]', '[id*="cart"]', '[aria-label*="cart"]',
        '[class*="basket"]', '[id*="basket"]', '[aria-label*="basket"]',
        '[class*="bag"]', '[id*="bag"]'
      ];
      const cartEls = Array.from(document.querySelectorAll(cartSelectors.join(', ')));
      const hasCart = cartEls.length > 0;

      // Item count — look for numeric badge near cart
      let itemCount = null;
      const countSel = '[class*="cart-count"], [class*="cart-badge"], [class*="cart-qty"], [class*="item-count"], [class*="itemCount"]';
      const countEl = document.querySelector(countSel);
      if (countEl) {
        const n = parseInt(countEl.textContent.trim(), 10);
        if (!isNaN(n)) itemCount = n;
      }

      // Cart total
      let cartTotal = null;
      const totalSel = '[class*="cart-total"], [class*="cartTotal"], [class*="order-total"], [class*="subtotal"]';
      const totalEl = document.querySelector(totalSel);
      if (totalEl) {
        cartTotal = totalEl.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40);
      }

      // Checkout button
      const checkoutSel = 'a[href*="checkout"], button[class*="checkout"], [class*="checkout-btn"], [class*="checkoutBtn"]';
      const hasCheckout = !!document.querySelector(checkoutSel);

      return { hasCart, itemCount, cartTotal, hasCheckout };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 14. getWishlistButtons2 — save/wishlist/favorite buttons (variant 2; getWishlistButtons exists in ecommerce2.ts)
export async function getWishlistButtons2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const seen = new Set();
      const results = [];
      const textRe = /save|wishlist|favourite|favorite|add to list|save for later/i;
      const selRe = /wishlist|favourite|favorite|saved?-item|heart/i;
      const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], svg'));
      for (const el of candidates) {
        if (seen.has(el)) continue;
        const cls = el.className ? String(el.className) : '';
        const id = el.id || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        if (!selRe.test(cls) && !selRe.test(id) && !textRe.test(ariaLabel) && !textRe.test(title) && !textRe.test(text)) continue;
        seen.add(el);
        const isActive = el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true' || /active|selected|saved/i.test(cls);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: id || null,
          class_preview: cls.trim().slice(0, 80),
          aria_label: ariaLabel.slice(0, 80) || null,
          title: title.slice(0, 80) || null,
          text_preview: text.slice(0, 60) || null,
          is_active: isActive
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 15. getProductRatings — product star rating displays
export async function getProductRatings(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="rating"]', '[class*="stars"]', '[class*="star-rating"]',
        '[class*="starRating"]', '[itemprop="ratingValue"]', '[itemprop="aggregateRating"]',
        '[aria-label*="star"]', '[aria-label*="rating"]', '[class*="review-score"]',
        '[class*="reviewScore"]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const text = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const ariaLabel = el.getAttribute('aria-label') || null;
        const itemprop = el.getAttribute('itemprop') || null;
        const content = el.getAttribute('content') || null;
        // Parse numeric rating from aria-label or text
        const ratingMatch = (ariaLabel || text || '').match(/([0-9]+\\.?[0-9]*)\\s*(out of|\\/)\\s*([0-9]+)/);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          text_preview: text.slice(0, 60),
          aria_label: ariaLabel ? ariaLabel.slice(0, 80) : null,
          itemprop: itemprop,
          content_value: content,
          parsed_rating: ratingMatch ? { value: parseFloat(ratingMatch[1]), max: parseFloat(ratingMatch[3]) } : null
        });
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 16. getEcommerceApiUsage — detected e-commerce platforms
export async function getEcommerceApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Shopify
      const hasShopify = !!(
        window.Shopify ||
        document.querySelector('script[src*="shopify"]') ||
        document.querySelector('link[href*="shopify"]') ||
        document.querySelector('meta[name="shopify-checkout-api-token"]') ||
        document.querySelector('[data-shopify]')
      );

      // WooCommerce
      const hasWooCommerce = !!(
        window.wc_add_to_cart_params ||
        window.woocommerce_params ||
        document.querySelector('.woocommerce') ||
        document.querySelector('script[src*="woocommerce"]') ||
        document.querySelector('body.woocommerce')
      );

      // Magento
      const hasMagento = !!(
        window.Magento ||
        document.querySelector('script[src*="magento"]') ||
        document.querySelector('meta[name="generator"][content*="Magento"]') ||
        document.querySelector('[data-mage-init]')
      );

      // BigCommerce
      const hasBigCommerce = !!(
        window.BCData ||
        window.bigcommerce ||
        document.querySelector('script[src*="bigcommerce"]') ||
        document.querySelector('meta[name="generator"][content*="BigCommerce"]') ||
        document.querySelector('[data-cart-item-add]')
      );

      // Stripe
      const hasStripe = !!(
        window.Stripe ||
        document.querySelector('script[src*="stripe"]') ||
        document.querySelector('iframe[src*="stripe"]') ||
        document.querySelector('[data-stripe]')
      );

      // Additional signals
      const hasShopifyCart = !!(document.querySelector('[action*="/cart/add"]') || document.querySelector('[action*="/cart"]'));
      const hasPayPal = !!(window.paypal || document.querySelector('script[src*="paypal"]'));
      const hasSezzle = !!(window.Sezzle || document.querySelector('script[src*="sezzle"]'));
      const hasAfterpay = !!(window.afterpay || document.querySelector('script[src*="afterpay"]'));

      const detectedPlatforms = [];
      if (hasShopify) detectedPlatforms.push('Shopify');
      if (hasWooCommerce) detectedPlatforms.push('WooCommerce');
      if (hasMagento) detectedPlatforms.push('Magento');
      if (hasBigCommerce) detectedPlatforms.push('BigCommerce');

      const detectedPayment = [];
      if (hasStripe) detectedPayment.push('Stripe');
      if (hasPayPal) detectedPayment.push('PayPal');
      if (hasSezzle) detectedPayment.push('Sezzle');
      if (hasAfterpay) detectedPayment.push('Afterpay');

      return {
        hasShopify,
        hasWooCommerce,
        hasMagento,
        hasBigCommerce,
        hasStripe,
        hasShopifyCart,
        hasPayPal,
        hasSezzle,
        hasAfterpay,
        detectedPlatforms,
        detectedPayment
      };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
