// tests/cdp/capture.test.ts
import { describe, it, expect, vi } from 'vitest';

const mockEvaluate = vi.fn().mockResolvedValue({ result: { value: '<html></html>' } });
const mockCaptureScreenshot = vi.fn().mockResolvedValue({ data: 'base64imagedata' });
const mockGetFullAXTree = vi.fn().mockResolvedValue({ nodes: [] });
const mockGetLayoutMetrics = vi.fn().mockResolvedValue({ contentSize: { width: 1280, height: 800 } });
const mockSetDeviceMetricsOverride = vi.fn().mockResolvedValue({});
const mockClearDeviceMetricsOverride = vi.fn().mockResolvedValue({});

vi.mock('chrome-remote-interface', () => ({ default: vi.fn() }));

import { CdpClient } from '../../src/cdp/client';

vi.spyOn(CdpClient.prototype as any, 'raw', 'get').mockReturnValue({
  Runtime: { evaluate: mockEvaluate },
  Page: { captureScreenshot: mockCaptureScreenshot, getLayoutMetrics: mockGetLayoutMetrics },
  Accessibility: { getFullAXTree: mockGetFullAXTree },
  Emulation: {
    setDeviceMetricsOverride: mockSetDeviceMetricsOverride,
    clearDeviceMetricsOverride: mockClearDeviceMetricsOverride,
  },
});

import { takeScreenshot, getDom } from '../../src/cdp/capture';

describe('capture', () => {
  it('returns base64 from screenshot', async () => {
    const client = new CdpClient(9222);
    const result = await takeScreenshot(client, false);
    expect(result).toBe('base64imagedata');
  });

  it('returns html from getDom', async () => {
    mockEvaluate.mockResolvedValueOnce({ result: { value: '<div>hello</div>' } });
    const client = new CdpClient(9222);
    const html = await getDom(client, 'div');
    expect(html).toBe('<div>hello</div>');
  });
});
