// src/cdp/geo2.ts
// CDP module for geolocation and device API inspection.
// No DOM lib — all browser APIs are accessed inside Runtime.evaluate expression strings.

import { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }, null, 2) }] };
}

// 1. Check geolocation API support and permission state.
export async function getGeolocationSupport(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (async () => {
        const supported = 'geolocation' in navigator;
        let permissionState = null;
        if (supported && navigator.permissions) {
          try {
            const status = await navigator.permissions.query({ name: 'geolocation' });
            permissionState = status.state;
          } catch (e) {
            permissionState = 'query-failed';
          }
        }
        return { supported, permissionState };
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as { supported: boolean; permissionState: string | null });
}

// 2. Get timezone identifier and UTC offset from the browser.
// NOTE: Named getTimezone2 to avoid conflict with getTimezone imported in server.ts from geolocation2.ts.
export async function getTimezone2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offsetMinutes = new Date().getTimezoneOffset();
        return { timezone, offsetMinutes };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as { timezone: string; offsetMinutes: number });
}

// 3. Get the browser's language and languages list.
export async function getLanguages(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        return {
          language: navigator.language,
          languages: Array.from(navigator.languages),
        };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as { language: string; languages: string[] });
}

// 4. Get navigator.userAgentData (modern browsers) or fall back to userAgent string.
export async function getUserAgentData(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        if (navigator.userAgentData) {
          return {
            brands: navigator.userAgentData.brands,
            mobile: navigator.userAgentData.mobile,
            platform: navigator.userAgentData.platform,
          };
        }
        return { userAgent: navigator.userAgent };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as Record<string, unknown>);
}

// 5. Query the Battery Status API.
export async function getBatteryInfo(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (async () => {
        if (!navigator.getBattery) {
          return { supported: false };
        }
        try {
          const battery = await navigator.getBattery();
          return {
            supported: true,
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
          };
        } catch (e) {
          return { supported: false };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as Record<string, unknown>);
}

// 6. Query the Network Information API (navigator.connection).
export async function getNetworkInfo(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const conn = navigator.connection;
        if (!conn) {
          return { supported: false };
        }
        return {
          supported: true,
          effectiveType: conn.effectiveType ?? null,
          downlink: conn.downlink ?? null,
          rtt: conn.rtt ?? null,
          saveData: conn.saveData ?? null,
        };
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as Record<string, unknown>);
}

// 7. Count media devices by kind (no labels for privacy).
export async function getMediaDevices(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          return { supported: false };
        }
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const counts = { audioinput: 0, audiooutput: 0, videoinput: 0 };
          for (const d of devices) {
            if (d.kind === 'audioinput') counts.audioinput++;
            else if (d.kind === 'audiooutput') counts.audiooutput++;
            else if (d.kind === 'videoinput') counts.videoinput++;
          }
          return { supported: true, ...counts };
        } catch (e) {
          return { supported: false };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as Record<string, unknown>);
}

// 8. Query common browser permissions and return their states.
export async function getPermissions(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (async () => {
        const names = ['camera', 'microphone', 'notifications', 'clipboard-read', 'clipboard-write'];
        const results = [];
        for (const name of names) {
          try {
            const status = await navigator.permissions.query({ name });
            results.push({ name, state: status.state });
          } catch (e) {
            results.push({ name, state: 'unsupported' });
          }
        }
        return results;
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value as Array<{ name: string; state: string }>);
}
