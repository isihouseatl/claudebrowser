// src/cdp/table3.ts
// Advanced HTML table interaction module — structural extraction, CSV export,
// row selection detection, sort triggering, and visual highlighting.
// Complements table2.ts (row/column/filter ops) and extract.ts (getTableData).
//
// Deep table and data grid inspection functions (getTableSummary3, getTableFirstRow,
// getTableRowCount3, getSortableColumns, getTableCellByPosition, getColumnValues,
// getPaginationElements, getDataAttributes3) appended below existing exports.
import { CdpClient } from './client';

function _ok3(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function _err3(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * Extract the full table as an array of row objects keyed by header text.
 * Each row is a Record<headerText, cellText>. Headers are read from <th>
 * elements (thead first, then any th in the table). Rows come from <tbody>
 * or, if absent, from non-thead/tfoot <tr> rows.
 *
 * Named getFullTableData to avoid collision with getTableData in extract.ts.
 */
export async function getFullTableData(
  client: CdpClient,
  selector: string,
): Promise<Array<Record<string, string>>> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  // Collect header labels from thead th elements, fall back to all th elements.
  const thead = table.querySelector('thead');
  const headerEls = thead
    ? Array.from(thead.querySelectorAll('th'))
    : Array.from(table.querySelectorAll('th'));
  const headers = headerEls.map(h => h.textContent?.trim() ?? '');

  // Collect body rows.
  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
    const obj = {};
    headers.forEach((key, i) => {
      const k = key || String(i);
      obj[k] = cells[i] ?? '';
    });
    return obj;
  });
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${selector}`);
  }
  return result.value as Array<Record<string, string>>;
}

/**
 * Get a single row by 0-based index as a header→cell object.
 * Row index is relative to <tbody> rows (or non-header/footer rows).
 */
export async function getTableRowData(
  client: CdpClient,
  selector: string,
  rowIndex: number,
): Promise<Record<string, string>> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(rowIndex);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  const thead = table.querySelector('thead');
  const headerEls = thead
    ? Array.from(thead.querySelectorAll('th'))
    : Array.from(table.querySelectorAll('th'));
  const headers = headerEls.map(h => h.textContent?.trim() ?? '');

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const row = rows[${rIdx}];
  if (!row) return null;

  const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
  const obj = {};
  headers.forEach((key, i) => {
    const k = key || String(i);
    obj[k] = cells[i] ?? '';
  });
  return obj;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Row not found: table="${selector}", rowIndex=${rowIndex}`);
  }
  return result.value as Record<string, string>;
}

/**
 * Get the text content of a specific cell by 0-based row and column indices.
 * Row index is relative to <tbody> rows (or non-header/footer rows).
 */
export async function getTableCellText(
  client: CdpClient,
  selector: string,
  rowIndex: number,
  colIndex: number,
): Promise<string> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(rowIndex);
  const cIdx = Number(colIndex);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const row = rows[${rIdx}];
  if (!row) return null;

  const cell = Array.from(row.querySelectorAll('td'))[${cIdx}];
  if (!cell) return null;

  return cell.textContent?.trim() ?? '';
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(
      `Cell not found: table="${selector}", row=${rowIndex}, col=${colIndex}`,
    );
  }
  return result.value as string;
}

/**
 * Click the <th> at colIndex (0-based) to trigger a sort on sortable tables.
 * All <th> elements in the table are collected in document order; the one at
 * colIndex is clicked via Input.dispatchMouseEvent.
 */
export async function sortTableByColumn(
  client: CdpClient,
  selector: string,
  colIndex: number,
): Promise<void> {
  const sel = JSON.stringify(selector);
  const cIdx = Number(colIndex);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const headers = Array.from(table.querySelectorAll('th'));
  const th = headers[${cIdx}];
  if (!th) return null;
  const r = th.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Column header not found: table="${selector}", colIndex=${colIndex}`);
  }
  const { x, y } = result.value as { x: number; y: number };
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

/**
 * Return metadata about the table structure:
 * - rows: number of body rows
 * - cols: number of columns (max td count across body rows, or th count)
 * - hasHeader: whether a <thead> element (or any <th>) is present
 * - hasFoot: whether a <tfoot> element is present
 */
export async function getTablePageInfo(
  client: CdpClient,
  selector: string,
): Promise<{ rows: number; cols: number; hasHeader: boolean; hasFoot: boolean }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  const thead = table.querySelector('thead');
  const tfoot = table.querySelector('tfoot');
  const hasHeader = !!(thead || table.querySelector('th'));
  const hasFoot = !!tfoot;

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const rowCount = rows.length;

  // Determine column count: max td count across rows, or th count if no rows.
  let cols = Array.from(table.querySelectorAll('th')).length;
  for (const row of rows) {
    const tdCount = row.querySelectorAll('td').length;
    if (tdCount > cols) cols = tdCount;
  }

  return { rows: rowCount, cols, hasHeader, hasFoot };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${selector}`);
  }
  return result.value as { rows: number; cols: number; hasHeader: boolean; hasFoot: boolean };
}

/**
 * Convert a table to a CSV string. Headers become the first row.
 * Cells containing commas, double-quotes, or newlines are wrapped in double
 * quotes; internal double-quotes are escaped as "".
 */
export async function exportTableAsCsv(
  client: CdpClient,
  selector: string,
): Promise<string> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  function escapeCsv(val) {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\\n') || s.includes('\\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  const thead = table.querySelector('thead');
  const headerEls = thead
    ? Array.from(thead.querySelectorAll('th'))
    : Array.from(table.querySelectorAll('th'));
  const headers = headerEls.map(h => h.textContent?.trim() ?? '');

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const lines = [];

  if (headers.length > 0) {
    lines.push(headers.map(escapeCsv).join(','));
  }

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
    lines.push(cells.map(escapeCsv).join(','));
  }

  return lines.join('\\n');
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${selector}`);
  }
  return result.value as string;
}

/**
 * Return the 0-based indices of body rows that have a selected/active/checked
 * state, detected by any of:
 *   - class containing "selected" (case-insensitive)
 *   - aria-selected="true"
 *   - a checked <input> (checkbox/radio) inside the row
 */
export async function getSelectedTableRows(
  client: CdpClient,
  selector: string,
): Promise<number[]> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const selected = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasSelectedClass = Array.from(row.classList).some(c => c.toLowerCase().includes('selected'));
    const ariaSelected = row.getAttribute('aria-selected') === 'true';
    const hasCheckedInput = !!row.querySelector('input[type="checkbox"]:checked, input[type="radio"]:checked');
    if (hasSelectedClass || ariaSelected || hasCheckedInput) {
      selected.push(i);
    }
  }
  return selected;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${selector}`);
  }
  return result.value as number[];
}

/**
 * Add a background-color inline style to a specific body row (0-based index).
 * Defaults to 'rgba(255,255,0,0.3)' if color is not specified.
 * Does not affect thead or tfoot rows.
 */
export async function highlightTableRow(
  client: CdpClient,
  selector: string,
  rowIndex: number,
  color: string = 'rgba(255,255,0,0.3)',
): Promise<void> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(rowIndex);
  const clr = JSON.stringify(color);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return false;

  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });

  const row = rows[${rIdx}];
  if (!row) return false;

  row.style.backgroundColor = ${clr};
  return true;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === false) {
    throw new Error(`Row not found: table="${selector}", rowIndex=${rowIndex}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${selector}`);
  }
}

/**
 * getTableSummary3 — Get summary of all tables: id, caption, rows, cols,
 * hasHeader, hasFoot (max 10 tables).
 * Named getTableSummary3 to avoid collision with getTableSummary in table.ts.
 */
export async function getTableSummary3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('table')).slice(0,10).map(function(t) {
    return { id: t.id, caption: t.caption ? t.caption.textContent.trim().slice(0,50) : null, rows: t.rows.length, cols: t.rows[0] ? t.rows[0].cells.length : 0, hasHeader: !!t.querySelector('thead'), hasFoot: !!t.querySelector('tfoot') };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTableFirstRow — Get text content of first row cells for each table:
 * { tableIndex, cells }[] (max 5 tables, 20 cells each).
 */
export async function getTableFirstRow(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('table')).slice(0,5).map(function(t, i) {
    var row = t.rows[0];
    return { tableIndex: i, cells: row ? Array.from(row.cells).slice(0,20).map(function(c) { return c.textContent.trim().slice(0,50); }) : [] };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTableRowCount3 — Count rows per table including thead/tbody/tfoot:
 * tableIndex, totalRows, headerRows, bodyRows, footerRows (max 10 tables).
 * Named getTableRowCount3 to avoid collision with getTableRowCount in table.ts/table2.ts.
 */
export async function getTableRowCount3(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  return JSON.stringify(Array.from(document.querySelectorAll('table')).slice(0,10).map(function(t, i) {
    return { tableIndex: i, id: t.id, totalRows: t.rows.length, headerRows: t.querySelectorAll('thead tr').length, bodyRows: t.querySelectorAll('tbody tr').length, footerRows: t.querySelectorAll('tfoot tr').length };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getSortableColumns — Find th elements with role="columnheader" or aria-sort:
 * text, ariasort, tableIndex (max 20 results).
 */
export async function getSortableColumns(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('table').forEach(function(t, ti) {
    t.querySelectorAll('th[aria-sort],th[role="columnheader"]').forEach(function(th) {
      result.push({ text: th.textContent.trim().slice(0,40), ariasort: th.getAttribute('aria-sort'), tableIndex: ti });
    });
  });
  return JSON.stringify(result.slice(0,20));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTableCellByPosition — Get cell text at row/col position in the first
 * table matching selector.
 */
export async function getTableCellByPosition(
  client: CdpClient,
  selector: string,
  row: number,
  col: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var t = document.querySelector(${JSON.stringify(selector)});
  if (!t || t.tagName !== 'TABLE') return JSON.stringify({ found: false });
  var r = t.rows[${Number(row)}]; if (!r) return JSON.stringify({ found: false, reason: 'row out of bounds', rows: t.rows.length });
  var c = r.cells[${Number(col)}]; if (!c) return JSON.stringify({ found: false, reason: 'col out of bounds', cols: r.cells.length });
  return JSON.stringify({ found: true, text: c.textContent.trim(), html: c.innerHTML.slice(0,100), rowSpan: c.rowSpan, colSpan: c.colSpan });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getColumnValues — Extract all values from a specific column index in a
 * table (tbody rows only): { values, count } (max 50 values, 80 chars each).
 */
export async function getColumnValues(
  client: CdpClient,
  selector: string,
  colIndex: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var t = document.querySelector(${JSON.stringify(selector)});
  if (!t || t.tagName !== 'TABLE') return JSON.stringify({ found: false });
  var values = [];
  Array.from(t.querySelectorAll('tbody tr')).forEach(function(r) {
    var cell = r.cells[${Number(colIndex)}];
    if (cell) values.push(cell.textContent.trim().slice(0,80));
  });
  return JSON.stringify({ values: values.slice(0,50), count: values.length });
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getPaginationElements — Find pagination controls (aria-label containing
 * "page", or class containing "pagination"/"pager"): tag, id, class, links
 * (max 5 results).
 */
export async function getPaginationElements(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var result = [];
  document.querySelectorAll('[aria-label*="page" i],[class*="pagination" i],[class*="pager" i]').forEach(function(el) {
    if (result.length < 5) result.push({ tag: el.tagName.toLowerCase(), id: el.id, class: (el.className||'').slice(0,40), links: el.querySelectorAll('a,button').length });
  });
  return JSON.stringify(result);
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getDataAttributes3 — Get all data-* attributes across matching elements for
 * a selector (max 20 elements). Named getDataAttributes3 to avoid collision
 * with getDataAttributes in json2.ts.
 */
export async function getDataAttributes3(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `
(function() {
  var els = document.querySelectorAll(${JSON.stringify(selector)});
  return JSON.stringify(Array.from(els).slice(0,20).map(function(el) {
    var data = {};
    Array.from(el.attributes).forEach(function(a) { if (a.name.startsWith('data-')) data[a.name] = a.value.slice(0,50); });
    return { tag: el.tagName.toLowerCase(), id: el.id, data: data };
  }));
})()
`.trim(),
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return _err3(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    }
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return _err3(e instanceof Error ? e.message : String(e));
  }
}

/**
 * getTablePagination — Table pagination controls: [{tag, id, class_preview, currentPage, totalPages}] (max 10).
 */
export async function getTablePagination(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="pagination"],[class*="pager"],[aria-label*="pagination" i],[role="navigation"][aria-label*="page" i]';return Array.from(document.querySelectorAll(sel)).slice(0,10).map(el=>{const active=el.querySelector('[aria-current="page"],[class*="active"],[class*="current"]');return{tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),currentPage:active?(active.textContent||'').trim():null,totalPages:el.querySelectorAll('a,button,[role="button"]').length}}) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableSearch — Search inputs near tables: [{id, placeholder_preview, class_preview}] (max 10).
 */
export async function getTableSearch(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const inputs=Array.from(document.querySelectorAll('input[type="search"],input[placeholder*="search" i],input[placeholder*="filter" i],[class*="table-search"],[class*="grid-search"]'));return inputs.slice(0,10).map(el=>({id:el.id||null,placeholder_preview:(el.placeholder||'').slice(0,60),class_preview:(el.className||'').slice(0,40)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableExport — Export/download buttons near tables: [{tag, id, class_preview, text_preview}] (max 10).
 */
export async function getTableExport(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const kw=['export','download csv','download excel','download pdf','export csv','export excel'];return Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(el=>{const t=(el.textContent||'').toLowerCase().trim();return kw.some(k=>t.includes(k))}).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),text_preview:(el.textContent||'').trim().slice(0,60)})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableColumnWidths — Column widths of first table: [{header, width}] (max 20).
 */
export async function getTableColumnWidths(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const t=document.querySelector('table');if(!t)return[];const ths=Array.from(t.querySelectorAll('th'));return ths.slice(0,20).map(th=>({header:(th.textContent||'').trim().slice(0,40),width:getComputedStyle(th).width})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableRowSelection — Tables with row selection: [{id, class_preview, selectedCount, totalRows}] (max 10).
 */
export async function getTableRowSelection(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('table')).slice(0,10).map(t=>({id:t.id||null,class_preview:(t.className||'').slice(0,40),selectedCount:t.querySelectorAll('tr.selected,tr[aria-selected="true"],input[type="checkbox"]:checked').length,totalRows:t.querySelectorAll('tbody tr').length})).filter(r=>r.selectedCount>0||r.totalRows>0) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableExpandable — Tables with expandable rows: [{id, class_preview, expandableCount}] (max 10).
 */
export async function getTableExpandable(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return Array.from(document.querySelectorAll('table')).slice(0,10).map(t=>({id:t.id||null,class_preview:(t.className||'').slice(0,40),expandableCount:t.querySelectorAll('[aria-expanded],[class*="expand"],[class*="toggle-row"],[data-expand]').length})).filter(r=>r.expandableCount>0) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableFilters — Filter dropdowns/selects near tables: [{tag, id, class_preview, optionCount}] (max 20).
 */
export async function getTableFilters(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const sel='[class*="table-filter"],[class*="grid-filter"],[class*="column-filter"],[data-filter]';const byClass=Array.from(document.querySelectorAll(sel));const byType=Array.from(document.querySelectorAll('select')).filter(s=>{const p=s.closest('table,div,section');return p&&(p.querySelector('table')||p.tagName==='TABLE')});return [...byClass,...byType].slice(0,20).map(el=>({tag:el.tagName.toLowerCase(),id:el.id||null,class_preview:(el.className||'').toString().slice(0,40),optionCount:el.querySelectorAll('option').length})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

/**
 * getTableActions — Action buttons within table rows: [{text_preview, count}] (max 20).
 */
export async function getTableActions(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const actionBtns=Array.from(document.querySelectorAll('table tbody button,table tbody a[role="button"],table tbody [class*="action"]'));const groups={};actionBtns.forEach(el=>{const t=(el.textContent||'').trim().slice(0,30);groups[t]=(groups[t]||0)+1});return Object.entries(groups).slice(0,20).map(([text,count])=>({text_preview:text,count})) })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}
