// src/cdp/table2.ts
// Rich table interaction helpers for dynamic/sortable/filterable tables in SPAs.
// Complements the static getTableData in extract.ts.
// Also contains 8 HTML table inspection functions (getTables, getTableHeaders2, etc.)
import { CdpClient } from './client';

// --- MCP content helpers (used by inspection functions only) ---
function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

export interface TableRow {
  rowIndex: number;
  cells: string[];
}

// Helper: dispatch a mouse click at the center of an element returned by a
// Runtime.evaluate expression that resolves to an {x, y} object.
async function clickXY(client: CdpClient, x: number, y: number): Promise<void> {
  await client.raw.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.raw.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

/**
 * Click the <th> inside the table whose text content contains `columnName`
 * (case-insensitive). Triggers sort on sortable tables.
 */
export async function clickTableHeader(
  client: CdpClient,
  tableSelector: string,
  columnName: string,
): Promise<void> {
  const sel = JSON.stringify(tableSelector);
  const col = JSON.stringify(columnName.toLowerCase());
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const headers = Array.from(table.querySelectorAll('th'));
  const th = headers.find(h => (h.textContent ?? '').toLowerCase().includes(${col}));
  if (!th) return null;
  const r = th.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table header not found: table="${tableSelector}", column="${columnName}"`);
  }
  const { x, y } = result.value as { x: number; y: number };
  await clickXY(client, x, y);
}

/**
 * Return the number of <tbody tr> rows in the table.
 */
export async function getTableRowCount(
  client: CdpClient,
  tableSelector: string,
): Promise<number> {
  const sel = JSON.stringify(tableSelector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const tbody = table.querySelector('tbody');
  if (tbody) return tbody.querySelectorAll('tr').length;
  // Fallback: all tr elements that are not inside thead/tfoot
  return Array.from(table.querySelectorAll('tr')).filter(r => {
    const parent = r.parentElement;
    return parent && parent.tagName !== 'THEAD' && parent.tagName !== 'TFOOT';
  }).length;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${tableSelector}`);
  }
  return result.value as number;
}

/**
 * Return all values in the column at `columnIndex` (0-based) from <td> cells.
 */
export async function getTableColumnValues(
  client: CdpClient,
  tableSelector: string,
  columnIndex: number,
): Promise<string[]> {
  const sel = JSON.stringify(tableSelector);
  const idx = Number(columnIndex);
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
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    return cells[${idx}]?.textContent?.trim() ?? '';
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${tableSelector}`);
  }
  return result.value as string[];
}

/**
 * Find the first row containing `searchText` in any cell (case-insensitive).
 * Returns { rowIndex, cells } or null if not found.
 */
export async function findTableRow(
  client: CdpClient,
  tableSelector: string,
  searchText: string,
): Promise<TableRow | null> {
  const sel = JSON.stringify(tableSelector);
  const text = JSON.stringify(searchText.toLowerCase());
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
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
    if (cells.some(c => c.toLowerCase().includes(${text}))) {
      return { rowIndex: i, cells };
    }
  }
  return null;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? null) as TableRow | null;
}

/**
 * Click the <td> cell at `rowIndex` (0-based) and `columnIndex` (0-based).
 * Row index is relative to <tbody> rows (or non-header/footer rows).
 */
export async function clickTableCell(
  client: CdpClient,
  tableSelector: string,
  rowIndex: number,
  columnIndex: number,
): Promise<void> {
  const sel = JSON.stringify(tableSelector);
  const rIdx = Number(rowIndex);
  const cIdx = Number(columnIndex);
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
  const cell = row.querySelectorAll('td')[${cIdx}];
  if (!cell) return null;
  const r = cell.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(
      `Cell not found: table="${tableSelector}", row=${rowIndex}, col=${columnIndex}`,
    );
  }
  const { x, y } = result.value as { x: number; y: number };
  await clickXY(client, x, y);
}

/**
 * Get all values in the named column. Finds the column index by matching
 * a <th> whose text contains `columnName` (case-insensitive), then returns
 * all <td> values at that index from body rows.
 */
export async function getTableColumn(
  client: CdpClient,
  tableSelector: string,
  columnName: string,
): Promise<string[]> {
  const sel = JSON.stringify(tableSelector);
  const col = JSON.stringify(columnName.toLowerCase());
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const headers = Array.from(table.querySelectorAll('th'));
  const colIdx = headers.findIndex(h => (h.textContent ?? '').toLowerCase().includes(${col}));
  if (colIdx === -1) return null;
  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    return cells[colIdx]?.textContent?.trim() ?? '';
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(
      `Column not found: table="${tableSelector}", column="${columnName}"`,
    );
  }
  return result.value as string[];
}

/**
 * Return all <th> text values in the table header row(s).
 */
export async function getTableHeaders(
  client: CdpClient,
  tableSelector: string,
): Promise<string[]> {
  const sel = JSON.stringify(tableSelector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  return Array.from(table.querySelectorAll('th')).map(h => h.textContent?.trim() ?? '');
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${tableSelector}`);
  }
  return result.value as string[];
}

/**
 * Return all rows where the cell at `columnIndex` contains `matchText`
 * (case-insensitive). Returns an array of { rowIndex, cells }.
 */
export async function filterTableRows(
  client: CdpClient,
  tableSelector: string,
  columnIndex: number,
  matchText: string,
): Promise<TableRow[]> {
  const sel = JSON.stringify(tableSelector);
  const idx = Number(columnIndex);
  const text = JSON.stringify(matchText.toLowerCase());
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
  const matched = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
    const cellText = (cells[${idx}] ?? '').toLowerCase();
    if (cellText.includes(${text})) {
      matched.push({ rowIndex: i, cells });
    }
  }
  return matched;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    throw new Error(`Table not found: ${tableSelector}`);
  }
  return result.value as TableRow[];
}

// =============================================================================
// HTML Table Inspection Functions (8 exported async functions)
// =============================================================================

/**
 * Find all <table> elements on the page and return structural metadata.
 * Returns up to 10 tables. Each entry includes:
 *   id, class, rowCount, columnCount, hasHeader, hasFooter, caption
 */
export async function getTables(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const tables = Array.from(document.querySelectorAll('table'));
  const limit = Math.min(tables.length, 10);
  const out = [];
  for (let i = 0; i < limit; i++) {
    const t = tables[i];
    const thead = t.querySelector('thead');
    const tfoot = t.querySelector('tfoot');
    const captionEl = t.querySelector('caption');
    const tbody = t.querySelector('tbody');
    const bodyRows = tbody
      ? Array.from(tbody.querySelectorAll('tr'))
      : Array.from(t.querySelectorAll('tr')).filter(r => {
          const p = r.parentElement;
          return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
        });
    const headerRows = thead ? Array.from(thead.querySelectorAll('tr')) : [];
    const footerRows = tfoot ? Array.from(tfoot.querySelectorAll('tr')) : [];
    const totalRows = headerRows.length + bodyRows.length + footerRows.length;
    // Column count: max cells in any row
    let colCount = 0;
    const allRows = Array.from(t.querySelectorAll('tr'));
    for (const row of allRows) {
      const cells = row.querySelectorAll('td, th').length;
      if (cells > colCount) colCount = cells;
    }
    out.push({
      id: t.id || null,
      class: t.className || null,
      rowCount: totalRows,
      columnCount: colCount,
      hasHeader: !!(thead || t.querySelector('th')),
      hasFooter: !!tfoot,
      caption: captionEl ? (captionEl.textContent || '').trim() : null,
    });
  }
  return out;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Get all <th> text content from a specific table.
 * Returns { headers: string[] }
 * (Renamed from getTableHeaders to avoid conflict with existing export.)
 */
export async function getTableHeaders2(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  return Array.from(table.querySelectorAll('th')).map(h => (h.textContent || '').trim());
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok({ headers: result.value as string[] });
}

/**
 * Get all cell text values from a specific row (0-indexed).
 * Returns { cells: string[] }
 * (Renamed from getTableRow to avoid conflict with table.ts export.)
 */
export async function getTableRow2(
  client: CdpClient,
  selector: string,
  rowIndex: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(rowIndex);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return { error: 'Table not found' };
  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });
  const row = rows[${rIdx}];
  if (!row) return { error: 'Row index out of bounds: ' + ${rIdx} };
  const cells = Array.from(row.querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
  return { cells };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as { error?: string; cells?: string[] } | null;
  if (!val) return err(`Table not found: ${selector}`);
  if (val.error) return err(val.error);
  return ok({ cells: val.cells });
}

/**
 * Get the full table as a 2D array of cell text values (max 20 rows × 20 columns).
 * Returns { headers: string[], rows: string[][] }
 * (Renamed from getTableData to avoid conflict with extract.ts and table.ts exports.)
 */
export async function getTableData3(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  // Headers
  const thead = table.querySelector('thead');
  const headerEls = thead
    ? Array.from(thead.querySelectorAll('th'))
    : Array.from(table.querySelectorAll('th'));
  const headers = headerEls.slice(0, 20).map(h => (h.textContent || '').trim());
  // Body rows
  const tbody = table.querySelector('tbody');
  const allRows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });
  const rows = allRows.slice(0, 20).map(row =>
    Array.from(row.querySelectorAll('td')).slice(0, 20).map(c => (c.textContent || '').trim())
  );
  return { headers, rows };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok(result.value);
}

/**
 * Get text content of a specific cell by row and column indices (both 0-indexed).
 * Row index is relative to <tbody> rows.
 * Returns { value: string }
 */
export async function getTableCellValue(
  client: CdpClient,
  selector: string,
  row: number,
  col: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(row);
  const cIdx = Number(col);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return { error: 'Table not found' };
  const tbody = table.querySelector('tbody');
  const rows = tbody
    ? Array.from(tbody.querySelectorAll('tr'))
    : Array.from(table.querySelectorAll('tr')).filter(r => {
        const p = r.parentElement;
        return p && p.tagName !== 'THEAD' && p.tagName !== 'TFOOT';
      });
  const row = rows[${rIdx}];
  if (!row) return { error: 'Row index out of bounds: ' + ${rIdx} };
  const cells = Array.from(row.querySelectorAll('td'));
  const cell = cells[${cIdx}];
  if (!cell) return { error: 'Column index out of bounds: ' + ${cIdx} };
  return { value: (cell.textContent || '').trim() };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as { error?: string; value?: string } | null;
  if (!val) return err(`Table not found: ${selector}`);
  if (val.error) return err(val.error);
  return ok({ value: val.value });
}

/**
 * Find rows where column colIndex contains query (case-insensitive).
 * Returns matching row indices and cell values. Max 20 results.
 */
export async function searchTableColumn(
  client: CdpClient,
  selector: string,
  colIndex: number,
  query: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const cIdx = Number(colIndex);
  const q = JSON.stringify(query.toLowerCase());
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
  const matches = [];
  for (let i = 0; i < rows.length && matches.length < 20; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map(c => (c.textContent || '').trim());
    const cellText = (cells[${cIdx}] || '').toLowerCase();
    if (cellText.includes(${q})) {
      matches.push({ rowIndex: i, cells });
    }
  }
  return matches;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok(result.value);
}

/**
 * Return counts of table structural features across all tables on the page.
 * Returns { total, withCaption, withHeader, withFooter, sortable }
 * Sortable = has aria-sort on any header cell.
 * (Renamed from getTableCount to avoid conflict with table.ts export.)
 */
export async function getTableCount2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const tables = Array.from(document.querySelectorAll('table'));
  let withCaption = 0, withHeader = 0, withFooter = 0, sortable = 0;
  for (const t of tables) {
    if (t.querySelector('caption')) withCaption++;
    if (t.querySelector('thead') || t.querySelector('th')) withHeader++;
    if (t.querySelector('tfoot')) withFooter++;
    if (t.querySelector('[aria-sort]')) sortable++;
  }
  return { total: tables.length, withCaption, withHeader, withFooter, sortable };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}

/**
 * Find elements with role="grid" or role="treegrid" ARIA roles.
 * Returns up to 10 results: { tag, id, class, rowCount, colCount }
 */
export async function getDataGridInfo(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const grids = Array.from(document.querySelectorAll('[role="grid"], [role="treegrid"]'));
  const limit = Math.min(grids.length, 10);
  const out = [];
  for (let i = 0; i < limit; i++) {
    const g = grids[i];
    // Count rows: elements with role="row"
    const rowEls = g.querySelectorAll('[role="row"]');
    // Count cols: gridcell/columnheader in first row
    const firstRow = g.querySelector('[role="row"]');
    const colEls = firstRow
      ? firstRow.querySelectorAll('[role="gridcell"], [role="columnheader"]')
      : { length: 0 };
    out.push({
      tag: g.tagName.toLowerCase(),
      id: g.id || null,
      class: g.className || null,
      rowCount: rowEls.length,
      colCount: colEls.length,
    });
  }
  return out;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}
