// src/cdp/carousel3.ts

type ToolResult = { content: [{ type: 'text'; text: string }] };
function ok(data: unknown): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string): ToolResult { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getCarouselElements — carousel/slider container elements: [{tag, id, class_preview, slideCount}] (max 20)
export async function getCarouselElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="carousel"], [class*="slider"], [class*="swiper"], [class*="splide"], [class*="glide"], [role="region"][aria-roledescription*="carousel"], [data-carousel], [data-slider]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        // Count slides: direct children with slide-like class, or [role="group"], or generic li children
        const slideEls = el.querySelectorAll('[class*="slide"], [role="group"][aria-roledescription*="slide"], [class*="item"]:not([class*="navItem"]):not([class*="pagination"])');
        const slideCount = slideEls.length || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          slideCount
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

// 2. getCarouselSlides — individual slide elements: [{tag, id, class_preview, isActive, index}] (max 30)
export async function getCarouselSlides(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = '[class*="carousel"] [class*="slide"], [class*="slider"] [class*="slide"], [class*="swiper-slide"], [class*="splide__slide"], [role="group"][aria-roledescription*="slide"]';
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      let index = 0;
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const isActive = !!(
          el.classList.contains('active') ||
          el.classList.contains('is-active') ||
          el.classList.contains('swiper-slide-active') ||
          el.classList.contains('splide__slide--active') ||
          el.getAttribute('aria-hidden') === 'false' ||
          el.getAttribute('aria-current') === 'true'
        );
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          isActive,
          index
        });
        index++;
        if (results.length >= 30) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 3. getCarouselControls — prev/next arrow controls: [{tag, id, class_preview, direction, disabled}] (max 20)
export async function getCarouselControls(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="carousel-prev"], [class*="carousel-next"]',
        '[class*="swiper-button-prev"], [class*="swiper-button-next"]',
        '[class*="splide__arrow--prev"], [class*="splide__arrow--next"]',
        '[class*="slider-prev"], [class*="slider-next"]',
        '[aria-label*="previous" i], [aria-label*="next" i], [aria-label*="prev" i]',
        'button[class*="prev"], button[class*="next"]',
        '[data-direction="prev"], [data-direction="next"]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const clsLower = (cls || '').toLowerCase();
        let direction = 'unknown';
        if (clsLower.includes('prev') || ariaLabel.includes('prev') || ariaLabel.includes('previous')) direction = 'prev';
        else if (clsLower.includes('next') || ariaLabel.includes('next')) direction = 'next';
        const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('disabled');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          direction,
          disabled
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

// 4. getCarouselDots — dot/bullet navigation indicators: [{tag, id, class_preview, isActive, index}] (max 30)
export async function getCarouselDots(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="carousel"] [class*="dot"]',
        '[class*="carousel"] [class*="bullet"]',
        '[class*="swiper-pagination-bullet"]',
        '[class*="splide__pagination__page"]',
        '[class*="slider"] [class*="dot"]',
        '[role="tablist"] [role="tab"][class*="dot"]',
        '[class*="pagination"] [class*="dot"]',
        '[class*="indicators"] > *',
        '[class*="paging"] > *'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      let index = 0;
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        const isActive = !!(
          el.classList.contains('active') ||
          el.classList.contains('is-active') ||
          el.classList.contains('swiper-pagination-bullet-active') ||
          el.classList.contains('is-active') ||
          el.getAttribute('aria-current') === 'true' ||
          el.getAttribute('aria-selected') === 'true'
        );
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          isActive,
          index
        });
        index++;
        if (results.length >= 30) break;
      }
      return results;
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 5. getCarouselState — carousel summary: {hasCarousel, carouselCount, currentSlide, totalSlides, autoPlay}
export async function getCarouselState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const carouselEls = document.querySelectorAll('[class*="carousel"], [class*="swiper"], [class*="splide"], [role="region"][aria-roledescription*="carousel"]');
      const hasCarousel = carouselEls.length > 0;
      const carouselCount = carouselEls.length;

      // Try to detect current slide index
      let currentSlide = null;
      const activeSlide = document.querySelector('[class*="slide"].active, [class*="swiper-slide-active"], [class*="splide__slide--active"], [class*="slide"][aria-hidden="false"]');
      if (activeSlide) {
        const parent = activeSlide.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const idx = siblings.indexOf(activeSlide);
          if (idx >= 0) currentSlide = idx;
        }
      }

      // Try to detect total slides
      let totalSlides = null;
      const slideEls = document.querySelectorAll('[class*="carousel"] [class*="slide"], [class*="swiper-slide"], [class*="splide__slide"]');
      if (slideEls.length > 0) totalSlides = slideEls.length;

      // Detect autoplay: look for data-autoplay, data-auto-play, or Swiper/Splide autoplay indicators
      const autoPlayEl = document.querySelector('[data-autoplay], [data-auto-play="true"], [class*="swiper"][data-swiper-autoplay], .swiper-wrapper[style*="transition-duration"]');
      // Also check window-level instances if accessible
      let autoPlay = !!autoPlayEl;
      if (!autoPlay) {
        // Check for Swiper instance autoplay
        try {
          const swiperEl = document.querySelector('.swiper');
          if (swiperEl && swiperEl.swiper && swiperEl.swiper.autoplay && swiperEl.swiper.autoplay.running) autoPlay = true;
        } catch(_) {}
      }

      return { hasCarousel, carouselCount, currentSlide, totalSlides, autoPlay };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}

// 6. getSliderElements — range slider / swiper elements: [{tag, id, class_preview, type, min, max, value}] (max 20)
export async function getSliderElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const results = [];
      const seen = new Set();

      // Native range inputs
      const rangeEls = Array.from(document.querySelectorAll('input[type="range"]'));
      for (const el of rangeEls) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null,
          type: 'range',
          min: el.getAttribute('min') || null,
          max: el.getAttribute('max') || null,
          value: el.getAttribute('value') || null
        });
        if (results.length >= 20) break;
      }

      // Custom slider containers (noUiSlider, rc-slider, etc.)
      if (results.length < 20) {
        const customSel = '[class*="noUi"], [class*="rc-slider"], [class*="slider-track"], [class*="range-slider"], [role="slider"]';
        const customEls = Array.from(document.querySelectorAll(customSel));
        for (const el of customEls) {
          if (seen.has(el)) continue;
          seen.add(el);
          const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
          const min = el.getAttribute('aria-valuemin') || el.getAttribute('data-min') || null;
          const max = el.getAttribute('aria-valuemax') || el.getAttribute('data-max') || null;
          const value = el.getAttribute('aria-valuenow') || el.getAttribute('data-value') || null;
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls ? cls.slice(0, 80) : null,
            type: 'custom',
            min,
            max,
            value
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

// 7. getSwipeElements — elements with swipe/touch gesture handlers: [{tag, id, class_preview}] (max 20)
export async function getSwipeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      const sel = [
        '[class*="swipe"]',
        '[class*="touch-slider"]',
        '[class*="draggable"]',
        '[class*="flickity"]',
        '[data-touch]',
        '[data-swipe]',
        '[data-drag]',
        '[class*="hammer"]',
        '[class*="gesture"]',
        '[class*="swiper-wrapper"]',
        '[class*="splide__track"]'
      ].join(', ');
      const els = Array.from(document.querySelectorAll(sel));
      const seen = new Set();
      const results = [];
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cls = el.className ? String(el.className).trim().replace(/\\s+/g, ' ') : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: cls ? cls.slice(0, 80) : null
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

// 8. getCarouselApiUsage — detected carousel libraries: {hasSwiperJs, hasSplide, hasSlick, hasOwlCarousel, hasGlide}
export async function getCarouselApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(function() {
    try {
      // Swiper.js — class patterns or global
      const hasSwiperJs = !!(
        document.querySelector('.swiper, .swiper-container, .swiper-wrapper, .swiper-slide') ||
        (typeof window !== 'undefined' && 'Swiper' in window)
      );

      // Splide
      const hasSplide = !!(
        document.querySelector('.splide, .splide__track, .splide__list, .splide__slide') ||
        (typeof window !== 'undefined' && 'Splide' in window)
      );

      // Slick Carousel
      const hasSlick = !!(
        document.querySelector('.slick-slider, .slick-track, .slick-list, .slick-slide') ||
        (typeof window !== 'undefined' && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn !== 'undefined' && 'slick' in window.jQuery.fn)
      );

      // Owl Carousel
      const hasOwlCarousel = !!(
        document.querySelector('.owl-carousel, .owl-stage, .owl-item') ||
        (typeof window !== 'undefined' && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn !== 'undefined' && 'owlCarousel' in window.jQuery.fn)
      );

      // Glide.js
      const hasGlide = !!(
        document.querySelector('.glide, .glide__track, .glide__slides, .glide__slide') ||
        (typeof window !== 'undefined' && 'Glide' in window)
      );

      return { hasSwiperJs, hasSplide, hasSlick, hasOwlCarousel, hasGlide };
    } catch(e) { return { error: String(e) }; }
  })()`;

  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) return err(exceptionDetails.text || 'Runtime exception');
  return ok(result.value);
}
