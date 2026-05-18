// src/cdp/capture.ts
import { CdpClient } from './client';

export async function takeScreenshot(client: CdpClient, fullPage = false): Promise<string> {
  if (fullPage) {
    const { contentSize } = await client.raw.Page.getLayoutMetrics();
    await client.raw.Emulation.setDeviceMetricsOverride({
      width: Math.ceil(contentSize.width),
      height: Math.ceil(contentSize.height),
      deviceScaleFactor: 1,
      mobile: false,
    });
  }
  const { data } = await client.raw.Page.captureScreenshot({ format: 'png' });
  if (fullPage) await client.raw.Emulation.clearDeviceMetricsOverride();
  return data;
}

export async function getAccessibilityTree(client: CdpClient): Promise<string> {
  const { nodes } = await client.raw.Accessibility.getFullAXTree();
  return formatAxNodes(nodes as any[], 0);
}

function formatAxNodes(nodes: any[], depth: number): string {
  return nodes
    .filter(n => n.role?.value && n.role.value !== 'none' && n.role.value !== 'generic')
    .map(n => {
      const indent = '  '.repeat(depth);
      const name = n.name?.value ? ` "${n.name.value}"` : '';
      const val = n.value?.value ? ` = ${n.value.value}` : '';
      const children = n.children?.length ? '\n' + formatAxNodes(n.children, depth + 1) : '';
      return `${indent}[${n.role.value}]${name}${val}${children}`;
    })
    .join('\n');
}

export async function getDom(client: CdpClient, selector?: string): Promise<string> {
  const expr = selector
    ? `document.querySelector(${JSON.stringify(selector)})?.outerHTML ?? 'Element not found'`
    : 'document.body.outerHTML';
  const { result } = await client.raw.Runtime.evaluate({ expression: expr, returnByValue: true });
  return result.value as string;
}
