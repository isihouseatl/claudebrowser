// tests/cdp/client.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('chrome-remote-interface', () => ({ default: vi.fn() }));

import { CdpClient } from '../../src/cdp/client';

describe('CdpClient', () => {
  it('constructs with port', () => {
    const client = new CdpClient(9222);
    expect(client.port).toBe(9222);
    expect(client.isConnected()).toBe(false);
  });

  it('throws when accessing raw before connect', () => {
    const client = new CdpClient(9222);
    expect(() => client.raw).toThrow('CDP client not connected');
  });
});
