// src/config.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  chromePath: string;
  debugPort: number;
  profilePath: string;
  navigationTimeoutMs: number;
  reconnectAttempts: number;
  reconnectIntervalMs: number;
  authChecks?: Array<{ name: string; url: string; loginUrlPattern: string; loggedInSelector?: string; loggedOutSelector?: string }>;
}

export const DEFAULT_CONFIG: Config = {
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  debugPort: 9222,
  profilePath: join(homedir(), '.claudebrowser', 'chrome-profile'),
  navigationTimeoutMs: 10000,
  reconnectAttempts: 15,
  reconnectIntervalMs: 2000,
};

function getConfigDir(): string {
  return process.env.CLAUDEBROWSER_HOME ?? join(homedir(), '.claudebrowser');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function configExists(): boolean {
  return existsSync(getConfigPath());
}

export function readConfig(): Config {
  if (!configExists()) return { ...DEFAULT_CONFIG };
  const raw = readFileSync(getConfigPath(), 'utf-8');
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

export function writeConfig(config: Config): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}
