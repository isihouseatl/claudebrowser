// src/cdp/emulation.ts
import { CdpClient } from './client';

// Override the browser's User-Agent string
export async function setUserAgent(client: CdpClient, userAgent: string): Promise<void> {
  await client.raw.Emulation.setUserAgentOverride({ userAgent });
}

// Override device screen metrics (useful for mobile testing)
export interface DeviceMetricsOptions {
  width: number;
  height: number;
  deviceScaleFactor?: number;  // default 1
  mobile?: boolean;            // default false
  screenWidth?: number;        // defaults to width
  screenHeight?: number;       // defaults to height
}

export async function setDeviceMetrics(client: CdpClient, opts: DeviceMetricsOptions): Promise<void> {
  await client.raw.Emulation.setDeviceMetricsOverride({
    width: opts.width,
    height: opts.height,
    deviceScaleFactor: opts.deviceScaleFactor ?? 1,
    mobile: opts.mobile ?? false,
    screenWidth: opts.screenWidth ?? opts.width,
    screenHeight: opts.screenHeight ?? opts.height,
  });
}

// Clear device metric overrides (restore to actual screen)
export async function clearDeviceMetrics(client: CdpClient): Promise<void> {
  await client.raw.Emulation.clearDeviceMetricsOverride();
}

// Simulate network conditions
export interface NetworkConditions {
  offline?: boolean;                // default false
  latency?: number;                 // ms, default 0
  downloadThroughput?: number;      // bytes/sec, -1 = no throttle, default -1
  uploadThroughput?: number;        // bytes/sec, -1 = no throttle, default -1
  connectionType?: string;          // 'cellular2g' | 'cellular3g' | 'cellular4g' | 'bluetooth' | 'ethernet' | 'wifi' | 'wimax' | 'other' | 'none' | 'unknown'
}

export async function setNetworkConditions(
  client: CdpClient,
  conditions: NetworkConditions
): Promise<void> {
  await (client.raw.Network as any).emulateNetworkConditions({
    offline: conditions.offline ?? false,
    latency: conditions.latency ?? 0,
    downloadThroughput: conditions.downloadThroughput ?? -1,
    uploadThroughput: conditions.uploadThroughput ?? -1,
    connectionType: conditions.connectionType ?? 'none',
  });
}

// Clear network condition throttling
export async function clearNetworkConditions(client: CdpClient): Promise<void> {
  await (client.raw.Network as any).emulateNetworkConditions({
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
}

// Set GPS geolocation
export async function setGeolocation(
  client: CdpClient,
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<void> {
  await client.raw.Emulation.setGeolocationOverride({
    latitude,
    longitude,
    accuracy: accuracy ?? 100,
  });
}

// Clear geolocation override
export async function clearGeolocation(client: CdpClient): Promise<void> {
  try {
    await (client.raw.Emulation as any).clearGeolocationOverride();
  } catch {
    // Fallback: setGeolocationOverride with no params clears the override
    await (client.raw.Emulation as any).setGeolocationOverride({});
  }
}

// Grant a browser permission for an origin
// permission values: 'geolocation' | 'notifications' | 'camera' | 'microphone' | 'clipboard-read' | 'clipboard-write' etc.
export async function grantPermission(
  client: CdpClient,
  permission: string,
  origin?: string
): Promise<void> {
  const params: { permissions: string[]; origin?: string } = {
    permissions: [permission],
  };
  if (origin !== undefined) {
    params.origin = origin;
  }
  await (client.raw.Browser as any).grantPermissions(params);
}

// Reset all permissions to default
export async function resetPermissions(client: CdpClient): Promise<void> {
  await (client.raw.Browser as any).resetPermissions({});
}
