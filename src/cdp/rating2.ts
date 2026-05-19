// src/cdp/rating2.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getStarRatings — Elements with star rating patterns (class/aria containing "star", "rating")
export async function getStarRatings(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="star"], [class*="rating"], [aria-label*="star"], [role="slider"][aria-valuemax="5"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const ariaLabel = el.getAttribute('aria-label') || null;
        const value = el.getAttribute('aria-valuenow') || el.getAttribute('value') || el.getAttribute('data-rating') || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          ariaLabel_preview: ariaLabel ? ariaLabel.slice(0, 80) : null,
          value
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

// 2. getReviewBlocks — Elements with review-related classes or schemas
export async function getReviewBlocks(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="review"], [class*="testimonial"], [itemtype*="Review"]';
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

// 3. getProductPrices — Elements with price-like text patterns
export async function getProductPrices(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      // First pass: elements with price-related selectors
      const bySelector = Array.from(document.querySelectorAll('[class*="price"], [class*="cost"], [itemprop="price"]'));
      for (const el of bySelector) {
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
      // Second pass: any element whose text matches a dollar pattern (skip already found)
      if (results.length < 20) {
        const priceRe = /\\$[\\d,]+/;
        const allEls = Array.from(document.querySelectorAll('*'));
        for (const el of allEls) {
          if (seen.has(el)) continue;
          // Only leaf-ish nodes (no more than 2 child elements) to avoid wrapper noise
          if (el.children.length > 2) continue;
          const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
          if (!priceRe.test(textRaw)) continue;
          seen.add(el);
          const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls ? cls.slice(0, 80) : null,
            text_preview: textRaw.slice(0, 80)
          });
          if (results.length >= 20) break;
        }
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getLikeButtons — Like/upvote/heart buttons
export async function getLikeButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="like"], [class*="upvote"], [class*="heart"], [aria-label*="like"], [aria-label*="heart"]';
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
        if (results.length >= 20) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getShareButtons — Share/social share buttons
export async function getShareButtons(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="share"], [aria-label*="share"]';
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

// 6. getCommentSections — Comment/discussion sections with child comment counts
export async function getCommentSections(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="comment"], [class*="discussion"], [id*="comment"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        // Count child elements that themselves match a comment-like class
        const commentChildren = el.querySelectorAll('[class*="comment"]');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          commentCount: commentChildren.length
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

// 7. getUserAvatars — User avatar images
export async function getUserAvatars(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = 'img[class*="avatar"], img[class*="profile"], img[alt*="avatar"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const src = el.getAttribute('src') || el.getAttribute('data-src') || null;
        const alt = el.getAttribute('alt') || null;
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          src_preview: src ? src.slice(0, 80) : null,
          alt_preview: alt ? alt.slice(0, 80) : null,
          class_preview: cls ? cls.slice(0, 80) : null
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

// 8. getBadgeElements — Badge/tag/chip elements (excludes <label> tags)
export async function getBadgeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="badge"], [class*="tag"], [class*="chip"], [class*="label"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        // Exclude <label> elements
        if (el.tagName.toLowerCase() === 'label') continue;
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
