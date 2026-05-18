// tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';

process.env.CLAUDEBROWSER_HOME = join(tmpdir(), 'claudebrowser-test-' + Date.now());

import { readConfig, writeConfig, configExists, DEFAULT_CONFIG } from '../src/config';

describe('config', () => {
  const home = process.env.CLAUDEBROWSER_HOME!;

  beforeEach(() => mkdirSync(home, { recursive: true }));
  afterEach(() => rmSync(home, { recursive: true, force: true }));

  it('returns default config when no file exists', () => {
    const cfg = readConfig();
    expect(cfg.debugPort).toBe(9222);
    expect(cfg.navigationTimeoutMs).toBe(10000);
    expect(cfg.reconnectAttempts).toBe(15);
  });

  it('reads written config', () => {
    writeConfig({ ...DEFAULT_CONFIG, debugPort: 9333 });
    const cfg = readConfig();
    expect(cfg.debugPort).toBe(9333);
  });

  it('configExists returns false when no file', () => {
    expect(configExists()).toBe(false);
  });

  it('configExists returns true after write', () => {
    writeConfig(DEFAULT_CONFIG);
    expect(configExists()).toBe(true);
  });
});
