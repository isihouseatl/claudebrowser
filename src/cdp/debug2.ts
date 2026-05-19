// src/cdp/debug2.ts
import type { CdpClient } from './client';

// ---- Helpers ----

function ok(v: unknown): { content: [{ type: 'text'; text: string }] } {
  const text = typeof v === 'string' ? v : JSON.stringify(v);
  return { content: [{ type: 'text' as const, text }] };
}

function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// ---- Functions ----

/**
 * Inject a console.error interceptor storing to window.__consoleErrors = [].
 * Returns the current log contents.
 */
export async function getConsoleErrors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (!window.__consoleErrors) {
    window.__consoleErrors = [];
    const _origError = console.error.bind(console);
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      window.__consoleErrors.push({
        message: args.map(function(a) { return typeof a === 'string' ? a : JSON.stringify(a); }).join(' '),
        timestamp: Date.now(),
      });
      _origError.apply(console, arguments);
    };
  }
  return window.__consoleErrors;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Clear window.__consoleErrors.
 */
export async function clearConsoleErrors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  window.__consoleErrors = [];
  return true;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Inject monitors for console.log, warn, error, and info into window.__consoleLogs = [].
 * Each entry captures level, message, and timestamp.
 */
export async function injectConsoleMonitor(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (window.__consoleMonitorInjected) return 'already injected';
  window.__consoleLogs = window.__consoleLogs || [];
  var levels = ['log', 'warn', 'error', 'info'];
  for (var i = 0; i < levels.length; i++) {
    (function(level) {
      var _orig = console[level].bind(console);
      console[level] = function() {
        var args = Array.prototype.slice.call(arguments);
        window.__consoleLogs.push({
          level: level,
          message: args.map(function(a) { return typeof a === 'string' ? a : JSON.stringify(a); }).join(' '),
          timestamp: Date.now(),
        });
        _orig.apply(console, arguments);
      };
    })(levels[i]);
  }
  window.__consoleMonitorInjected = true;
  return 'injected';
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Get all captured console logs: level, message, timestamp.
 * Returns window.__consoleLogs (or empty array if monitor was not injected).
 */
export async function getConsoleLogs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  return window.__consoleLogs || [];
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Clear window.__consoleLogs.
 */
export async function clearConsoleLogs(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  window.__consoleLogs = [];
  return true;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Inject window.onerror handler storing errors to window.__windowErrors = [].
 * Returns the current error list.
 */
export async function getWindowErrors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (!window.__windowErrors) {
    window.__windowErrors = [];
    var _prevOnerror = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      window.__windowErrors.push({
        message: typeof message === 'string' ? message : String(message),
        source: source || '',
        lineno: lineno || 0,
        colno: colno || 0,
        stack: (error && error.stack) ? error.stack : '',
        timestamp: Date.now(),
      });
      if (typeof _prevOnerror === 'function') {
        return _prevOnerror.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }
  return window.__windowErrors;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Clear window.__windowErrors.
 */
export async function clearWindowErrors(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  window.__windowErrors = [];
  return true;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}

/**
 * Inject unhandledrejection listener storing to window.__unhandledRejections = [].
 * Returns the current list.
 */
export async function getUnhandledRejections(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  if (!window.__unhandledRejections) {
    window.__unhandledRejections = [];
    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason;
      var entry = {
        message: '',
        stack: '',
        timestamp: Date.now(),
      };
      if (reason instanceof Error) {
        entry.message = reason.message;
        entry.stack = reason.stack || '';
      } else if (typeof reason === 'string') {
        entry.message = reason;
      } else {
        try { entry.message = JSON.stringify(reason); } catch(e) { entry.message = String(reason); }
      }
      window.__unhandledRejections.push(entry);
    });
  }
  return window.__unhandledRejections;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    const msg =
      (exceptionDetails as { exception?: { description?: string } }).exception?.description ??
      (exceptionDetails as { text?: string }).text ??
      'unknown JS error';
    return err(msg);
  }
  return ok(result.value);
}
