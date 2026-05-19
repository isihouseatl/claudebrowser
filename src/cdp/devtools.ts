// src/cdp/devtools.ts
import type { CdpClient } from './client';

type McpResult = { content: [{ type: 'text'; text: string }] };

function ok(v: unknown): McpResult {
  const text = typeof v === 'string' ? v : JSON.stringify(v);
  return { content: [{ type: 'text' as const, text }] };
}

function err(msg: string): McpResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. List all CDP targets via Target.getTargets
export async function getCdpTargets(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const result = await (client.raw.Target as any).getTargets();
    const targets = (result.targetInfos as any[]).map((t: any) => ({
      targetId: t.targetId,
      type: t.type,
      title: t.title,
      url: t.url,
    }));
    return ok(targets);
  } catch (e) {
    return err(`getCdpTargets failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 2. Get browser version info via Browser.getVersion
export async function getCdpVersion(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const result = await (client.raw.Browser as any).getVersion();
    return ok({
      protocolVersion: result.protocolVersion,
      product: result.product,
      revision: result.revision,
      userAgent: result.userAgent,
    });
  } catch (e) {
    return err(`getCdpVersion failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 3. Enable a CDP domain by name (e.g. "DOM", "CSS", "Network")
export async function enableCdpDomain(
  client: CdpClient,
  domain: string,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const domainObj = (client.raw as any)[domain];
    if (!domainObj || typeof domainObj.enable !== 'function') {
      return err(`Domain "${domain}" not found or has no enable() method`);
    }
    await domainObj.enable();
    return ok(`Domain "${domain}" enabled successfully`);
  } catch (e) {
    return err(`enableCdpDomain("${domain}") failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 4. Get names of all Performance metrics via Performance.getMetrics
export async function getCdpMetricNames(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Performance as any).enable();
    const result = await (client.raw.Performance as any).getMetrics();
    const names = (result.metrics as any[]).map((m: any) => m.name);
    return ok(names);
  } catch (e) {
    return err(`getCdpMetricNames failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 5. Override device metrics for responsive testing
//    Named setDeviceMetrics2 to avoid conflict with cdp/emulation.ts export
export async function setDeviceMetrics2(
  client: CdpClient,
  width: number,
  height: number,
  mobile: boolean,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Emulation as any).setDeviceMetricsOverride({
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    return ok(`Device metrics set: ${width}x${height}, mobile=${mobile}`);
  } catch (e) {
    return err(`setDeviceMetrics2 failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 6. Clear device metrics override to restore normal viewport
//    Named clearDeviceMetrics2 to avoid conflict with cdp/emulation.ts export
export async function clearDeviceMetrics2(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Emulation as any).clearDeviceMetricsOverride();
    return ok('Device metrics override cleared');
  } catch (e) {
    return err(`clearDeviceMetrics2 failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 7. List all available CDP domains via Schema.getDomains
export async function getCdpDomains(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const result = await (client.raw.Schema as any).getDomains();
    const domains = (result.domains as any[]).map((d: any) => ({
      name: d.name,
      version: d.version,
    }));
    return ok(domains);
  } catch (e) {
    return err(`getCdpDomains failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// 8. Enable the Network domain so requests will be captured by event listeners
export async function captureNetworkLog(
  client: CdpClient,
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Network as any).enable();
    return ok('Network domain enabled. Requests are now being captured. Listen to Network.requestWillBeSent and Network.responseReceived events to log traffic.');
  } catch (e) {
    return err(`captureNetworkLog failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
