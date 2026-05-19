// src/cdp/geolocation.ts
import type { CdpClient } from './client';

function ok(value: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}
function err(msg: string): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
}

// 1. Override geolocation using CDP Emulation domain
export async function setGeolocation(
  client: CdpClient,
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Emulation as any).setGeolocationOverride({
      latitude,
      longitude,
      accuracy: accuracy ?? 100,
    });
    return ok('Geolocation set');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 2. Clear geolocation override
export async function clearGeolocation(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Emulation as any).clearGeolocationOverride();
    return ok('Geolocation cleared');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 3. Check geolocation permission state via navigator.permissions API
export async function getGeolocationPermission(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `navigator.permissions.query({ name: 'geolocation' }).then(r => r.state)`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'permission query failed');
    }
    return ok({ state: result.value as 'granted' | 'denied' | 'prompt' });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 4. Check if the geolocation API is available in the browser context
export async function isGeolocationSupported(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `typeof navigator.geolocation !== 'undefined'`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'geolocation support check failed');
    }
    return ok({ supported: result.value as boolean });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 5. Dispatch a DeviceOrientationEvent to the page
export async function setDeviceOrientation(
  client: CdpClient,
  alpha: number,
  beta: number,
  gamma: number
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: ${alpha}, beta: ${beta}, gamma: ${gamma}, absolute: false }))`;
    const { exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'dispatch failed');
    }
    return ok('Device orientation event dispatched');
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 6. Get browser timezone via Intl API
export async function getTimezone(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression: `Intl.DateTimeFormat().resolvedOptions().timeZone`,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'timezone read failed');
    }
    return ok({ timezone: result.value as string });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 7. Override browser timezone using CDP Emulation domain
export async function setTimezoneOverride(
  client: CdpClient,
  timezoneId: string
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    await (client.raw.Emulation as any).setTimezoneOverride({ timezoneId });
    return ok('Timezone set to ' + timezoneId);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// 8. Get browser locale (primary language and full languages list)
export async function getLocale(
  client: CdpClient
): Promise<{ content: [{ type: 'text'; text: string }] }> {
  try {
    const expression = `JSON.stringify({ language: navigator.language, languages: Array.from(navigator.languages) })`;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'locale read failed');
    }
    return ok(result.value as string);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
