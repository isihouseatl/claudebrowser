// src/cdp/card2.ts
// Card, article, carousel, tabpanel, accordion, list-item, stepper, and
// timeline inspection tools via Chrome DevTools Protocol.
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

/**
 * Find card-like elements by .card, .tile, .item class names or <article> tags.
 * Returns id, class, title, hasImage, hasButton for up to 20 elements.
 * (Named getCards — no conflict detected in server.ts at time of authoring.)
 */
export async function getCards(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const seen = new Set();
  const cards = [];
  const selectors = [
    '.card', '.tile', '.item', 'article',
    '[class*="card"]', '[class*="tile"]',
  ];
  for (const sel of selectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (seen.has(el)) continue;
      seen.add(el);
      const heading = el.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"]');
      cards.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || '',
        title: heading ? (heading.textContent || '').trim().slice(0, 120) : '',
        hasImage: !!el.querySelector('img, picture, [style*="background-image"]'),
        hasButton: !!el.querySelector('button, a[href], [role="button"]'),
      });
      if (cards.length >= 20) break;
    }
    if (cards.length >= 20) break;
  }
  return cards;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find all <article> elements on the page.
 * Returns id, class, heading_text, text_preview for up to 10 elements.
 */
export async function getArticles(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return Array.from(document.querySelectorAll('article')).slice(0, 10).map(el => {
    const heading = el.querySelector('h1,h2,h3,h4,h5,h6');
    const allText = (el.textContent || '').trim().replace(/\\s+/g, ' ');
    return {
      id: el.id || '',
      class: el.className || '',
      heading_text: heading ? (heading.textContent || '').trim().slice(0, 120) : '',
      text_preview: allText.slice(0, 200),
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find carousel/slider containers by role="region", .carousel, .slider, .swiper.
 * Returns id, class, slideCount for up to 5 elements.
 */
export async function getCarousels(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const seen = new Set();
  const results = [];
  const selectors = [
    '.carousel', '.slider', '.swiper',
    '[class*="carousel"]', '[class*="slider"]', '[class*="swiper"]',
    '[role="region"][aria-label]',
  ];
  for (const sel of selectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (seen.has(el)) continue;
      seen.add(el);
      // Count slide-like children
      const slideChildren = el.querySelectorAll(
        '.slide, .swiper-slide, [class*="slide"], [role="group"], li'
      );
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        slideCount: slideChildren.length,
      });
      if (results.length >= 5) break;
    }
    if (results.length >= 5) break;
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find elements with role="tabpanel".
 * Returns id, class, isVisible, associatedTab for up to 10 elements.
 */
export async function getTabPanels(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return Array.from(document.querySelectorAll('[role="tabpanel"]')).slice(0, 10).map(el => {
    const labelledBy = el.getAttribute('aria-labelledby') || '';
    let associatedTab = '';
    if (labelledBy) {
      const tabEl = document.getElementById(labelledBy);
      associatedTab = tabEl ? (tabEl.textContent || '').trim().slice(0, 80) : labelledBy;
    }
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    return {
      id: el.id || '',
      class: el.className || '',
      isVisible,
      associatedTab,
      ariaHidden: el.getAttribute('aria-hidden') || '',
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find accordion containers by role="region", .accordion, or [data-accordion].
 * Returns id, class, and items with summary/heading text for up to 10 containers.
 */
export async function getAccordions(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const seen = new Set();
  const results = [];
  const selectors = [
    '.accordion', '[data-accordion]', '[class*="accordion"]',
    'details',
  ];
  for (const sel of selectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (seen.has(el)) continue;
      seen.add(el);
      // Collect item headings from summary, [role="button"], or heading tags
      const itemEls = el.tagName.toLowerCase() === 'details'
        ? [el]
        : Array.from(el.querySelectorAll('details, [role="button"], [data-accordion-item]'));
      const items = itemEls.slice(0, 10).map(item => {
        const summary = item.querySelector('summary, [role="button"], h2, h3, h4, h5, h6');
        return {
          text: summary ? (summary.textContent || '').trim().slice(0, 100) : '',
          isOpen: item.tagName.toLowerCase() === 'details'
            ? (item).hasAttribute('open')
            : item.getAttribute('aria-expanded') === 'true',
        };
      });
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || '',
        items,
      });
      if (results.length >= 10) break;
    }
    if (results.length >= 10) break;
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Return all <li> elements as structured data.
 * Returns text_preview, hasLink, hasBullet, depth for up to 30 elements.
 * Named getStructuredListItems to avoid conflict with getListItems2 in list2.ts.
 */
export async function getStructuredListItems(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  function getDepth(el) {
    let depth = 0;
    let node = el.parentElement;
    while (node) {
      if (node.tagName === 'UL' || node.tagName === 'OL') depth++;
      node = node.parentElement;
    }
    return depth;
  }
  return Array.from(document.querySelectorAll('li')).slice(0, 30).map(el => {
    const style = window.getComputedStyle(el);
    const listStyleType = style.listStyleType || '';
    const hasBullet = listStyleType !== 'none' && listStyleType !== '';
    return {
      text_preview: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 150),
      hasLink: !!el.querySelector('a[href]'),
      hasBullet,
      depth: getDepth(el),
    };
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find step/wizard UI elements by .stepper, .steps, [data-step], or role="list"
 * with step-like items. Returns stepCount and currentStep for up to 5 containers.
 */
export async function getSteppers(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const seen = new Set();
  const results = [];
  const selectors = [
    '.stepper', '.steps', '[data-stepper]', '[data-steps]',
    '[class*="stepper"]', '[class*="steps"]', '[class*="wizard"]',
  ];
  for (const sel of selectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (seen.has(el)) continue;
      seen.add(el);
      const stepItems = el.querySelectorAll(
        '[data-step], .step, [class*="step-item"], [class*="step--"], li'
      );
      // Detect active/current step
      let currentStep = -1;
      stepItems.forEach((item, idx) => {
        const cls = item.className || '';
        const ariaCurrent = item.getAttribute('aria-current');
        if (
          cls.includes('active') || cls.includes('current') ||
          cls.includes('selected') || ariaCurrent === 'step' || ariaCurrent === 'true'
        ) {
          currentStep = idx + 1;
        }
      });
      results.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className || '',
        stepCount: stepItems.length,
        currentStep,
      });
      if (results.length >= 5) break;
    }
    if (results.length >= 5) break;
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find timeline elements by .timeline, [data-timeline], or ol/ul containers
 * that include <time> elements. Returns items [{text, time}] for up to 10 containers.
 */
export async function getTimeline(client: CdpClient) {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const seen = new Set();
  const results = [];

  // Explicit timeline containers
  const explicitSelectors = [
    '.timeline', '[data-timeline]', '[class*="timeline"]',
  ];
  const containers = [];
  for (const sel of explicitSelectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (!seen.has(el)) { seen.add(el); containers.push(el); }
    }
  }

  // Fallback: ol/ul with at least one <time> inside
  for (const el of Array.from(document.querySelectorAll('ol, ul'))) {
    if (!seen.has(el) && el.querySelector('time')) {
      seen.add(el);
      containers.push(el);
    }
  }

  for (const container of containers.slice(0, 10)) {
    // Each direct child li or [class*="item"] is a timeline entry
    const entryEls = container.querySelectorAll(
      ':scope > li, :scope > [class*="item"], :scope > [class*="entry"], :scope > [class*="event"]'
    );
    const items = Array.from(entryEls).slice(0, 20).map(entry => {
      const timeEl = entry.querySelector('time');
      const headingEl = entry.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"]');
      const text = headingEl
        ? (headingEl.textContent || '').trim().slice(0, 100)
        : (entry.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 100);
      return {
        text,
        time: timeEl
          ? (timeEl.getAttribute('datetime') || timeEl.textContent || '').trim()
          : '',
      };
    });
    results.push({
      tag: container.tagName.toLowerCase(),
      id: container.id || '',
      class: container.className || '',
      items,
    });
  }
  return results;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}
