// src/chrome.ts
import { spawn } from 'child_process';
import { readConfig } from './config';

export function buildChromeArgs(port: number, profilePath: string): string[] {
  return [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
  ];
}

export async function isDebugPortOpen(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function waitForDebugPort(port: number, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isDebugPortOpen(port)) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Chrome debug port ${port} did not open within ${timeoutMs}ms`);
}

export function launchChrome(): void {
  const config = readConfig();
  const args = buildChromeArgs(config.debugPort, config.profilePath);
  // spawn with array args — no shell, no injection risk
  const proc = spawn(config.chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}

export async function ensureChrome(): Promise<void> {
  const config = readConfig();
  if (await isDebugPortOpen(config.debugPort)) return;
  launchChrome();
  await waitForDebugPort(config.debugPort);
}
