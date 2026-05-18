// src/cdp/evaluate.ts
import { CdpClient } from './client';

export async function evaluate(
  client: CdpClient,
  script: string,
  contextId?: number,
): Promise<unknown> {
  const params: Parameters<typeof client.raw.Runtime.evaluate>[0] = {
    expression: script,
    returnByValue: true,
    awaitPromise: true,
  };
  if (contextId !== undefined) params.contextId = contextId;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate(params);
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number | null;
  resourceType: string;
  timestamp: number;
}

const requestLog: Map<string, Partial<NetworkRequest>> = new Map();
const MAX_LOG_SIZE = 500;
const EVICT_COUNT = 100;
let monitorStarted = false;

export function startNetworkMonitor(client: CdpClient): void {
  if (monitorStarted) return;
  monitorStarted = true;

  client.raw.Network.requestWillBeSent(({ requestId, request, type, timestamp }) => {
    if (requestLog.size >= MAX_LOG_SIZE) {
      const keys = requestLog.keys();
      for (let i = 0; i < EVICT_COUNT; i++) requestLog.delete(keys.next().value!);
    }
    requestLog.set(requestId, { url: request.url, method: request.method, resourceType: type ?? 'Other', timestamp, status: null });
  });
  client.raw.Network.responseReceived(({ requestId, response }) => {
    const existing = requestLog.get(requestId);
    if (existing) requestLog.set(requestId, { ...existing, status: response.status });
  });
}

export function resetNetworkMonitor(): void {
  monitorStarted = false;
  requestLog.clear();
}

export function getNetworkRequests(filter?: string): NetworkRequest[] {
  const all = Array.from(requestLog.values()) as NetworkRequest[];
  const filtered = filter ? all.filter(r => r.url?.includes(filter)) : all;
  return filtered.slice(-50);
}

export function clearNetworkLog(): void {
  requestLog.clear();
}

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
}

const consoleLog: ConsoleMessage[] = [];
const MAX_CONSOLE_SIZE = 500;
const CONSOLE_EVICT_COUNT = 100;
let consoleMonitorStarted = false;

export function startConsoleMonitor(client: CdpClient): void {
  if (consoleMonitorStarted) return;
  consoleMonitorStarted = true;

  client.raw.Runtime.consoleAPICalled(({ type, args, timestamp }) => {
    if (consoleLog.length >= MAX_CONSOLE_SIZE) {
      consoleLog.splice(0, CONSOLE_EVICT_COUNT);
    }
    const text = args.map(a => a.value ?? a.description ?? String(a.type)).join(' ');
    consoleLog.push({ type, text, timestamp });
  });
}

export function resetConsoleMonitor(): void {
  consoleMonitorStarted = false;
  consoleLog.length = 0;
}

export function getConsoleMessages(type?: string): ConsoleMessage[] {
  const filtered = type ? consoleLog.filter(m => m.type === type) : consoleLog;
  return filtered.slice(-100);
}

export function clearConsoleLog(): void {
  consoleLog.length = 0;
}

// Evaluate an expression in the context of a specific element (passes element as 'el' to the script)
// selector: CSS selector for the element
// script: expression like 'el.value' or '(el) => el.getBoundingClientRect()'
export async function evaluateOnElement(
  client: CdpClient,
  selector: string,
  script: string,
): Promise<unknown> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
  const fn = (${script});
  return typeof fn === 'function' ? fn(el) : fn;
})()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value;
}

// Get all window-level global variables (enumerable own properties of window, excluding standard builtins)
export async function getWindowGlobals(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify((() => {
  const builtins = new Set([
    'undefined', 'Infinity', 'NaN', 'globalThis', 'Object', 'Function', 'Array', 'Number',
    'parseFloat', 'parseInt', 'Infinity', 'NaN', 'Boolean', 'String', 'Symbol', 'BigInt',
    'Math', 'Date', 'RegExp', 'Error', 'EvalError', 'RangeError', 'ReferenceError',
    'SyntaxError', 'TypeError', 'URIError', 'JSON', 'Promise', 'Proxy', 'Reflect', 'Map',
    'Set', 'WeakMap', 'WeakSet', 'WeakRef', 'FinalizationRegistry', 'ArrayBuffer',
    'SharedArrayBuffer', 'Atomics', 'DataView', 'Int8Array', 'Uint8Array',
    'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
    'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array', 'Intl',
    'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
    'unescape', 'eval', 'isFinite', 'isNaN',
    'window', 'self', 'document', 'location', 'navigator', 'history', 'screen',
    'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout', 'setInterval',
    'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'fetch',
    'console', 'performance', 'crypto', 'indexedDB', 'localStorage', 'sessionStorage',
    'addEventListener', 'removeEventListener', 'dispatchEvent', 'getComputedStyle',
    'matchMedia', 'open', 'close', 'focus', 'blur', 'print', 'stop', 'scroll',
    'scrollTo', 'scrollBy', 'resizeTo', 'resizeBy', 'moveTo', 'moveBy',
    'postMessage', 'atob', 'btoa', 'queueMicrotask', 'reportError',
    'structuredClone', 'cancelIdleCallback', 'requestIdleCallback',
    'createImageBitmap', 'WebAssembly', 'XMLHttpRequest', 'WebSocket', 'Worker',
    'ServiceWorker', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request',
    'Response', 'AbortController', 'AbortSignal', 'MutationObserver',
    'IntersectionObserver', 'ResizeObserver', 'CustomEvent', 'Event', 'EventTarget',
    'Node', 'Element', 'HTMLElement', 'Document', 'ShadowRoot', 'Range', 'Selection',
    'DOMParser', 'DOMException', 'Blob', 'File', 'FileReader', 'FileList',
    'Image', 'Audio', 'Video', 'Canvas', 'CanvasRenderingContext2D',
    'SVGElement', 'CSSStyleDeclaration', 'MediaQueryList',
  ]);
  return Object.keys(window).filter(k => !builtins.has(k));
})())`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return JSON.parse(result.value as string);
}
