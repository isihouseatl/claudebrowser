// src/cdp/recorder.ts
import { CdpClient } from './client';

export type ActionType = 'click' | 'input' | 'change' | 'keydown';

export interface RecordedAction {
  type: ActionType;
  selector: string;
  value?: string;
  checked?: boolean;
  key?: string;
  x?: number;
  y?: number;
  timestamp: number;
}

// Per-client recording state
interface RecordingState {
  injected: boolean;
  cleanupScriptId?: string;
}

const recordingStates = new WeakMap<CdpClient, RecordingState>();

// The full recording setup script injected into the page.
// It is idempotent: if window.__cbRecorderActive is already set, it does nothing.
const RECORDING_SETUP_SCRIPT = `
(function() {
  if (window.__cbRecorderActive) return;

  function getBestSelector(el) {
    try {
      if (!el || el.nodeType !== 1) return 'unknown';
      if (el.id) return '#' + CSS.escape(el.id);
      var name = el.getAttribute('name');
      if (name) return el.tagName.toLowerCase() + '[name=' + JSON.stringify(name) + ']';
      var parent = el.parentElement;
      if (!parent) return el.tagName.toLowerCase();
      var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === el.tagName; });
      var idx = siblings.indexOf(el) + 1;
      return el.tagName.toLowerCase() + ':nth-of-type(' + idx + ')';
    } catch (e) {
      return 'unknown';
    }
  }

  window.__cbRecorderLog = [];
  window.__cbRecorderActive = true;

  function onClickCapture(e) {
    try {
      window.__cbRecorderLog.push({
        type: 'click',
        selector: getBestSelector(e.target),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      });
    } catch (_) {}
  }

  function onInputCapture(e) {
    try {
      var el = e.target;
      window.__cbRecorderLog.push({
        type: 'input',
        selector: getBestSelector(el),
        value: el.value !== undefined ? String(el.value) : undefined,
        timestamp: Date.now(),
      });
    } catch (_) {}
  }

  function onChangeCapture(e) {
    try {
      var el = e.target;
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      var type = (el.getAttribute ? el.getAttribute('type') : '') || '';
      var isCheckable = tag === 'input' && (type === 'checkbox' || type === 'radio');
      var rec = {
        type: 'change',
        selector: getBestSelector(el),
        value: el.value !== undefined ? String(el.value) : undefined,
        timestamp: Date.now(),
      };
      if (isCheckable) {
        rec.checked = el.checked;
      }
      window.__cbRecorderLog.push(rec);
    } catch (_) {}
  }

  function onKeydownCapture(e) {
    try {
      var focused = document.activeElement;
      window.__cbRecorderLog.push({
        type: 'keydown',
        selector: focused ? getBestSelector(focused) : 'unknown',
        key: e.key,
        timestamp: Date.now(),
      });
    } catch (_) {}
  }

  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('input', onInputCapture, true);
  document.addEventListener('change', onChangeCapture, true);
  document.addEventListener('keydown', onKeydownCapture, true);

  // Store cleanup function on window so stopRecording can remove listeners
  window.__cbRecorderCleanup = function() {
    document.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('input', onInputCapture, true);
    document.removeEventListener('change', onChangeCapture, true);
    document.removeEventListener('keydown', onKeydownCapture, true);
    window.__cbRecorderActive = false;
    window.__cbRecorderCleanup = null;
  };
})()
`.trim();

// Read the current log from the page.
async function readLog(client: CdpClient): Promise<RecordedAction[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
  try {
    var log = window.__cbRecorderLog;
    return JSON.stringify(Array.isArray(log) ? log : []);
  } catch(e) { return '[]'; }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return [];
  try {
    return JSON.parse(result.value as string) as RecordedAction[];
  } catch {
    return [];
  }
}

/**
 * Start recording user interactions on the page.
 * Calling again on the same client while already recording is a no-op.
 */
export async function startRecording(client: CdpClient): Promise<void> {
  const existing = recordingStates.get(client);
  if (existing?.injected) return;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: RECORDING_SETUP_SCRIPT,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `recorder inject error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }

  recordingStates.set(client, { injected: true });
}

/**
 * Stop recording and return all collected actions.
 * Removes injected listeners from the page and resets the WeakMap entry.
 * Returns an empty array if recording was never started.
 */
export async function stopRecording(client: CdpClient): Promise<RecordedAction[]> {
  const state = recordingStates.get(client);
  if (!state?.injected) return [];

  // Read the log before cleaning up
  const actions = await readLog(client);

  // Remove listeners and clear page-side state
  await client.raw.Runtime.evaluate({
    expression: `(function() {
  try {
    if (typeof window.__cbRecorderCleanup === 'function') {
      window.__cbRecorderCleanup();
    }
    window.__cbRecorderLog = null;
  } catch(e) {}
})()`,
    returnByValue: true,
  });

  recordingStates.delete(client);
  return actions;
}

/**
 * Return the current log without stopping recording.
 * Returns an empty array if recording is not active.
 */
export async function getRecordedActions(client: CdpClient): Promise<RecordedAction[]> {
  const state = recordingStates.get(client);
  if (!state?.injected) return [];
  return readLog(client);
}

/**
 * Clear the log without stopping recording.
 * No-op if recording is not active.
 */
export async function clearRecording(client: CdpClient): Promise<void> {
  const state = recordingStates.get(client);
  if (!state?.injected) return;

  await client.raw.Runtime.evaluate({
    expression: `(function() {
  try { window.__cbRecorderLog = []; } catch(e) {}
})()`,
    returnByValue: true,
  });
}

/**
 * Return whether recording is currently active for this client.
 */
export function isRecording(client: CdpClient): boolean {
  return recordingStates.get(client)?.injected === true;
}
