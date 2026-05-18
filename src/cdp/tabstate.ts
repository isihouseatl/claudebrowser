// src/cdp/tabstate.ts
import * as http from 'http';
import CDP from 'chrome-remote-interface';
import { CdpClient } from './client';

export interface TabSnapshot {
  id: string;
  url: string;
  title: string;
  loading: boolean;
  faviconUrl?: string;
}

interface JsonTabEntry {
  id: string;
  url: string;
  title: string;
  type: string;
  faviconUrl?: string;
  // Chrome's /json endpoint includes a devtoolsFrontendUrl but not a "status" field.
  // We derive loading from the webSocketDebuggerUrl presence and other heuristics.
  // The actual loading field comes from querying each tab via CDP.
  webSocketDebuggerUrl?: string;
}

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchJsonTabs(debugPort: number): Promise<JsonTabEntry[]> {
  const raw = await httpGet(`http://localhost:${debugPort}/json`);
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return (parsed as JsonTabEntry[]).filter(t => t.type === 'page');
}

async function getTabLoadingState(debugPort: number, tabId: string): Promise<boolean> {
  let client: CDP.Client | null = null;
  try {
    client = await CDP({ port: debugPort, target: tabId });
    await client.Runtime.enable();
    const { result } = await client.Runtime.evaluate({
      expression: 'document.readyState',
      returnByValue: true,
    });
    return result.value === 'loading';
  } catch {
    return false;
  } finally {
    if (client) {
      try { await client.close(); } catch { /* ignore */ }
    }
  }
}

// Snapshot the state of all open tabs: url, title, loading status, favicon
export async function getAllTabSnapshots(
  _client: CdpClient,
  debugPort: number,
): Promise<TabSnapshot[]> {
  const tabs = await fetchJsonTabs(debugPort);
  const snapshots = await Promise.all(
    tabs.map(async (t, index): Promise<TabSnapshot> => {
      const loading = await getTabLoadingState(debugPort, t.id).catch(() => false);
      const snap: TabSnapshot = {
        id: t.id,
        url: t.url,
        title: t.title,
        loading,
      };
      if (t.faviconUrl) snap.faviconUrl = t.faviconUrl;
      void index; // index available if needed for ordering
      return snap;
    }),
  );
  return snapshots;
}

// Find tabs matching a URL pattern (substring)
export async function findTabsByUrl(
  client: CdpClient,
  debugPort: number,
  urlPattern: string,
): Promise<TabSnapshot[]> {
  const all = await getAllTabSnapshots(client, debugPort);
  return all.filter(t => t.url.includes(urlPattern));
}

// Duplicate the current tab (opens a new tab with same URL), returns new tabId
export async function duplicateTab(debugPort: number, tabId: string): Promise<string> {
  const tabs = await fetchJsonTabs(debugPort);
  const source = tabs.find(t => t.id === tabId);
  if (!source) throw new Error(`Tab ${tabId} not found`);
  const target = await CDP.New({ port: debugPort, url: source.url });
  return target.id;
}

// Return tab info with index position for a specific tab ID
export async function getTabInfo(
  _client: CdpClient,
  debugPort: number,
  tabId: string,
): Promise<TabSnapshot | null> {
  const tabs = await fetchJsonTabs(debugPort);
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return null;
  const loading = await getTabLoadingState(debugPort, tabId).catch(() => false);
  const snap: TabSnapshot = {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    loading,
  };
  if (tab.faviconUrl) snap.faviconUrl = tab.faviconUrl;
  return snap;
}

// Wait for a specific tab (by ID) to finish loading by polling /json every 300ms
export async function waitForTabLoad(
  _client: CdpClient,
  debugPort: number,
  tabId: string,
  timeoutMs = 15000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tabs = await fetchJsonTabs(debugPort);
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) throw new Error(`Tab ${tabId} not found while waiting for load`);
    const loading = await getTabLoadingState(debugPort, tabId).catch(() => false);
    if (!loading) return;
    await new Promise<void>(r => setTimeout(r, 300));
  }
  throw new Error(`waitForTabLoad: tab ${tabId} did not finish loading within ${timeoutMs}ms`);
}
