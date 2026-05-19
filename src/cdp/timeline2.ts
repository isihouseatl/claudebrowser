export async function getTimelineElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[class*="timeline"]',
        '[id*="timeline"]',
        '[data-testid*="timeline"]',
        '[role="feed"]',
        '[class*="feed-container"]',
        '[class*="activity-feed"]',
        '[class*="event-list"]',
        '[class*="history-list"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        if (results.length >= 20) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 20) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const itemCount = el.children.length;
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            itemCount
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getTimelineItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[class*="timeline-item"]',
        '[class*="timeline-entry"]',
        '[class*="timeline-event"]',
        '[class*="feed-item"]',
        '[class*="activity-item"]',
        '[class*="history-item"]',
        '[class*="event-item"]',
        '[data-testid*="timeline-item"]'
      ];
      const seen = new Set();
      const results = [];
      const datePatterns = /\\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\\d{1,2}\\/\\d{1,2}|\\d{4}|today|yesterday|ago|just now)/i;
      for (const sel of selectors) {
        if (results.length >= 30) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 30) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const text = (el.textContent || '').trim().slice(0, 120);
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          const dateEl = el.querySelector('time, [class*="date"], [class*="time"], [datetime]');
          const date_preview = dateEl
            ? (dateEl.getAttribute('datetime') || dateEl.textContent || '').trim().slice(0, 50)
            : (datePatterns.test(text) ? text.slice(0, 50) : null);
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            text_preview: text,
            date_preview: date_preview || null
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getActivityFeed(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[role="feed"]',
        '[class*="activity-feed"]',
        '[class*="news-feed"]',
        '[class*="notification-feed"]',
        '[class*="event-feed"]',
        '[id*="activity"]',
        '[id*="news-feed"]',
        '[data-testid*="feed"]',
        '[class*="social-feed"]',
        '[class*="update-feed"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        if (results.length >= 20) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 20) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            itemCount: el.children.length
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getFeedItems(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[role="article"]',
        '[class*="feed-item"]',
        '[class*="post-item"]',
        '[class*="update-item"]',
        '[class*="notification-item"]',
        '[class*="activity-item"]',
        '[data-testid*="feed-item"]',
        '[data-testid*="post"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        if (results.length >= 30) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 30) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const text = (el.textContent || '').trim().slice(0, 120);
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            text_preview: text
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getTimelineState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const timelineSelectors = [
        '[class*="timeline"]',
        '[id*="timeline"]',
        '[data-testid*="timeline"]'
      ];
      const feedSelectors = [
        '[role="feed"]',
        '[class*="activity-feed"]',
        '[class*="news-feed"]',
        '[class*="feed-container"]'
      ];
      const itemSelectors = [
        '[class*="timeline-item"]',
        '[class*="timeline-entry"]',
        '[class*="feed-item"]',
        '[class*="activity-item"]'
      ];
      const horizontalSelectors = [
        '[class*="timeline-horizontal"]',
        '[class*="horizontal-timeline"]',
        '[class*="timeline"][style*="flex-direction: row"]'
      ];
      const verticalSelectors = [
        '[class*="timeline-vertical"]',
        '[class*="vertical-timeline"]'
      ];

      const hasEl = (sels) => sels.some(s => { try { return !!document.querySelector(s); } catch(e) { return false; } });

      let itemCount = 0;
      for (const sel of itemSelectors) {
        try {
          const nodes = document.querySelectorAll(sel);
          if (nodes.length > itemCount) itemCount = nodes.length;
        } catch(e) {}
      }

      return {
        hasTimeline: hasEl(timelineSelectors),
        hasFeed: hasEl(feedSelectors),
        itemCount,
        isVertical: hasEl(verticalSelectors),
        isHorizontal: hasEl(horizontalSelectors)
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? { hasTimeline: false, hasFeed: false, itemCount: 0, isVertical: false, isHorizontal: false };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getStepTimeline(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[class*="stepper"]',
        '[class*="step-timeline"]',
        '[class*="wizard"]',
        '[class*="progress-steps"]',
        '[class*="multi-step"]',
        '[role="tablist"][class*="step"]',
        '[data-testid*="stepper"]',
        '[class*="breadcrumb-steps"]',
        '[class*="onboarding-steps"]',
        '[aria-label*="step"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        if (results.length >= 10) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 10) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          const stepItems = el.querySelectorAll('[class*="step"], [role="tab"], li');
          const stepCount = stepItems.length;
          let currentStep = null;
          stepItems.forEach((step, idx) => {
            const sc = (step.className && typeof step.className === 'string') ? step.className : '';
            if (sc.includes('active') || sc.includes('current') || sc.includes('selected') ||
                step.getAttribute('aria-selected') === 'true' ||
                step.getAttribute('aria-current') === 'step') {
              currentStep = idx + 1;
            }
          });
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            stepCount,
            currentStep
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getVerticalTimeline(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const selectors = [
        '[class*="vertical-timeline"]',
        '[class*="timeline-vertical"]',
        '[class*="timeline"][class*="left"]',
        '[class*="timeline"][class*="right"]',
        '[class*="audit-trail"]',
        '[class*="commit-timeline"]',
        '[class*="changelog"]',
        '[class*="event-stream"]',
        '[class*="activity-stream"]',
        '[class*="history-stream"]'
      ];
      const seen = new Set();
      const results = [];
      for (const sel of selectors) {
        if (results.length >= 20) break;
        let nodes;
        try { nodes = document.querySelectorAll(sel); } catch(e) { continue; }
        for (const el of nodes) {
          if (results.length >= 20) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const cls = el.className && typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class_preview: cls,
            itemCount: el.children.length
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? [];
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export async function getTimelineApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(() => {
      const html = document.documentElement.outerHTML;
      const timelinePatterns = [
        /timeline/i,
        /activity[-_]feed/i,
        /event[-_]stream/i,
        /history[-_]list/i,
        /audit[-_]trail/i
      ];
      const feedPatterns = [
        /news[-_]?feed/i,
        /activity[-_]?feed/i,
        /notification[-_]?feed/i,
        /social[-_]?feed/i,
        /update[-_]?feed/i
      ];
      const infiniteScrollPatterns = [
        /infinite[-_]?scroll/i,
        /load[-_]?more/i,
        /IntersectionObserver/,
        /virtualized/i,
        /virtual[-_]?list/i
      ];
      const paginationPatterns = [
        /pagination/i,
        /page[-_]?number/i,
        /prev[-_]?page/i,
        /next[-_]?page/i,
        /aria-label="(Previous|Next) page"/i
      ];

      const hasPattern = (patterns) => patterns.some(p => p.test(html));

      const hasPaginationEl = !!(
        document.querySelector('[class*="pagination"]') ||
        document.querySelector('[aria-label="pagination"]') ||
        document.querySelector('[role="navigation"][aria-label*="page"]')
      );

      const hasInfiniteScrollEl = !!(
        document.querySelector('[class*="infinite-scroll"]') ||
        document.querySelector('[class*="load-more"]') ||
        document.querySelector('[data-testid*="load-more"]')
      );

      return {
        hasTimeline: hasPattern(timelinePatterns),
        hasActivityFeed: hasPattern(feedPatterns),
        hasInfiniteScroll: hasPattern(infiniteScrollPatterns) || hasInfiniteScrollEl,
        hasPagination: hasPattern(paginationPatterns) || hasPaginationEl
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value ?? { hasTimeline: false, hasActivityFeed: false, hasInfiniteScroll: false, hasPagination: false };
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
