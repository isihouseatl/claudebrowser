// tests/cdp/tabs.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('chrome-remote-interface', () => ({ default: Object.assign(vi.fn(), {
  List: vi.fn(),
  New: vi.fn(),
  Close: vi.fn(),
  Activate: vi.fn(),
}) }));

import { CdpClient } from '../../src/cdp/client';

const mockListTargets = vi.fn().mockResolvedValue([
  { id: 'abc123', url: 'https://example.com', title: 'Example', type: 'page' },
  { id: 'def456', url: 'https://github.com', title: 'GitHub', type: 'page' },
]);

vi.spyOn(CdpClient.prototype, 'listTargets').mockImplementation(mockListTargets);

import { listTabs, TabInfo } from '../../src/cdp/tabs';

describe('tabs', () => {
  it('lists page targets with first as active', async () => {
    const client = new CdpClient(9222);
    const tabs = await listTabs(client);
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toMatchObject({ id: 'abc123', url: 'https://example.com', title: 'Example', active: true });
    expect(tabs[1].active).toBe(false);
  });
});
