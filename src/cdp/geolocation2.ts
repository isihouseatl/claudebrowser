// src/cdp/geolocation2.ts
import { CdpClient } from './client';

interface CityCoords {
  latitude: number;
  longitude: number;
  city: string;
}

const CITY_TABLE: Record<string, CityCoords> = {
  'new york':     { latitude: 40.7128,  longitude: -74.0060,  city: 'New York' },
  'los angeles':  { latitude: 34.0522,  longitude: -118.2437, city: 'Los Angeles' },
  'london':       { latitude: 51.5074,  longitude: -0.1278,   city: 'London' },
  'paris':        { latitude: 48.8566,  longitude: 2.3522,    city: 'Paris' },
  'tokyo':        { latitude: 35.6762,  longitude: 139.6503,  city: 'Tokyo' },
  'sydney':       { latitude: -33.8688, longitude: 151.2093,  city: 'Sydney' },
  'toronto':      { latitude: 43.6532,  longitude: -79.3832,  city: 'Toronto' },
  'chicago':      { latitude: 41.8781,  longitude: -87.6298,  city: 'Chicago' },
  'miami':        { latitude: 25.7617,  longitude: -80.1918,  city: 'Miami' },
  'atlanta':      { latitude: 33.7490,  longitude: -84.3880,  city: 'Atlanta' },
  'lagos':        { latitude: 6.5244,   longitude: 3.3792,    city: 'Lagos' },
  'nairobi':      { latitude: -1.2921,  longitude: 36.8219,   city: 'Nairobi' },
  'accra':        { latitude: 5.6037,   longitude: -0.1870,   city: 'Accra' },
  'dubai':        { latitude: 25.2048,  longitude: 55.2708,   city: 'Dubai' },
  'singapore':    { latitude: 1.3521,   longitude: 103.8198,  city: 'Singapore' },
  'mumbai':       { latitude: 19.0760,  longitude: 72.8777,   city: 'Mumbai' },
  'são paulo':    { latitude: -23.5505, longitude: -46.6333,  city: 'São Paulo' },
  'sao paulo':    { latitude: -23.5505, longitude: -46.6333,  city: 'São Paulo' },
  'mexico city':  { latitude: 19.4326,  longitude: -99.1332,  city: 'Mexico City' },
  'seoul':        { latitude: 37.5665,  longitude: 126.9780,  city: 'Seoul' },
  'berlin':       { latitude: 52.5200,  longitude: 13.4050,   city: 'Berlin' },
};

// Set the browser's geolocation to specific coordinates
export async function setGeolocationCoords(
  client: CdpClient,
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<void> {
  await (client.raw.Emulation as any).setGeolocationOverride({
    latitude,
    longitude,
    accuracy: accuracy ?? 10,
  });
}

// Set geolocation to a named city (lookup table of major cities)
export async function setGeolocationCity(
  client: CdpClient,
  city: string
): Promise<{ latitude: number; longitude: number; city: string }> {
  const key = city.toLowerCase().trim();
  const entry = CITY_TABLE[key];
  if (!entry) {
    throw new Error(
      `Unknown city: ${JSON.stringify(city)}. Supported cities: ${Object.values(CITY_TABLE).map(c => c.city).join(', ')}`
    );
  }
  await setGeolocationCoords(client, entry.latitude, entry.longitude);
  return { latitude: entry.latitude, longitude: entry.longitude, city: entry.city };
}

// Clear geolocation override (revert to real location)
export async function clearGeolocationOverride(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).clearGeolocationOverride();
}

// Get the current geolocation as reported by navigator.geolocation.getCurrentPosition
export async function getCurrentGeolocation(
  client: CdpClient,
  timeoutMs?: number
): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  const timeout = timeoutMs ?? 5000;
  const expression = `
    new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => res(null),
        { timeout: ${timeout} }
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
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return (result.value as { latitude: number; longitude: number; accuracy: number } | null) ?? null;
}

// Set the browser timezone (e.g. "America/New_York", "Europe/London")
export async function setTimezone(client: CdpClient, timezoneId: string): Promise<void> {
  await (client.raw.Emulation as any).setTimezoneOverride({ timezoneId });
}

// Get the current timezone as reported by the browser
export async function getTimezone(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `Intl.DateTimeFormat().resolvedOptions().timeZone`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Set locale/language (e.g. "en-US", "fr-FR")
export async function setLocale(client: CdpClient, locale: string): Promise<void> {
  await (client.raw.Emulation as any).setLocaleOverride({ locale });
}

// Get current browser locale
export async function getLocale(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.language`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}
