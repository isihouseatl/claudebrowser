// src/cdp/table2.ts
// Rich table interaction helpers for dynamic/sortable/filterable tables in SPAs.
// Complements the static getTableData in extract.ts.
import { CdpClient } from './client';

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
