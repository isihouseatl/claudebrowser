// src/cdp/tabs.ts
import CDP from 'chrome-remote-interface';
import { CdpClient } from './client';
import { claimTab, releaseTab, getSessionTabs, isTabOwnedByOther, atomicClaimForClose } from '../session';

export interface TabInfo {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

export async function listTabs(client: CdpClient): Promise<TabInfo[]> {
  const targets = await client.listTargets();
  const pages = targets.filter(t => t.type === 'page');
  return pages.map((t, i) => ({ id: t.id, url: t.url, title: t.title, active: i === 0 }));
}

export async function newTab(port: number, url = 'about:blank', sessionId?: string): Promise<string> {
  const target = await CDP.New({ port, url });
  if (sessionId) {
    claimTab(sessionId, target.id);
  }
  return target.id;
}

export async function closeTab(port: number, id: string, sessionId?: string): Promise<void> {
  if (sessionId) {
    // Atomically check ownership and pre-release the tab so no other session
    // can race between the check and the actual CDP.Close call.
    const { canClose, ownerSessionId } = atomicClaimForClose(sessionId, id);
    if (!canClose) {
      throw new Error(`Tab ${id} is owned by session ${ownerSessionId}. Use browser_tabs to see your tabs.`);
    }
    // Tab is pre-released from registry; just close it in Chrome.
    await CDP.Close({ port, id });
  } else {
    await CDP.Close({ port, id });
  }
}

export async function activateTab(port: number, id: string): Promise<void> {
  await CDP.Activate({ port, id });
}

export async function listSessionTabs(client: CdpClient, sessionId: string): Promise<TabInfo[]> {
  const allTabs = await listTabs(client);
  const sessionTabIds = getSessionTabs(sessionId);
  const filtered = allTabs.filter(t => sessionTabIds.includes(t.id));
  return filtered.map((t, i) => ({ ...t, active: i === 0 }));
}
