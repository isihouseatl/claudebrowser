// network4.ts — network/connection state inspection via Runtime.evaluate
// Functions: getNetworkStatus, getConnectionType2, getOnlineState, getNetworkInfo2,
//            getServiceWorkers, getFetchState, getXhrState, getNetworkApiUsage

// 1. getNetworkStatus
export async function getNetworkStatus(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      return {
        online: navigator.onLine,
        connectionType: conn ? conn.type : null,
        effectiveType: conn ? conn.effectiveType : null,
        downlink: conn ? conn.downlink : null,
        rtt: conn ? conn.rtt : null
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 2. getConnectionType2 (getConnectionType already exists in network3.ts)
export async function getConnectionType2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (!conn) return { type: null, effectiveType: null, downlink: null, rtt: null, saveData: null };
      return {
        type: conn.type || null,
        effectiveType: conn.effectiveType || null,
        downlink: typeof conn.downlink === 'number' ? conn.downlink : null,
        rtt: typeof conn.rtt === 'number' ? conn.rtt : null,
        saveData: typeof conn.saveData === 'boolean' ? conn.saveData : null
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 3. getOnlineState
export async function getOnlineState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const listeners = (window as any).__onlineListeners;
      return {
        isOnline: navigator.onLine,
        hasOnlineListener: typeof (window as any).ononline === 'function',
        hasOfflineListener: typeof (window as any).onoffline === 'function'
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 4. getNetworkInfo2 (getNetworkInfo already exists in geo2.ts)
export async function getNetworkInfo2(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      return {
        online: navigator.onLine,
        type: conn ? (conn.type || null) : null,
        downlink: conn ? (conn.downlink || null) : null,
        rtt: conn ? (conn.rtt || null) : null,
        effectiveType: conn ? (conn.effectiveType || null) : null,
        saveData: conn ? (conn.saveData || false) : null
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 5. getServiceWorkers
export async function getServiceWorkers(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async function() {
      if (!('serviceWorker' in navigator)) return [];
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.slice(0, 10).map(function(reg) {
          const worker = reg.active || reg.installing || reg.waiting;
          return {
            scope: reg.scope,
            state: worker ? worker.state : 'none',
            scriptUrl_preview: worker ? worker.scriptURL.substring(0, 80) : null
          };
        });
      } catch (e) {
        return [];
      }
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 6. getFetchState
export async function getFetchState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      return {
        hasFetch: typeof fetch === 'function',
        hasXhr: typeof XMLHttpRequest === 'function',
        hasAxios: typeof (window as any).axios !== 'undefined',
        hasJquery: typeof (window as any).$ === 'function' || typeof (window as any).jQuery === 'function'
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 7. getXhrState
export async function getXhrState(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const hasXhr = typeof XMLHttpRequest === 'function';
      let xhrCount = 0;
      if (hasXhr) {
        try {
          const perfEntries = performance.getEntriesByType('resource');
          xhrCount = perfEntries.filter(function(e) {
            return (e as any).initiatorType === 'xmlhttprequest';
          }).length;
        } catch (e) {
          xhrCount = 0;
        }
      }
      return {
        hasXhr: hasXhr,
        xhrCount: xhrCount
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

// 8. getNetworkApiUsage
export async function getNetworkApiUsage(
  cdp: any
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      return {
        hasFetch: typeof fetch === 'function',
        hasXhr: typeof XMLHttpRequest === 'function',
        hasWebSocket: typeof WebSocket === 'function',
        hasEventSource: typeof EventSource === 'function',
        hasBeacon: typeof navigator.sendBeacon === 'function'
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });
  const data = result.value;
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
