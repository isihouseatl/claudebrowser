// src/cdp/table5.ts
// HTML table inspection functions — 8 exported utilities.
// No DOM lib: all browser APIs live inside expression strings evaluated via Runtime.evaluate.

export async function getTableCount5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var withCaption = 0, withThead = 0, withTfoot = 0;
      for (var i = 0; i < tables.length; i++) {
        if (tables[i].querySelector('caption')) withCaption++;
        if (tables[i].querySelector('thead')) withThead++;
        if (tables[i].querySelector('tfoot')) withTfoot++;
      }
      return JSON.stringify({ count: tables.length, withCaption: withCaption, withThead: withThead, withTfoot: withTfoot });
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getTableHeaders5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var headers = [];
      for (var ti = 0; ti < tables.length && headers.length < 30; ti++) {
        var ths = tables[ti].querySelectorAll('th');
        for (var i = 0; i < ths.length && headers.length < 30; i++) {
          var th = ths[i];
          var text = (th.textContent || '').trim().slice(0, 80);
          headers.push({
            table_index: ti,
            text_preview: text,
            scope: th.getAttribute('scope') || '',
            colspan: th.colSpan || 1,
            rowspan: th.rowSpan || 1
          });
        }
      }
      return JSON.stringify(headers);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getTableRowCount5(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      var limit = Math.min(tables.length, 20);
      for (var i = 0; i < limit; i++) {
        var t = tables[i];
        var rows = t.querySelectorAll('tr');
        var firstRow = rows[0];
        var colCount = 0;
        if (firstRow) {
          var cells = firstRow.querySelectorAll('th,td');
          for (var c = 0; c < cells.length; c++) {
            colCount += (cells[c].colSpan || 1);
          }
        }
        out.push({
          table_index: i,
          id: t.id || '',
          rowCount: rows.length,
          colCount: colCount
        });
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getTableCaption2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      for (var i = 0; i < tables.length && out.length < 20; i++) {
        var cap = tables[i].querySelector('caption');
        if (cap) {
          out.push({
            table_index: i,
            id: tables[i].id || '',
            text_preview: (cap.textContent || '').trim().slice(0, 80)
          });
        }
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getDataTables(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      for (var i = 0; i < tables.length && out.length < 10; i++) {
        var t = tables[i];
        var role = t.getAttribute('role') || '';
        var summary = t.getAttribute('summary') || '';
        var ariaLabel = t.getAttribute('aria-label') || '';
        if (role === 'grid' || summary || ariaLabel) {
          out.push({
            id: t.id || '',
            role: role,
            summary_preview: summary.slice(0, 80),
            ariaLabel_preview: ariaLabel.slice(0, 80)
          });
        }
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getTableSortable(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      for (var ti = 0; ti < tables.length && out.length < 10; ti++) {
        var ths = tables[ti].querySelectorAll('th[aria-sort]');
        for (var i = 0; i < ths.length && out.length < 10; i++) {
          var th = ths[i];
          var dir = th.getAttribute('aria-sort') || '';
          out.push({
            table_index: ti,
            sortedColumn: (th.textContent || '').trim().slice(0, 80),
            sortDirection: dir
          });
        }
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getTableFooters2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      for (var ti = 0; ti < tables.length && out.length < 20; ti++) {
        var tfoot = tables[ti].querySelector('tfoot');
        if (tfoot) {
          var rows = tfoot.querySelectorAll('tr');
          for (var i = 0; i < rows.length && out.length < 20; i++) {
            out.push({
              table_index: ti,
              text_preview: (rows[i].textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80)
            });
          }
        }
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}

export async function getNestedTables2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var tables = document.querySelectorAll('table');
      var out = [];
      for (var i = 0; i < tables.length && out.length < 10; i++) {
        var t = tables[i];
        var depth = 0;
        var ancestor = t.parentElement;
        while (ancestor) {
          if (ancestor.tagName === 'TABLE') depth++;
          ancestor = ancestor.parentElement;
        }
        if (depth > 0) {
          out.push({
            depth: depth,
            id: t.id || '',
            rowCount: t.querySelectorAll('tr').length
          });
        }
      }
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: exceptionDetails.text || 'Runtime exception' }) }] };
  }
  const parsed = JSON.parse(result.value as string);
  return { content: [{ type: 'text' as const, text: JSON.stringify(parsed, null, 2) }] };
}
