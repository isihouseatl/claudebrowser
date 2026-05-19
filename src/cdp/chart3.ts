export async function getChartElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = 'canvas, svg, [class*="chart"],[id*="chart"],[class*="graph"],[id*="graph"],[class*="recharts"],[class*="nivo"],[class*="victory"],[class*="highcharts"],[class*="apexcharts"],[class*="plotly"],[class*="echarts"]';
      return Array.from(document.querySelectorAll(sel)).slice(0, 20).map(function(el) {
        var rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getCanvasElements5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      return Array.from(document.querySelectorAll('canvas')).slice(0, 20).map(function(el) {
        var rect = el.getBoundingClientRect();
        var hasContext = false;
        try { hasContext = !!(el.getContext('2d') || el.getContext('webgl') || el.getContext('webgl2')); } catch(e) {}
        return {
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          hasContext: hasContext
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getSvgCharts3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      return Array.from(document.querySelectorAll('svg')).filter(function(el) {
        var child = el.children.length;
        var cls = (el.className && el.className.baseVal ? el.className.baseVal : (el.getAttribute('class') || '')).toLowerCase();
        var hasChartClass = cls.indexOf('chart') !== -1 || cls.indexOf('graph') !== -1 || cls.indexOf('recharts') !== -1 || cls.indexOf('highcharts') !== -1 || cls.indexOf('apexcharts') !== -1 || cls.indexOf('nivo') !== -1;
        return hasChartClass || child > 5;
      }).slice(0, 20).map(function(el) {
        var rect = el.getBoundingClientRect();
        var cls = el.className && el.className.baseVal ? el.className.baseVal : (el.getAttribute('class') || '');
        return {
          id: el.id || null,
          class_preview: cls.slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          childCount: el.children.length
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getChartLegends3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = '[class*="legend"],[class*="chart-legend"],[id*="legend"],[class*="recharts-legend"],[class*="apexcharts-legend"],[class*="highcharts-legend"]';
      return Array.from(document.querySelectorAll(sel)).slice(0, 20).map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 40),
          itemCount: el.children.length
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getChartAxes(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = '[class*="axis"],[class*="x-axis"],[class*="y-axis"],[class*="xAxis"],[class*="yAxis"],[class*="recharts-xAxis"],[class*="recharts-yAxis"],[class*="highcharts-axis"],[class*="apexcharts-xaxis"],[class*="apexcharts-yaxis"]';
      return Array.from(document.querySelectorAll(sel)).slice(0, 20).map(function(el) {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 40),
          text_preview: (el.textContent || '').trim().slice(0, 60)
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getChartTooltips3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var sel = '[class*="chart-tooltip"],[class*="apexcharts-tooltip"],[class*="highcharts-tooltip"],[class*="recharts-tooltip"],[class*="nivo-tooltip"],[class*="plotly-tooltip"],[class*="chart-tip"],[class*="graph-tooltip"]';
      return Array.from(document.querySelectorAll(sel)).slice(0, 10).map(function(el) {
        var style = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class_preview: (el.className || '').toString().slice(0, 40),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0',
          text_preview: (el.textContent || '').trim().slice(0, 60)
        };
      });
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getChartState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var canvasCount = document.querySelectorAll('canvas').length;
      var svgCount = document.querySelectorAll('svg').length;
      var chartSel = '[class*="chart"],[id*="chart"],[class*="recharts"],[class*="highcharts"],[class*="apexcharts"],[class*="nivo"],[class*="plotly"],[class*="echarts"],[class*="victory"]';
      var hasCharts = document.querySelectorAll(chartSel).length > 0 || canvasCount > 0 || svgCount > 0;
      var chartLibrary = 'unknown';
      if (typeof window.Chart !== 'undefined') chartLibrary = 'Chart.js';
      else if (typeof window.d3 !== 'undefined') chartLibrary = 'D3.js';
      else if (typeof window.Highcharts !== 'undefined') chartLibrary = 'Highcharts';
      else if (typeof window.ApexCharts !== 'undefined') chartLibrary = 'ApexCharts';
      else if (typeof window.Plotly !== 'undefined') chartLibrary = 'Plotly';
      else if (typeof window.echarts !== 'undefined') chartLibrary = 'ECharts';
      else if (document.querySelector('[class*="recharts"]')) chartLibrary = 'Recharts';
      else if (document.querySelector('[class*="nivo"]')) chartLibrary = 'Nivo';
      return { hasCharts: hasCharts, canvasCount: canvasCount, svgCount: svgCount, chartLibrary: chartLibrary };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

export async function getChartApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      return {
        hasChartJs: typeof window.Chart !== 'undefined',
        hasD3: typeof window.d3 !== 'undefined',
        hasHighcharts: typeof window.Highcharts !== 'undefined',
        hasApexCharts: typeof window.ApexCharts !== 'undefined',
        hasPlotly: typeof window.Plotly !== 'undefined',
        hasRecharts: document.querySelector('[class*="recharts-wrapper"],[class*="recharts-surface"]') !== null
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}
