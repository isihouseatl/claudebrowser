// src/cdp/tabs.ts
import CDP from 'chrome-remote-interface';
import { CdpClient } from './client';

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

export async function newTab(port: number, url = 'about:blank'): Promise<string> {
  const target = await CDP.New({ port, url });
  return target.id;
}

export async function closeTab(port: number, id: string): Promise<void> {
  await CDP.Close({ port, id });
}

export async function activateTab(port: number, id: string): Promise<void> {
  await CDP.Activate({ port, id });
}
