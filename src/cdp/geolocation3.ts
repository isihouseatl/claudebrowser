// src/cdp/geolocation3.ts
import { CdpClient } from './client';

// Set geolocation accuracy only, preserving existing lat/lng by re-reading from the page first.
// CDP accepts partial setGeolocationOverride — passing only accuracy works when lat/lng are omitted
// as the browser keeps the last set values. If no prior position is set, falls back to a
// neutral coords pair with the requested accuracy.
export async function setGeolocationAccuracy(
  client: CdpClient,
  accuracy: number
): Promise<void> {
  // Attempt to read existing position from the page so we can re-assert with new accuracy.
  const expression = `
    new Promise((res) => {
      if (!navigator.geolocation) { res(null); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => res(null),
        { timeout: 2000, maximumAge: Infinity }
      );
    })
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error getting current position: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }

  const coords = result.value as { latitude: number; longitude: number } | null;

  if (coords) {
    await (client.raw.Emulation as any).setGeolocationOverride({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy,
    });
  } else {
    // No prior position available — pass accuracy alone and let CDP decide.
    await (client.raw.Emulation as any).setGeolocationOverride({ accuracy });
  }
}

// Walk through an array of coordinates, setting geolocation at each step.
// intervalMs controls the delay between steps (default 1000ms).
export async function simulateMovement(
  client: CdpClient,
  steps: Array<{ lat: number; lng: number }>,
  intervalMs = 1000
): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    const { lat, lng } = steps[i];
    await (client.raw.Emulation as any).setGeolocationOverride({
      latitude: lat,
      longitude: lng,
      accuracy: 10,
    });
    if (i < steps.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

// Set geolocation with GPS-level accuracy (accuracy: 1 metre).
export async function setHighAccuracyMode(
  client: CdpClient,
  lat: number,
  lng: number
): Promise<void> {
  await (client.raw.Emulation as any).setGeolocationOverride({
    latitude: lat,
    longitude: lng,
    accuracy: 1,
  });
}

// Set geolocation with network-level accuracy (accuracy: 150 metres).
export async function setLowAccuracyMode(
  client: CdpClient,
  lat: number,
  lng: number
): Promise<void> {
  await (client.raw.Emulation as any).setGeolocationOverride({
    latitude: lat,
    longitude: lng,
    accuracy: 150,
  });
}

// Spoof the battery status API.
// level: 0.0 – 1.0 (fraction, e.g. 0.72 = 72%).
// charging defaults to false.
export async function setBatteryLevel(
  client: CdpClient,
  level: number,
  charging?: boolean
): Promise<void> {
  await (client.raw.Emulation as any).setBatteryOverride({
    level,
    charging: charging ?? false,
  });
}

// Remove battery status override, restoring real battery information.
export async function clearBatteryOverride(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).clearBatteryOverride({});
}

// Override screen orientation.
// type: one of 'portraitPrimary' | 'landscapePrimary' | 'portraitSecondary' | 'landscapeSecondary'
// angle: rotation angle in degrees (0, 90, 180, or 270 depending on type).
export async function setScreenOrientation(
  client: CdpClient,
  type: 'portraitPrimary' | 'landscapePrimary' | 'portraitSecondary' | 'landscapeSecondary',
  angle: number
): Promise<void> {
  await (client.raw.Emulation as any).setScreenOrientationOverride({ type, angle });
}

// Clear screen orientation override, restoring the real device orientation.
// CDP does not have a dedicated clearScreenOrientationOverride command, so we use
// clearDeviceOrientationOverride when available, then fall back to a JS-side unlock.
export async function clearScreenOrientation(client: CdpClient): Promise<void> {
  try {
    await (client.raw.Emulation as any).clearDeviceOrientationOverride({});
  } catch {
    // Fallback: unlock orientation via the Screen Orientation API if the CDP command
    // is unavailable or returns an error.
    const expression = `
      (function() {
        try { screen.orientation.unlock(); return 'unlocked'; } catch (e) { return e.message; }
      })()
    `;
    const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: false,
    });
    if (exceptionDetails) {
      throw new Error(
        `JS error clearing screen orientation: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
      );
    }
    // result.value is the return string — not fatal if unlock is unsupported in context.
    void result.value;
  }
}
