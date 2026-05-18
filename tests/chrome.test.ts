// tests/chrome.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({ unref: vi.fn(), pid: 12345 })),
}));

vi.mock('../src/config', () => ({
  readConfig: vi.fn(() => ({
    chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    debugPort: 9222,
    profilePath: '/tmp/test-profile',
    navigationTimeoutMs: 10000,
    reconnectAttempts: 15,
    reconnectIntervalMs: 2000,
  })),
}));

import { buildChromeArgs } from '../src/chrome';

describe('chrome', () => {
  it('builds correct launch args', () => {
    const args = buildChromeArgs(9222, '/tmp/profile');
    expect(args).toContain('--remote-debugging-port=9222');
    expect(args).toContain('--user-data-dir=/tmp/profile');
    expect(args).toContain('--disable-background-timer-throttling');
    expect(args).toContain('--disable-renderer-backgrounding');
    expect(args).toContain('--no-first-run');
  });
});
