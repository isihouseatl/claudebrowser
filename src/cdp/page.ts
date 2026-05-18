// src/cdp/page.ts
import { CdpClient } from './client';

export async function navigate(
  client: CdpClient,
  url: string,
  timeoutMs = 10000
): Promise<{ url: string; title: string }> {
  const loadPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Navigation timeout after ${timeoutMs}ms`)), timeoutMs);
    client.raw.Page.loadEventFired(() => { clearTimeout(timer); resolve(); });
  });
  await client.raw.Page.navigate({ url });
  await loadPromise;
  const { result } = await client.raw.Runtime.evaluate({
    expression: 'JSON.stringify({ url: location.href, title: document.title })',
    returnByValue: true,
  });
  return JSON.parse(result.value as string);
}

export async function reload(client: CdpClient, timeoutMs = 10000): Promise<void> {
  const loadPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Reload timeout')), timeoutMs);
    client.raw.Page.loadEventFired(() => { clearTimeout(timer); resolve(); });
  });
  await client.raw.Page.reload({});
  await loadPromise;
}

export async function goBack(client: CdpClient): Promise<string> {
  await client.raw.Runtime.evaluate({ expression: 'history.back()' });
  await new Promise(r => setTimeout(r, 500));
  const { result } = await client.raw.Runtime.evaluate({ expression: 'location.href', returnByValue: true });
  return result.value as string;
}

export async function scroll(
  client: CdpClient,
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number
): Promise<void> {
  const x = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
  const y = direction === 'up' ? -amount : direction === 'down' ? amount : 0;
  await client.raw.Runtime.evaluate({ expression: `window.scrollBy(${x}, ${y})` });
}

export async function waitForSelector(
  client: CdpClient,
  selector: string,
  timeoutMs = 10000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { result } = await client.raw.Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Element "${selector}" not found within ${timeoutMs}ms`);
}
