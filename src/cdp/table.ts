// src/cdp/table.ts
// HTML table inspection tools via Chrome DevTools Protocol.
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: `Error: ${msg}` }] };
}

/**
 * Count all <table> elements on the page.
 * Returns JSON { count: number }.
 */
export async function getTableCount(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return document.querySelectorAll('table').length;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok({ count: result.value as number });
}

/**
 * Get all <th> text content from a table identified by selector.
 * Returns JSON { headers: string[] }.
 */
export async function getTableHeaders(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  return Array.from(table.querySelectorAll('th')).map(h => h.textContent?.trim() ?? '');
})()`,
    returnByValue: true,
    awaitPromise: false,
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
 * Count <tr> elements in a table identified by selector.
 * Returns JSON { rows: number }.
 */
export async function getTableRowCount(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  return table.querySelectorAll('tr').length;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok({ rows: result.value as number });
}

/**
 * Count total <td> + <th> cells in a table identified by selector.
 * Returns JSON { cells: number }.
 */
export async function getTableCellCount(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const tds = table.querySelectorAll('td').length;
  const ths = table.querySelectorAll('th').length;
  return tds + ths;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok({ cells: result.value as number });
}

/**
 * Get all cell text values from a row at 0-based row_index.
 * Uses table.rows[row_index] and iterates cells.
 * Returns JSON { row: string[] } or error if out of bounds.
 */
export async function getTableRow(
  client: CdpClient,
  selector: string,
  row_index: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const idx = Number(row_index);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return { error: 'Table not found' };
  const row = table.rows[${idx}];
  if (!row) return { error: 'Row index out of bounds: ' + ${idx} };
  const cells = [];
  for (let i = 0; i < row.cells.length; i++) {
    cells.push(row.cells[i].textContent?.trim() ?? '');
  }
  return { row: cells };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as { error?: string; row?: string[] };
  if (val && val.error) {
    return err(val.error);
  }
  return ok({ row: val.row });
}

/**
 * Get text of a single cell at [row_index][col_index] (both 0-based).
 * Returns JSON { text: string } or error if out of bounds.
 */
export async function getTableCell(
  client: CdpClient,
  selector: string,
  row_index: number,
  col_index: number,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const rIdx = Number(row_index);
  const cIdx = Number(col_index);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return { error: 'Table not found' };
  const row = table.rows[${rIdx}];
  if (!row) return { error: 'Row index out of bounds: ' + ${rIdx} };
  const cell = row.cells[${cIdx}];
  if (!cell) return { error: 'Col index out of bounds: ' + ${cIdx} };
  return { text: cell.textContent?.trim() ?? '' };
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  const val = result.value as { error?: string; text?: string };
  if (val && val.error) {
    return err(val.error);
  }
  return ok({ text: val.text });
}

/**
 * Dump all table data as a 2D array (max 50 rows).
 * Returns JSON { data: string[][] } where each inner array is a row of cell text values.
 */
export async function getTableData(
  client: CdpClient,
  selector: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const sel = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const table = document.querySelector(${sel});
  if (!table) return null;
  const data = [];
  const limit = Math.min(table.rows.length, 50);
  for (let r = 0; r < limit; r++) {
    const row = table.rows[r];
    const cells = [];
    for (let c = 0; c < row.cells.length; c++) {
      cells.push(row.cells[c].textContent?.trim() ?? '');
    }
    data.push(cells);
  }
  return data;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  if (result.value === null || result.value === undefined) {
    return err(`Table not found: ${selector}`);
  }
  return ok({ data: result.value as string[][] });
}

/**
 * Summarize all tables on the page (max 10 tables).
 * For each table returns { index, rows, cols, hasHeader, id, class }.
 */
export async function getTableSummary(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const tables = Array.from(document.querySelectorAll('table'));
  const limit = Math.min(tables.length, 10);
  const summaries = [];
  for (let i = 0; i < limit; i++) {
    const table = tables[i];
    const rows = table.rows.length;
    const cols = rows > 0 ? table.rows[0].cells.length : 0;
    const hasHeader = table.querySelector('th') !== null;
    summaries.push({
      index: i,
      rows: rows,
      cols: cols,
      hasHeader: hasHeader,
      id: table.id ?? '',
      class: table.className ?? '',
    });
  }
  return summaries;
})()`,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) {
    return err(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return ok(result.value);
}
