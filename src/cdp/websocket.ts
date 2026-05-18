// src/cdp/websocket.ts
import { CdpClient } from './client';

export interface WebSocketMessage {
  connectionId: string;  // requestId from CDP
  url: string;
  direction: 'sent' | 'received';
  payload: string;
  timestamp: number;     // Date.now()
}

export interface WebSocketConnection {
  requestId: string;
  url: string;
  openedAt: number;
  closedAt: number | null;
}

// Per-client message buffer: requestId -> WebSocketMessage[]
const messageBuffers = new WeakMap<CdpClient, Map<string, WebSocketMessage[]>>();

// Per-client connection buffer: requestId -> WebSocketConnection
const connectionBuffers = new WeakMap<CdpClient, Map<string, WebSocketConnection>>();

// Per-client cleanup functions
const cleanupFns = new WeakMap<CdpClient, () => void>();

function getMessageBuffer(client: CdpClient): Map<string, WebSocketMessage[]> {
  let buf = messageBuffers.get(client);
  if (!buf) {
    buf = new Map();
    messageBuffers.set(client, buf);
  }
  return buf;
}

function getConnectionBuffer(client: CdpClient): Map<string, WebSocketConnection> {
  let buf = connectionBuffers.get(client);
  if (!buf) {
    buf = new Map();
    connectionBuffers.set(client, buf);
  }
  return buf;
}

// Start capturing WebSocket activity.
// Calling again on the same client is a no-op.
export async function startWebSocketLog(client: CdpClient): Promise<void> {
  if (cleanupFns.has(client)) return;

  // Ensure clean buffers exist before subscribing
  messageBuffers.set(client, new Map());
  connectionBuffers.set(client, new Map());

  await client.raw.Network.enable({});

  const msgBuf = getMessageBuffer(client);
  const connBuf = getConnectionBuffer(client);

  const removeCreatedListener = client.raw.Network.webSocketCreated(({
    requestId,
    url,
  }: {
    requestId: string;
    url: string;
  }) => {
    connBuf.set(requestId, {
      requestId,
      url,
      openedAt: Date.now(),
      closedAt: null,
    });
    if (!msgBuf.has(requestId)) {
      msgBuf.set(requestId, []);
    }
  }) as unknown as () => void;

  const removeFrameReceivedListener = client.raw.Network.webSocketFrameReceived(({
    requestId,
    timestamp,
    response,
  }: {
    requestId: string;
    timestamp: number;
    response: { payloadData: string };
  }) => {
    const conn = connBuf.get(requestId);
    const messages = msgBuf.get(requestId) ?? [];
    messages.push({
      connectionId: requestId,
      url: conn?.url ?? '',
      direction: 'received',
      payload: response.payloadData,
      timestamp: Date.now(),
    });
    msgBuf.set(requestId, messages);
  }) as unknown as () => void;

  const removeFrameSentListener = client.raw.Network.webSocketFrameSent(({
    requestId,
    timestamp,
    response,
  }: {
    requestId: string;
    timestamp: number;
    response: { payloadData: string };
  }) => {
    const conn = connBuf.get(requestId);
    const messages = msgBuf.get(requestId) ?? [];
    messages.push({
      connectionId: requestId,
      url: conn?.url ?? '',
      direction: 'sent',
      payload: response.payloadData,
      timestamp: Date.now(),
    });
    msgBuf.set(requestId, messages);
  }) as unknown as () => void;

  const removeClosedListener = client.raw.Network.webSocketClosed(({
    requestId,
    timestamp,
  }: {
    requestId: string;
    timestamp: number;
  }) => {
    const conn = connBuf.get(requestId);
    if (conn) {
      conn.closedAt = Date.now();
    }
  }) as unknown as () => void;

  cleanupFns.set(client, () => {
    removeCreatedListener();
    removeFrameReceivedListener();
    removeFrameSentListener();
    removeClosedListener();
  });
}

// Get all captured WebSocket messages, flattened and sorted by timestamp.
// Returns an empty array if startWebSocketLog has not been called.
export function getWebSocketMessages(client: CdpClient): WebSocketMessage[] {
  const msgBuf = messageBuffers.get(client);
  if (!msgBuf) return [];
  const all: WebSocketMessage[] = [];
  for (const messages of msgBuf.values()) {
    all.push(...messages);
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// Get all WebSocket connections (open and closed).
// Returns an empty array if startWebSocketLog has not been called.
export function getWebSocketConnections(client: CdpClient): WebSocketConnection[] {
  const connBuf = connectionBuffers.get(client);
  if (!connBuf) return [];
  return Array.from(connBuf.values());
}

// Clear message and connection buffers without stopping capture.
export function clearWebSocketLog(client: CdpClient): void {
  const msgBuf = messageBuffers.get(client);
  if (msgBuf) msgBuf.clear();
  const connBuf = connectionBuffers.get(client);
  if (connBuf) connBuf.clear();
}

// Stop capturing and clean up. Returns the final messages.
// Returns an empty array if startWebSocketLog was never called.
export async function stopWebSocketLog(client: CdpClient): Promise<WebSocketMessage[]> {
  const cleanup = cleanupFns.get(client);
  if (!cleanup) return [];

  cleanup();

  const messages = getWebSocketMessages(client);

  cleanupFns.delete(client);
  messageBuffers.delete(client);
  connectionBuffers.delete(client);

  return messages;
}
