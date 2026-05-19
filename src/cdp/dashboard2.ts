import type CRI from 'chrome-remote-interface';

export async function getDashboardCards(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="card"]', '[class*="panel"]', '[class*="dashboard-item"]',
      '[class*="widget"]', '[data-type="card"]', '[role="region"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const heading = el.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"]');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          title_preview: (heading ? heading.textContent : el.getAttribute('aria-label') || '').trim().slice(0, 60)
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getWidgetElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="widget"]', '[class*="tile"]', '[class*="brick"]',
      '[data-widget]', '[data-component="widget"]', '[class*="module"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const typeAttr = el.getAttribute('data-type') || el.getAttribute('data-widget') || el.getAttribute('data-component') || null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          type_preview: (typeAttr || el.getAttribute('aria-label') || '').toString().slice(0, 60)
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getStatCards(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="stat"]', '[class*="metric"]', '[class*="kpi"]',
      '[class*="summary-card"]', '[class*="number-card"]', '[data-stat]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const label = el.querySelector('[class*="label"],[class*="title"],[class*="name"]');
        const value = el.querySelector('[class*="value"],[class*="count"],[class*="number"],[class*="amount"]');
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          label_preview: (label ? label.textContent : '').trim().slice(0, 60),
          value_preview: (value ? value.textContent : '').trim().slice(0, 40)
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getKpiElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="kpi"]', '[class*="counter"]', '[class*="scorecard"]',
      '[data-kpi]', '[class*="indicator"]', '[class*="measure"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          text_preview: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80)
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getDashboardLayout(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const gridContainers = Array.from(document.querySelectorAll('*')).filter(el => {
      const cs = window.getComputedStyle(el);
      return cs.display === 'grid' || cs.display === 'inline-grid';
    });
    const flexContainers = Array.from(document.querySelectorAll('*')).filter(el => {
      const cs = window.getComputedStyle(el);
      return cs.display === 'flex' || cs.display === 'inline-flex';
    });
    let columnCount = 0;
    let rowCount = 0;
    if (gridContainers.length > 0) {
      const primary = gridContainers[0];
      const cs = window.getComputedStyle(primary);
      const cols = cs.gridTemplateColumns.split(' ').filter(s => s && s !== 'none');
      const rows = cs.gridTemplateRows.split(' ').filter(s => s && s !== 'none');
      columnCount = cols.length;
      rowCount = rows.length;
    }
    const layoutSelectors = ['[class*="grid"]','[class*="layout"]','[class*="dashboard-body"]','[class*="content-area"]','main'];
    let namedContainers = 0;
    for (const sel of layoutSelectors) {
      namedContainers += document.querySelectorAll(sel).length;
    }
    return {
      containerCount: namedContainers,
      columnCount,
      rowCount,
      hasGrid: gridContainers.length > 0,
      gridContainerCount: gridContainers.length,
      flexContainerCount: flexContainers.length
    };
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getMetricDisplays(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="metric"]', '[class*="figure"]', '[class*="datum"]',
      '[class*="reading"]', '[class*="display"]', '[data-metric]', '[data-value]'
    ];
    const numericPattern = /[\\d,.]+/;
    const unitPattern = /(\\$|%|ms|s|kb|mb|gb|k|m|b|px|rpm|req|\/s|\/min|\/hr)/i;
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        const text = (el.textContent || '').trim();
        const numMatch = text.match(numericPattern);
        const unitMatch = text.match(unitPattern);
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          value_preview: numMatch ? numMatch[0].slice(0, 30) : text.slice(0, 30),
          unit_preview: unitMatch ? unitMatch[0] : null
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getProgressBars3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const results = [];
    const nativeEls = Array.from(document.querySelectorAll('progress'));
    for (const el of nativeEls) {
      const pct = el.max > 0 ? Math.round((el.value / el.max) * 100) : null;
      results.push({
        tag: 'progress',
        id: el.id || null,
        class_preview: (el.className || '').toString().slice(0, 80),
        value: el.value,
        max: el.max,
        percentage: pct
      });
      if (results.length >= 20) break;
    }
    if (results.length < 20) {
      const roleEls = Array.from(document.querySelectorAll('[role="progressbar"]'));
      for (const el of roleEls) {
        const val = parseFloat(el.getAttribute('aria-valuenow') || '0');
        const max = parseFloat(el.getAttribute('aria-valuemax') || '100');
        const pct = max > 0 ? Math.round((val / max) * 100) : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          value: val,
          max: max,
          percentage: pct
        });
        if (results.length >= 20) break;
      }
    }
    if (results.length < 20) {
      const cssBars = Array.from(document.querySelectorAll('[class*="progress-bar"],[class*="progressbar"],[class*="progress-fill"],[class*="bar-fill"]'));
      for (const el of cssBars) {
        const style = window.getComputedStyle(el);
        const widthPct = style.width && el.parentElement
          ? Math.round((parseFloat(style.width) / (el.parentElement.getBoundingClientRect().width || 1)) * 100)
          : null;
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          value: el.getAttribute('data-value') || null,
          max: el.getAttribute('data-max') || null,
          percentage: widthPct
        });
        if (results.length >= 20) break;
      }
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}

export async function getGaugeElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const expression = `(async () => {
    const selectors = [
      '[class*="gauge"]', '[class*="dial"]', '[class*="speedometer"]',
      '[class*="donut"]', '[class*="radial"]', '[data-gauge]',
      'meter', '[role="meter"]'
    ];
    const seen = new Set();
    const results = [];
    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);
        let value_preview = null;
        if (el.tagName.toLowerCase() === 'meter') {
          value_preview = el.value !== undefined ? String(el.value) : null;
        } else {
          const dataVal = el.getAttribute('data-value') || el.getAttribute('aria-valuenow');
          const inner = el.querySelector('[class*="value"],[class*="label"],[class*="text"]');
          value_preview = dataVal || (inner ? inner.textContent.trim().slice(0, 30) : (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30));
        }
        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 80),
          value_preview
        });
        if (results.length >= 10) break;
      }
      if (results.length >= 10) break;
    }
    return results;
  })()`;
  const { result } = await (cdp as any).raw.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value ?? result) }] };
}
