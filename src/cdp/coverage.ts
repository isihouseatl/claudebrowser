// src/cdp/coverage.ts
import { CdpClient } from './client';

export interface CssRule {
  styleSheetId: string;
  startOffset: number;
  endOffset: number;
  used: boolean;
}

export interface JsCoverageRange {
  startOffset: number;
  endOffset: number;
  count: number;
}

export interface JsScriptCoverage {
  scriptId: string;
  url: string;
  ranges: JsCoverageRange[];
}

// Start CSS rule usage tracking
export async function startCssCoverage(client: CdpClient): Promise<void> {
  await client.raw.CSS.enable();
  await (client.raw.CSS as any).startRuleUsageTracking();
}

// Stop CSS coverage and return used/unused rules
export async function stopCssCoverage(client: CdpClient): Promise<CssRule[]> {
  const result = await (client.raw.CSS as any).stopRuleUsageTracking();
  return result.ruleUsage.map((r: any) => ({
    styleSheetId: r.styleSheetId,
    startOffset: r.startOffset,
    endOffset: r.endOffset,
    used: r.used,
  }));
}

// Start JavaScript precise coverage
export async function startJsCoverage(client: CdpClient): Promise<void> {
  await client.raw.Profiler.enable();
  await (client.raw.Profiler as any).startPreciseCoverage({ callCount: false, detailed: true });
}

// Take a JS coverage snapshot (can be called multiple times without stopping)
export async function takeJsCoverage(client: CdpClient): Promise<JsScriptCoverage[]> {
  const result = await (client.raw.Profiler as any).takePreciseCoverage();
  return result.result.map((s: any) => ({
    scriptId: s.scriptId,
    url: s.url,
    ranges: s.functions.flatMap((f: any) => f.ranges),
  }));
}

// Stop JS coverage, returning a final snapshot
export async function stopJsCoverage(client: CdpClient): Promise<JsScriptCoverage[]> {
  const snapshot = await takeJsCoverage(client);
  await (client.raw.Profiler as any).stopPreciseCoverage();
  return snapshot;
}
