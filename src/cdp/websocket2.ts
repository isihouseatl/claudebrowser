// src/cdp/websocket2.ts
import type { CdpClient } from './client';

type ToolResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): ToolResult {
  return { content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. Inject a WebSocket constructor patch that records connections to window.__wsMonitor
export async function injectWsMonitor(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (() => {
      if (window.__wsMonitor) return 'already-injected';
      window.__wsMonitor = { connections: [] };
      const OriginalWS = window.WebSocket;
      function PatchedWS(url, protocols) {
        var ws = protocols !== undefined ? new OriginalWS(url, protocols) : new OriginalWS(url);
        var entry = {
          url: url,
          readyState: ws.readyState,
          messageCount: 0,
          messages: [],
          _ws: ws
        };
        window.__wsMonitor.connections.push(entry);
        ws.addEventListener('open', function() { entry.readyState = ws.readyState; });
        ws.addEventListener('close', function() { entry.readyState = ws.readyState; });
        ws.addEventListener('message', function(e) {
          entry.readyState = ws.readyState;
          entry.messageCount++;
          entry.messages.push({ data: typeof e.data === 'string' ? e.data : '[binary]', ts: Date.now(), dir: 'received' });
          if (entry.messages.length > 50) entry.messages.shift();
        });
        var origSend = ws.send.bind(ws);
        ws.send = function(data) {
          entry.messageCount++;
          entry.messages.push({ data: typeof data === 'string' ? data : '[binary]', ts: Date.now(), dir: 'sent' });
          if (entry.messages.length > 50) entry.messages.shift();
          return origSend(data);
        };
        return ws;
      }
      PatchedWS.prototype = OriginalWS.prototype;
      PatchedWS.CONNECTING = OriginalWS.CONNECTING;
      PatchedWS.OPEN = OriginalWS.OPEN;
      PatchedWS.CLOSING = OriginalWS.CLOSING;
      PatchedWS.CLOSED = OriginalWS.CLOSED;
      window.WebSocket = PatchedWS;
      return 'injected';
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  return ok({ injected: true, status: result.value });
}

// 2. Get all WebSocket connections tracked by the monitor: url, readyState, messageCount
export async function getWsConnections(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (() => {
      if (!window.__wsMonitor) return null;
      return window.__wsMonitor.connections.map(function(c) {
        return { url: c.url, readyState: c.readyState, messageCount: c.messageCount };
      });
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  if (result.value === null) return err('wsMonitor not injected. Call injectWsMonitor first.');
  return ok(result.value);
}

// 3. Get messages for a specific WebSocket URL (or all if no url given), max 50
export async function getWsMessages(client: CdpClient, url?: string): Promise<ToolResult> {
  const urlExpr = url ? JSON.stringify(url) : 'null';
  const expression = `
    (() => {
      if (!window.__wsMonitor) return null;
      var connections = window.__wsMonitor.connections;
      var targetUrl = ${urlExpr};
      var results = [];
      for (var i = 0; i < connections.length; i++) {
        if (targetUrl === null || connections[i].url === targetUrl) {
          var msgs = connections[i].messages.slice(-50);
          for (var j = 0; j < msgs.length; j++) {
            results.push({ url: connections[i].url, data: msgs[j].data, dir: msgs[j].dir, ts: msgs[j].ts });
          }
        }
      }
      return results;
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  if (result.value === null) return err('wsMonitor not injected. Call injectWsMonitor first.');
  return ok(result.value);
}

// 4. Clear all tracked WebSocket data from window.__wsMonitor
export async function clearWsMonitor(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (() => {
      if (!window.__wsMonitor) return false;
      window.__wsMonitor.connections = [];
      return true;
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  if (result.value === false) return err('wsMonitor not injected. Call injectWsMonitor first.');
  return ok({ cleared: true });
}

// 5. Check if WebSocket is supported and if monitor is injected
export async function getWsStatus(client: CdpClient): Promise<ToolResult> {
  const expression = `
    (() => {
      return {
        supported: typeof WebSocket !== 'undefined',
        monitorInjected: !!(window.__wsMonitor),
        connectionCount: window.__wsMonitor ? window.__wsMonitor.connections.length : 0
      };
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  return ok(result.value);
}

// 6. Send a message through an open WebSocket by URL (finds it in window.__wsMonitor)
export async function sendWsMessage(client: CdpClient, url: string, message: string): Promise<ToolResult> {
  const expression = `
    (() => {
      if (!window.__wsMonitor) return { sent: false, reason: 'monitor-not-injected' };
      var connections = window.__wsMonitor.connections;
      for (var i = 0; i < connections.length; i++) {
        if (connections[i].url === ${JSON.stringify(url)} && connections[i].readyState === 1) {
          connections[i]._ws.send(${JSON.stringify(message)});
          return { sent: true, url: connections[i].url };
        }
      }
      return { sent: false, reason: 'no-open-connection-found', url: ${JSON.stringify(url)} };
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  const val = result.value as { sent: boolean; reason?: string; url?: string };
  if (!val.sent) return err(val.reason ?? 'send failed');
  return ok(val);
}

// 7. Close a WebSocket by URL
export async function closeWsConnection(client: CdpClient, url: string): Promise<ToolResult> {
  const expression = `
    (() => {
      if (!window.__wsMonitor) return { closed: false, reason: 'monitor-not-injected' };
      var connections = window.__wsMonitor.connections;
      for (var i = 0; i < connections.length; i++) {
        if (connections[i].url === ${JSON.stringify(url)}) {
          var rs = connections[i].readyState;
          if (rs === 2 || rs === 3) {
            return { closed: false, reason: 'already-closing-or-closed', readyState: rs };
          }
          connections[i]._ws.close();
          return { closed: true, url: connections[i].url };
        }
      }
      return { closed: false, reason: 'connection-not-found', url: ${JSON.stringify(url)} };
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  const val = result.value as { closed: boolean; reason?: string; url?: string; readyState?: number };
  if (!val.closed) return err(val.reason ?? 'close failed');
  return ok(val);
}

// 8. Get readyState of a specific WebSocket connection (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
export async function getWsReadyState(client: CdpClient, url: string): Promise<ToolResult> {
  const expression = `
    (() => {
      if (!window.__wsMonitor) return null;
      var connections = window.__wsMonitor.connections;
      for (var i = 0; i < connections.length; i++) {
        if (connections[i].url === ${JSON.stringify(url)}) {
          var rs = connections[i].readyState;
          var label = ['CONNECTING','OPEN','CLOSING','CLOSED'][rs] || 'UNKNOWN';
          return { url: connections[i].url, readyState: rs, label: label };
        }
      }
      return { url: ${JSON.stringify(url)}, readyState: null, label: 'NOT_FOUND' };
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({ expression, returnByValue: true });
  if (exceptionDetails) return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'unknown error');
  if (result.value === null) return err('wsMonitor not injected. Call injectWsMonitor first.');
  return ok(result.value);
}
