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
