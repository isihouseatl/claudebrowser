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
// 1. Detect active WebSocket connections via constructor patching
export async function getWebSocketConnections2(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      // Check if our patch is already applied
      if (window.__wsConnections) {
        var conns = window.__wsConnections;
        for (var i = 0; i < Math.min(conns.length, 20); i++) {
          results.push({
            url: conns[i].url,
            readyState: conns[i].readyState,
            readyStateLabel: ['CONNECTING','OPEN','CLOSING','CLOSED'][conns[i].readyState] || 'UNKNOWN',
            protocol: conns[i].protocol || '',
            openedAt: conns[i].openedAt
          });
        }
        return { patched: true, connections: results };
      }
      // Patch WebSocket constructor to track future connections
      if (typeof WebSocket === 'undefined') {
        return { patched: false, connections: [], reason: 'WebSocket not available' };
      }
      window.__wsConnections = [];
      var _OrigWS = window.WebSocket;
      function _PatchedWS(url, protocols) {
        var ws = protocols !== undefined ? new _OrigWS(url, protocols) : new _OrigWS(url);
        var entry = { url: url, readyState: ws.readyState, protocol: '', openedAt: Date.now() };
        window.__wsConnections.push(entry);
        ws.addEventListener('open', function() { entry.readyState = ws.readyState; entry.protocol = ws.protocol; });
        ws.addEventListener('close', function() { entry.readyState = ws.readyState; });
        ws.addEventListener('error', function() { entry.readyState = ws.readyState; });
        return ws;
      }
      _PatchedWS.prototype = _OrigWS.prototype;
      _PatchedWS.CONNECTING = _OrigWS.CONNECTING;
      _PatchedWS.OPEN = _OrigWS.OPEN;
      _PatchedWS.CLOSING = _OrigWS.CLOSING;
      _PatchedWS.CLOSED = _OrigWS.CLOSED;
      window.WebSocket = _PatchedWS;
      return { patched: true, connections: [], note: 'Patch injected. New connections will be tracked.' };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 2. Summary of real-time connection state
export async function getWebSocketState(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var hasWebSocket = typeof WebSocket !== 'undefined';
      var connectionCount = window.__wsConnections ? window.__wsConnections.length : 0;
      var openCount = window.__wsConnections
        ? window.__wsConnections.filter(function(c) { return c.readyState === 1; }).length
        : 0;
      // Detect Socket.io
      var hasSocketIo = !!(
        window.io ||
        window.Socket ||
        window.__socket_io ||
        (typeof window.io === 'function')
      );
      // Detect SockJS
      var hasSockJs = !!(
        window.SockJS ||
        window.sockjs ||
        document.querySelector('script[src*="sockjs"]')
      );
      // Detect SignalR
      var hasSignalR = !!(
        window.signalR ||
        window.$.connection ||
        document.querySelector('script[src*="signalr"]') ||
        document.querySelector('script[src*="signalR"]')
      );
      return {
        hasWebSocket: hasWebSocket,
        connectionCount: connectionCount,
        openCount: openCount,
        hasSocketIo: hasSocketIo,
        hasSockJs: hasSockJs,
        hasSignalR: hasSignalR
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 3. UI elements likely bound to real-time updates (live scores, chat, feeds)
export async function getRealtimeElements(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var realtimeSelectors = [
        '[data-realtime]', '[data-live]', '[data-stream]', '[data-feed]',
        '[data-socket]', '[data-ws]', '[data-websocket]', '[data-channel]',
        '[data-subscription]', '[data-poll]', '[data-auto-update]',
        '[data-live-update]', '[data-live-score]', '[data-ticker]',
        '.live', '.live-update', '.live-feed', '.live-chat', '.live-score',
        '.realtime', '.real-time', '.streaming', '.ticker', '.feed',
        '.chat-messages', '.message-list', '.score-board', '.activity-feed',
        '[aria-live]', '[aria-atomic]'
      ];
      var seen = new Set();
      for (var i = 0; i < realtimeSelectors.length; i++) {
        var els = document.querySelectorAll(realtimeSelectors[i]);
        for (var j = 0; j < els.length && results.length < 20; j++) {
          var el = els[j];
          if (seen.has(el)) continue;
          seen.add(el);
          var rect = el.getBoundingClientRect();
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: el.className ? String(el.className).trim().slice(0, 60) : null,
            matchedSelector: realtimeSelectors[i],
            ariaLive: el.getAttribute('aria-live') || null,
            textPreview: (el.textContent || '').trim().slice(0, 80),
            visible: rect.width > 0 && rect.height > 0
          });
        }
      }
      return results;
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 4. Detect Socket.io usage on the page
export async function getSocketIoElements(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var detected = [];
      // Global io object
      if (typeof window.io === 'function' || typeof window.io === 'object') {
        var info = { source: 'window.io', type: typeof window.io };
        if (window.io && window.io.sockets) {
          var sockets = window.io.sockets;
          info.socketCount = typeof sockets === 'object' ? Object.keys(sockets).length : 0;
        }
        detected.push(info);
      }
      // Script tags loading socket.io
      var scripts = document.querySelectorAll('script[src]');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('socket.io') !== -1 || src.indexOf('socket-io') !== -1) {
          detected.push({ source: 'script-tag', src: src });
        }
      }
      // Inline scripts referencing socket.io
      var inlineScripts = document.querySelectorAll('script:not([src])');
      var ioPatterns = ['socket.io', 'io.connect(', 'io.on(', "require('socket.io")];
      for (var k = 0; k < Math.min(inlineScripts.length, 20); k++) {
        var content = inlineScripts[k].textContent || '';
        for (var p = 0; p < ioPatterns.length; p++) {
          if (content.indexOf(ioPatterns[p]) !== -1) {
            detected.push({
              source: 'inline-script',
              pattern: ioPatterns[p],
              preview: content.slice(Math.max(0, content.indexOf(ioPatterns[p]) - 20), content.indexOf(ioPatterns[p]) + 60)
            });
            break;
          }
        }
      }
      return { hasSocketIo: detected.length > 0, detections: detected.slice(0, 20) };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 5. Detect WebSocket message handlers across the page
export async function getWebSocketMessages2(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var patterns = [];
      // Check tracked connections for message counts
      if (window.__wsConnections) {
        var conns = window.__wsConnections;
        for (var i = 0; i < Math.min(conns.length, 10); i++) {
          if (conns[i].messageCount !== undefined) {
            patterns.push({
              type: 'tracked-connection',
              url: conns[i].url,
              messageCount: conns[i].messageCount || 0,
              recentMessages: (conns[i].messages || []).slice(-5).map(function(m) {
                return { data: String(m.data).slice(0, 100), dir: m.dir, ts: m.ts };
              })
            });
          }
        }
      }
      // Scan inline scripts for onmessage patterns
      var scripts = document.querySelectorAll('script:not([src])');
      var msgPatterns = ['.onmessage', 'addEventListener("message"', "addEventListener('message'", 'ws.on("message"', "ws.on('message'"];
      for (var j = 0; j < Math.min(scripts.length, 30); j++) {
        var text = scripts[j].textContent || '';
        for (var p = 0; p < msgPatterns.length; p++) {
          var idx = text.indexOf(msgPatterns[p]);
          if (idx !== -1) {
            patterns.push({
              type: 'inline-script-handler',
              pattern: msgPatterns[p],
              context: text.slice(Math.max(0, idx - 30), idx + 80).replace(/\s+/g, ' ')
            });
          }
        }
        if (patterns.length >= 20) break;
      }
      return { handlerCount: patterns.length, handlers: patterns.slice(0, 20) };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 6. Elements and scripts with onmessage/onopen/onclose handlers
export async function getWebSocketHandlers(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      // Scan all script elements for WebSocket handler assignments
      var scripts = document.querySelectorAll('script:not([src])');
      var handlerPatterns = [
        { pattern: '.onmessage =', type: 'onmessage' },
        { pattern: '.onopen =', type: 'onopen' },
        { pattern: '.onclose =', type: 'onclose' },
        { pattern: '.onerror =', type: 'onerror' },
        { pattern: 'new WebSocket(', type: 'constructor' },
        { pattern: 'new SockJS(', type: 'sockjs-constructor' },
        { pattern: '.on("connect"', type: 'socketio-connect' },
        { pattern: ".on('connect'", type: 'socketio-connect' },
        { pattern: '.on("disconnect"', type: 'socketio-disconnect' },
        { pattern: ".on('disconnect'", type: 'socketio-disconnect' }
      ];
      for (var i = 0; i < Math.min(scripts.length, 30); i++) {
        var text = scripts[i].textContent || '';
        var scriptMatches = [];
        for (var p = 0; p < handlerPatterns.length; p++) {
          if (text.indexOf(handlerPatterns[p].pattern) !== -1) {
            scriptMatches.push(handlerPatterns[p].type);
          }
        }
        if (scriptMatches.length > 0) {
          results.push({
            elementIndex: i,
            handlerTypes: scriptMatches,
            scriptLength: text.length,
            preview: text.trim().slice(0, 120)
          });
        }
        if (results.length >= 20) break;
      }
      // Check external scripts for ws-related filenames
      var extScripts = document.querySelectorAll('script[src]');
      var wsFilenames = ['ws', 'websocket', 'socket', 'realtime', 'live', 'push', 'stream'];
      for (var j = 0; j < Math.min(extScripts.length, 20); j++) {
        var src = extScripts[j].getAttribute('src') || '';
        var lower = src.toLowerCase();
        for (var k = 0; k < wsFilenames.length; k++) {
          if (lower.indexOf(wsFilenames[k]) !== -1) {
            results.push({ type: 'external-script', src: src, matched: wsFilenames[k] });
            break;
          }
        }
        if (results.length >= 20) break;
      }
      return results.slice(0, 20);
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 7. Server-Sent Events (EventSource) connections
export async function getEventSourceElements(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var results = [];
      var hasEventSource = typeof EventSource !== 'undefined';
      // Check patched EventSource connections
      if (window.__esConnections) {
        var conns = window.__esConnections;
        for (var i = 0; i < Math.min(conns.length, 20); i++) {
          results.push({
            type: 'tracked',
            url: conns[i].url,
            readyState: conns[i].readyState,
            readyStateLabel: ['CONNECTING','OPEN','CLOSED'][conns[i].readyState] || 'UNKNOWN'
          });
        }
      }
      // Scan inline scripts for EventSource usage
      var scripts = document.querySelectorAll('script:not([src])');
      var esPatterns = ['new EventSource(', '.onmessage =', 'addEventListener("message"'];
      for (var j = 0; j < Math.min(scripts.length, 30); j++) {
        var text = scripts[j].textContent || '';
        if (text.indexOf('EventSource') !== -1) {
          var idx = text.indexOf('new EventSource(');
          var urlMatch = '';
          if (idx !== -1) {
            var snippet = text.slice(idx, idx + 80);
            var m = snippet.match(/new EventSource\(["']?([^'")\s]+)/);
            if (m) urlMatch = m[2];
          }
          results.push({
            type: 'inline-script',
            hasConstructor: text.indexOf('new EventSource(') !== -1,
            detectedUrl: urlMatch || null,
            preview: text.slice(Math.max(0, idx !== -1 ? idx : 0), (idx !== -1 ? idx : 0) + 100).replace(/\s+/g, ' ')
          });
        }
        if (results.length >= 20) break;
      }
      // Inject EventSource patch if not already present
      var patched = false;
      if (!window.__esConnections && hasEventSource) {
        window.__esConnections = [];
        var _OrigES = window.EventSource;
        function _PatchedES(url, init) {
          var es = init !== undefined ? new _OrigES(url, init) : new _OrigES(url);
          var entry = { url: url, readyState: es.readyState, openedAt: Date.now() };
          window.__esConnections.push(entry);
          es.addEventListener('open', function() { entry.readyState = es.readyState; });
          es.addEventListener('error', function() { entry.readyState = es.readyState; });
          return es;
        }
        _PatchedES.prototype = _OrigES.prototype;
        _PatchedES.CONNECTING = _OrigES.CONNECTING;
        _PatchedES.OPEN = _OrigES.OPEN;
        _PatchedES.CLOSED = _OrigES.CLOSED;
        window.EventSource = _PatchedES;
        patched = true;
      }
      return {
        hasEventSource: hasEventSource,
        patchInjected: patched || !!(window.__esConnections),
        connections: results.slice(0, 20)
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 8. Detected real-time patterns across all APIs
export async function getWebSocketApiUsage(cdp: any): Promise<ToolResult> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      var allScriptText = '';
      var scripts = document.querySelectorAll('script:not([src])');
      for (var i = 0; i < scripts.length; i++) {
        allScriptText += scripts[i].textContent || '';
      }
      var extSrcs = [];
      var extScripts = document.querySelectorAll('script[src]');
      for (var j = 0; j < extScripts.length; j++) {
        extSrcs.push((extScripts[j].getAttribute('src') || '').toLowerCase());
      }
      var extSrcStr = extSrcs.join(' ');
      // WebSocket detection
      var hasWebSocket = typeof WebSocket !== 'undefined' && (
        allScriptText.indexOf('new WebSocket(') !== -1 ||
        allScriptText.indexOf('WebSocket(') !== -1 ||
        extSrcStr.indexOf('websocket') !== -1
      );
      // Socket.io detection
      var hasSocketIo = !!(window.io) ||
        allScriptText.indexOf('socket.io') !== -1 ||
        allScriptText.indexOf('io.connect(') !== -1 ||
        extSrcStr.indexOf('socket.io') !== -1;
      // SSE detection
      var hasSse = typeof EventSource !== 'undefined' && (
        allScriptText.indexOf('EventSource') !== -1 ||
        allScriptText.indexOf('text/event-stream') !== -1
      );
      // MQTT detection (browser clients: mqtt.js, paho)
      var hasMqtt = allScriptText.indexOf('mqtt') !== -1 ||
        extSrcStr.indexOf('mqtt') !== -1 ||
        !!(window.mqtt) ||
        !!(window.Paho);
      // SignalR detection
      var hasSignalR = !!(window.signalR) ||
        extSrcStr.indexOf('signalr') !== -1 ||
        allScriptText.indexOf('signalR') !== -1 ||
        allScriptText.indexOf('@microsoft/signalr') !== -1;
      // SockJS
      var hasSockJs = !!(window.SockJS) ||
        extSrcStr.indexOf('sockjs') !== -1 ||
        allScriptText.indexOf('new SockJS(') !== -1;
      // Long polling indicators
      var hasLongPolling = allScriptText.indexOf('longpoll') !== -1 ||
        allScriptText.indexOf('long-poll') !== -1 ||
        allScriptText.indexOf('polling') !== -1;
      return {
        hasWebSocket: hasWebSocket,
        hasSocketIo: hasSocketIo,
        hasSse: hasSse,
        hasMqtt: hasMqtt,
        hasSignalR: hasSignalR,
        hasSockJs: hasSockJs,
        hasLongPolling: hasLongPolling
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
