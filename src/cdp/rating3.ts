// src/cdp/rating3.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getRatingElements — star/rating display elements: [{tag, id, class_preview, value_preview, maxRating}] (max 20)
export async function getRatingElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="rating"], [role="img"][aria-label*="rating"], [aria-label*="out of"], [itemprop="ratingValue"], [data-rating], [class*="stars"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const value = el.getAttribute('aria-valuenow')
          || el.getAttribute('data-rating')
          || el.getAttribute('content')
          || el.getAttribute('value')
          || (el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 20) : null);
        const maxRating = el.getAttribute('aria-valuemax')
          || el.getAttribute('data-max')
          || el.getAttribute('data-maxrating')
          || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          value_preview: value ? String(value).slice(0, 40) : null,
          maxRating: maxRating ? String(maxRating).slice(0, 10) : null
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

// 2. getStarRatings3 — star icon rating widgets: [{tag, id, class_preview, filledCount, totalCount}] (max 20)
// Suffixed 3 to avoid conflict with getStarRatings in rating2.ts
export async function getStarRatings3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Find containers that hold star icon sets
      const containers = Array.from(document.querySelectorAll('[class*="star"], [class*="rating"]'));
      const seen = new Set();
      const results = [];
      for (const el of containers) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        // Count filled vs empty star children by common patterns
        const filledEls = el.querySelectorAll('[class*="filled"], [class*="full"], [class*="active"], [class*="on"], [data-filled="true"]');
        const emptyEls = el.querySelectorAll('[class*="empty"], [class*="off"], [class*="inactive"], [data-filled="false"]');
        // Also count star SVG/icon children as fallback total
        const starIcons = el.querySelectorAll('svg, i[class*="star"], span[class*="star"]');
        const filledCount = filledEls.length;
        const totalCount = filledEls.length + emptyEls.length || starIcons.length;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          filledCount,
          totalCount
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

// 3. getReviewElements — review/testimonial containers: [{tag, id, class_preview, text_preview}] (max 20)
export async function getReviewElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="review"], [class*="testimonial"], [itemtype*="Review"], [itemprop="review"], [class*="feedback"]';
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

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 4. getRatingInputs — rating input controls (range inputs, radio stars): [{id, type, value, min, max}] (max 20)
export async function getRatingInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();
      // Range inputs used as rating sliders
      const rangeInputs = Array.from(document.querySelectorAll('input[type="range"]'));
      for (const el of rangeInputs) {
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          id: el.id || null,
          type: 'range',
          value: el.getAttribute('value') || null,
          min: el.getAttribute('min') || null,
          max: el.getAttribute('max') || null
        });
        if (results.length >= 20) break;
      }
      // Radio inputs used for star selection (often named "rating" or "stars")
      if (results.length < 20) {
        const radioInputs = Array.from(document.querySelectorAll('input[type="radio"][name*="rating"], input[type="radio"][name*="star"], input[type="radio"][class*="rating"], input[type="radio"][class*="star"]'));
        for (const el of radioInputs) {
          if (seen.has(el)) continue;
          seen.add(el);
          results.push({
            id: el.id || null,
            type: 'radio',
            value: el.getAttribute('value') || null,
            min: null,
            max: null
          });
          if (results.length >= 20) break;
        }
      }
      // Number inputs in rating contexts
      if (results.length < 20) {
        const numInputs = Array.from(document.querySelectorAll('input[type="number"][class*="rating"], input[type="number"][id*="rating"]'));
        for (const el of numInputs) {
          if (seen.has(el)) continue;
          seen.add(el);
          results.push({
            id: el.id || null,
            type: 'number',
            value: el.getAttribute('value') || null,
            min: el.getAttribute('min') || null,
            max: el.getAttribute('max') || null
          });
          if (results.length >= 20) break;
        }
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getRatingState — rating summary: {hasRating, hasStars, hasReviews, averageRating, reviewCount}
export async function getRatingState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Detect rating elements
      const ratingEls = document.querySelectorAll('[class*="rating"], [itemprop="ratingValue"], [data-rating]');
      const starEls = document.querySelectorAll('[class*="star"], [aria-label*="star"]');
      const reviewEls = document.querySelectorAll('[class*="review"], [itemtype*="Review"], [itemprop="review"]');

      // Try to extract average rating from schema or common patterns
      let averageRating = null;
      const ratingValueEl = document.querySelector('[itemprop="ratingValue"]');
      if (ratingValueEl) {
        const v = ratingValueEl.getAttribute('content') || ratingValueEl.textContent;
        if (v) averageRating = parseFloat(v.trim()) || null;
      }
      if (averageRating === null) {
        const dataRatingEl = document.querySelector('[data-rating]');
        if (dataRatingEl) {
          averageRating = parseFloat(dataRatingEl.getAttribute('data-rating') || '') || null;
        }
      }

      // Try to extract review count from schema
      let reviewCount = null;
      const countEl = document.querySelector('[itemprop="reviewCount"], [itemprop="ratingCount"]');
      if (countEl) {
        const v = countEl.getAttribute('content') || countEl.textContent;
        if (v) reviewCount = parseInt(v.trim(), 10) || null;
      }
      if (reviewCount === null) {
        reviewCount = reviewEls.length > 0 ? reviewEls.length : null;
      }

      return {
        hasRating: ratingEls.length > 0,
        hasStars: starEls.length > 0,
        hasReviews: reviewEls.length > 0,
        averageRating,
        reviewCount
      };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getLikeButtons3 — like/upvote/heart buttons: [{tag, id, text_preview, class_preview, count_preview}] (max 20)
// Suffixed 3 to avoid conflict with getLikeButtons in rating2.ts
export async function getLikeButtons3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="like"], [class*="upvote"], [class*="heart"], [aria-label*="like"], [aria-label*="heart"], [aria-label*="Love"], button[class*="react"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const textRaw = el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : '';
        const ariaLabel = el.getAttribute('aria-label') || null;
        // Look for a sibling or child count element
        const countEl = el.querySelector('[class*="count"], [class*="num"]')
          || el.nextElementSibling;
        const countText = countEl ? countEl.textContent.trim().replace(/\\s+/g, ' ').slice(0, 20) : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text_preview: textRaw.slice(0, 80),
          class_preview: cls ? cls.slice(0, 80) : null,
          count_preview: countText
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

// 7. getVoteElements — upvote/downvote elements: [{tag, id, class_preview, text_preview}] (max 20)
export async function getVoteElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="vote"], [class*="upvote"], [class*="downvote"], [aria-label*="upvote"], [aria-label*="downvote"], [aria-label*="vote"]';
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

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 8. getRatingApiUsage — detected rating patterns: {hasStarRating, hasLikeButton, hasReviewForm, hasAggregateRating}
export async function getRatingApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Detect star rating presence
      const hasStarRating = !!(
        document.querySelector('[class*="star"][class*="rating"], [class*="starRating"], [itemtype*="AggregateRating"], [itemprop="ratingValue"]')
      );

      // Detect like button presence
      const hasLikeButton = !!(
        document.querySelector('[class*="like"], [class*="heart"], [aria-label*="like"], [aria-label*="heart"]')
      );

      // Detect review form presence
      const hasReviewForm = !!(
        document.querySelector('form[class*="review"], form[id*="review"], [class*="review-form"], [class*="reviewForm"], textarea[name*="review"], textarea[placeholder*="review"], textarea[placeholder*="Review"]')
      );

      // Detect aggregate rating schema markup
      const hasAggregateRating = !!(
        document.querySelector('[itemtype*="AggregateRating"], [itemprop="aggregateRating"], [data-aggregate-rating]')
      );

      return { hasStarRating, hasLikeButton, hasReviewForm, hasAggregateRating };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
