// src/cdp/table3.ts
// Advanced HTML table interaction module — structural extraction, CSV export,
// row selection detection, sort triggering, and visual highlighting.
// Complements table2.ts (row/column/filter ops) and extract.ts (getTableData).
import { CdpClient } from './client';

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
