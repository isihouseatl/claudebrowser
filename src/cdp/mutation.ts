// src/cdp/mutation.ts
import { CdpClient } from './client';

export interface MutationRecord {
  type: 'childList' | 'attributes' | 'characterData';
  targetSelector: string; // best-effort CSS selector of target
  addedCount: number;     // for childList
  removedCount: number;   // for childList
  attributeName?: string; // for attributes
  oldValue?: string;      // for attributes/characterData
  newValue?: string;      // for attributes/characterData
  timestamp: number;      // Date.now()
}

// Per-client set of active observer IDs
const activeObservers = new WeakMap<CdpClient, Set<string>>();

function getOrCreateObserverSet(client: CdpClient): Set<string> {
  let set = activeObservers.get(client);
  if (!set) {
    set = new Set();
    activeObservers.set(client, set);
  }
  return set;
}

// Best-effort CSS selector builder injected into the page.
// Produces a simple path like: div#id > ul > li.class
const SELECTOR_FN = `
function __cbGetSelector(el) {
  try {
    if (!el || el === document) return 'document';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += '#' + CSS.escape(node.id);
        parts.unshift(part);
        break;
      }
      const classes = Array.from(node.classList).slice(0, 2).map(c => '.' + CSS.escape(c)).join('');
      if (classes) part += classes;
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === node.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(node) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(part);
      node = parent;
      if (parts.length >= 5) break;
    }
    return parts.join(' > ') || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}
`.trim();

// Inject the MutationObserver into the page for the given observerId and selector.
async function injectObserver(
  client: CdpClient,
  observerId: string,
  selector: string,
  options: { childList: boolean; attributes: boolean; characterData: boolean; subtree: boolean },
): Promise<void> {
  const idLiteral = JSON.stringify(observerId);
  const selLiteral = JSON.stringify(selector);
  const observeOptions = JSON.stringify({
    childList: options.childList,
    attributes: options.attributes,
    characterData: options.characterData,
    subtree: options.subtree,
    attributeOldValue: options.attributes,
    characterDataOldValue: options.characterData,
  });

  const script = `
(function() {
  try {
    ${SELECTOR_FN}

    const observerId = ${idLiteral};
    const selector = ${selLiteral};
    const bufKey = '__cbMutations_' + observerId;
    const obsKey = '__cbObserver_' + observerId;

    // Initialize buffer if not present
    if (!window[bufKey]) window[bufKey] = [];

    // Disconnect any previous observer with this id
    if (window[obsKey]) {
      window[obsKey].disconnect();
      window[obsKey] = null;
    }

    const targets = selector === 'document'
      ? [document]
      : Array.from(document.querySelectorAll(selector));

    if (targets.length === 0 && selector !== 'document') {
      // Watch document root with subtree so we can still capture mutations
      targets.push(document.documentElement || document);
    }

    const observer = new MutationObserver(function(mutations) {
      const now = Date.now();
      mutations.forEach(function(m) {
        const rec = {
          type: m.type,
          targetSelector: __cbGetSelector(m.target),
          addedCount: m.type === 'childList' ? m.addedNodes.length : 0,
          removedCount: m.type === 'childList' ? m.removedNodes.length : 0,
          attributeName: m.attributeName || undefined,
          oldValue: m.oldValue != null ? String(m.oldValue) : undefined,
          newValue: m.type === 'attributes' && m.target && m.target.nodeType === 1
            ? (m.target.getAttribute(m.attributeName) != null
                ? String(m.target.getAttribute(m.attributeName))
                : undefined)
            : (m.type === 'characterData' && m.target
                ? String(m.target.textContent)
                : undefined),
          timestamp: now,
        };
        window[bufKey].push(rec);
      });
    });

    const opts = ${observeOptions};
    targets.forEach(function(t) { observer.observe(t, opts); });
    window[obsKey] = observer;
  } catch(e) {
    // Silently fail — host page may not support MutationObserver
  }
})()
`.trim();

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: script,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `mutation inject error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
}

// Read the mutation buffer from the page for a given observerId.
async function readMutationBuffer(client: CdpClient, observerId: string): Promise<MutationRecord[]> {
  const idLiteral = JSON.stringify(observerId);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function(){
  try {
    const buf = window['__cbMutations_' + ${idLiteral}];
    return JSON.stringify(Array.isArray(buf) ? buf : []);
  } catch(e) { return '[]'; }
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) return [];
  try {
    return JSON.parse(result.value as string) as MutationRecord[];
  } catch {
    return [];
  }
}

// ---- Public API ----

/**
 * Start observing DOM mutations on matching elements.
 * selector: CSS selector for elements to observe, or 'document' for the document root.
 * options: which mutation types to watch; all default to true.
 */
export async function startMutationObserver(
  client: CdpClient,
  observerId: string,
  selector: string,
  options?: {
    childList?: boolean;
    attributes?: boolean;
    characterData?: boolean;
    subtree?: boolean;
  },
): Promise<void> {
  const opts = {
    childList: options?.childList ?? true,
    attributes: options?.attributes ?? true,
    characterData: options?.characterData ?? true,
    subtree: options?.subtree ?? true,
  };
  await injectObserver(client, observerId, selector, opts);
  getOrCreateObserverSet(client).add(observerId);
}

/**
 * Get all mutations captured for a given observerId since the observer was started (or last clear).
 * This call reads the in-page buffer synchronously via CDP evaluate.
 */
export async function getMutations(client: CdpClient, observerId: string): Promise<MutationRecord[]> {
  return readMutationBuffer(client, observerId);
}

/**
 * Clear the mutation buffer for an observer without stopping it.
 */
export async function clearMutations(client: CdpClient, observerId: string): Promise<void> {
  const idLiteral = JSON.stringify(observerId);
  await client.raw.Runtime.evaluate({
    expression: `(function(){
  try { window['__cbMutations_' + ${idLiteral}] = []; } catch(e) {}
})()`,
    returnByValue: true,
  });
}

/**
 * Stop an observer by id. Returns all mutations captured up to this point.
 */
export async function stopMutationObserver(
  client: CdpClient,
  observerId: string,
): Promise<MutationRecord[]> {
  const idLiteral = JSON.stringify(observerId);
  // Read final mutations before disconnecting
  const mutations = await readMutationBuffer(client, observerId);

  await client.raw.Runtime.evaluate({
    expression: `(function(){
  try {
    const obs = window['__cbObserver_' + ${idLiteral}];
    if (obs) { obs.disconnect(); window['__cbObserver_' + ${idLiteral}] = null; }
    window['__cbMutations_' + ${idLiteral}] = undefined;
  } catch(e) {}
})()`,
    returnByValue: true,
  });

  getOrCreateObserverSet(client).delete(observerId);
  return mutations;
}

/**
 * Stop all observers registered for this client.
 */
export async function stopAllMutationObservers(client: CdpClient): Promise<void> {
  const ids = getOrCreateObserverSet(client);
  await Promise.all(Array.from(ids).map(id => stopMutationObserver(client, id)));
  ids.clear();
}

/**
 * Wait for at least one mutation to be captured by observerId.
 * Polls every 200ms. Rejects after timeoutMs (default 15000ms).
 */
export async function waitForMutation(
  client: CdpClient,
  observerId: string,
  timeoutMs = 15000,
): Promise<MutationRecord> {
  const deadline = Date.now() + timeoutMs;

  return new Promise<MutationRecord>((resolve, reject) => {
    const poll = async () => {
      if (Date.now() >= deadline) {
        reject(new Error(`waitForMutation timed out after ${timeoutMs}ms (observerId: ${observerId})`));
        return;
      }
      try {
        const mutations = await readMutationBuffer(client, observerId);
        if (mutations.length > 0) {
          resolve(mutations[0]);
          return;
        }
      } catch {
        // ignore transient read errors; keep polling
      }
      setTimeout(poll, 200);
    };
    poll();
  });
}
