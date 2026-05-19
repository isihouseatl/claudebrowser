// src/cdp/table4.ts
import type { CdpClient } from './client';

function ok(data: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }; }
function err(msg: string) { return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] }; }

// 1. getTableHeaders4 — all <thead> and <th> elements: text, colspan, rowspan, scope, tableIndex (max 30)
export async function getTableHeaders4(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var headers = [];
        for (var ti = 0; ti < tables.length && headers.length < 30; ti++) {
          var ths = tables[ti].querySelectorAll('th');
          for (var i = 0; i < ths.length && headers.length < 30; i++) {
            var th = ths[i];
            headers.push({
              text: (th.textContent || '').trim(),
              colspan: th.colSpan || 1,
              rowspan: th.rowSpan || 1,
              scope: th.getAttribute('scope') || '',
              tableIndex: ti
            });
          }
        }
        return JSON.stringify(headers);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. getTableFooters — all <tfoot> elements and their cells: text, tableIndex (max 20)
export async function getTableFooters(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var footers = [];
        for (var ti = 0; ti < tables.length && footers.length < 20; ti++) {
          var tfoots = tables[ti].querySelectorAll('tfoot');
          for (var fi = 0; fi < tfoots.length && footers.length < 20; fi++) {
            var cells = tfoots[fi].querySelectorAll('td, th');
            var cellTexts = [];
            for (var ci = 0; ci < cells.length; ci++) {
              cellTexts.push((cells[ci].textContent || '').trim());
            }
            footers.push({
              tableIndex: ti,
              footerIndex: fi,
              cells: cellTexts,
              rowCount: tfoots[fi].querySelectorAll('tr').length
            });
          }
        }
        return JSON.stringify(footers);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. getTableCaption — all <caption> elements: text, tableIndex (max 10)
export async function getTableCaption(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var captions = [];
        for (var ti = 0; ti < tables.length && captions.length < 10; ti++) {
          var cap = tables[ti].querySelector('caption');
          if (cap) {
            captions.push({
              text: (cap.textContent || '').trim(),
              tableIndex: ti
            });
          }
        }
        return JSON.stringify(captions);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. getNestedTables — tables inside tables: outer selector, depth, innerTableCount (max 10)
export async function getNestedTables(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        function getDepth(el) {
          var depth = 0;
          var cur = el.parentElement;
          while (cur) {
            if (cur.tagName === 'TABLE') depth++;
            cur = cur.parentElement;
          }
          return depth;
        }
        function getSelector(el) {
          var parts = [];
          var cur = el;
          while (cur && cur !== document.body) {
            var tag = cur.tagName.toLowerCase();
            var id = cur.getAttribute('id');
            if (id) { parts.unshift('#' + id); break; }
            var idx = 1;
            var sib = cur.previousElementSibling;
            while (sib) { if (sib.tagName === cur.tagName) idx++; sib = sib.previousElementSibling; }
            parts.unshift(tag + (idx > 1 ? ':nth-of-type(' + idx + ')' : ''));
            cur = cur.parentElement;
          }
          return parts.join(' > ');
        }
        var all = document.querySelectorAll('table');
        var nested = [];
        for (var i = 0; i < all.length && nested.length < 10; i++) {
          var depth = getDepth(all[i]);
          if (depth > 0) {
            var inner = all[i].querySelectorAll('table');
            nested.push({
              outerSelector: getSelector(all[i]),
              depth: depth,
              innerTableCount: inner.length
            });
          }
        }
        return JSON.stringify(nested);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. getDataGrid4 — elements with role="grid" or role="treegrid": id, class, rowCount (max 10)
export async function getDataGrid4(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var grids = document.querySelectorAll('[role="grid"], [role="treegrid"]');
        var result = [];
        for (var i = 0; i < grids.length && i < 10; i++) {
          var g = grids[i];
          var rows = g.querySelectorAll('[role="row"]');
          result.push({
            role: g.getAttribute('role') || '',
            id: g.getAttribute('id') || '',
            className: g.getAttribute('class') || '',
            rowCount: rows.length,
            label: g.getAttribute('aria-label') || g.getAttribute('aria-labelledby') || ''
          });
        }
        return JSON.stringify(result);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. getTableLinks — all <a> elements inside <table>: href, text, tableIndex (max 30)
export async function getTableLinks(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var links = [];
        for (var ti = 0; ti < tables.length && links.length < 30; ti++) {
          var anchors = tables[ti].querySelectorAll('a');
          for (var i = 0; i < anchors.length && links.length < 30; i++) {
            var a = anchors[i];
            links.push({
              href: a.getAttribute('href') || '',
              text: (a.textContent || '').trim(),
              tableIndex: ti
            });
          }
        }
        return JSON.stringify(links);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. getTableButtons — all <button> elements inside <table>: text, type, tableIndex (max 30)
export async function getTableButtons(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var buttons = [];
        for (var ti = 0; ti < tables.length && buttons.length < 30; ti++) {
          var btns = tables[ti].querySelectorAll('button');
          for (var i = 0; i < btns.length && buttons.length < 30; i++) {
            var b = btns[i];
            buttons.push({
              text: (b.textContent || '').trim(),
              type: b.getAttribute('type') || 'button',
              disabled: b.disabled || false,
              tableIndex: ti
            });
          }
        }
        return JSON.stringify(buttons);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. getTableCheckboxes — all <input type="checkbox"> inside <table>: id, name, checked, tableIndex (max 20)
export async function getTableCheckboxes(client: CdpClient) {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `(function() {
        var tables = document.querySelectorAll('table');
        var checkboxes = [];
        for (var ti = 0; ti < tables.length && checkboxes.length < 20; ti++) {
          var inputs = tables[ti].querySelectorAll('input[type="checkbox"]');
          for (var i = 0; i < inputs.length && checkboxes.length < 20; i++) {
            var inp = inputs[i];
            checkboxes.push({
              id: inp.getAttribute('id') || '',
              name: inp.getAttribute('name') || '',
              checked: inp.checked || false,
              value: inp.getAttribute('value') || '',
              tableIndex: ti
            });
          }
        }
        return JSON.stringify(checkboxes);
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) return err(exceptionDetails.text ?? JSON.stringify(exceptionDetails));
    const data = JSON.parse(result.value as string);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
