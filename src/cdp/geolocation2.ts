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

// ---------------------------------------------------------------------------
// New sensor / environment query functions (CRI pattern)
// ---------------------------------------------------------------------------

// Geolocation permission state: {state, supported}
// (name suffixed _3 — getGeolocationPermission and getGeolocationPermission2 already taken)
export async function getGeolocationPermission3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => { try { const r = await navigator.permissions.query({name:'geolocation'}); return {state: r.state, supported: true}; } catch(e) { return {state: 'unknown', supported: false, error: e.message}; } })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Current timezone: {timezone, offset}
// (name suffixed Details — getTimezone already exported above in this file)
export async function getTimezoneDetails(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return {timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, offset: new Date().getTimezoneOffset()}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Browser language preferences: {language, languages}
export async function getLanguagePreferences(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return {language: navigator.language, languages: Array.from(navigator.languages).slice(0, 10)}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Screen and window dimensions: {screenWidth, screenHeight, innerWidth, innerHeight, availWidth, availHeight}
export async function getScreenResolution(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return {screenWidth: screen.width, screenHeight: screen.height, innerWidth: window.innerWidth, innerHeight: window.innerHeight, availWidth: screen.availWidth, availHeight: screen.availHeight}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Device pixel ratio: {devicePixelRatio, isRetina}
// (name suffixed _2 — getDevicePixelRatio already taken by ./cdp/responsive2)
export async function getDevicePixelRatio2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return {devicePixelRatio: window.devicePixelRatio, isRetina: window.devicePixelRatio >= 2}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Network connection info: {effectiveType, downlink, rtt, saveData, online}
export async function getNetworkConnection(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection; return {effectiveType: c ? c.effectiveType : null, downlink: c ? c.downlink : null, rtt: c ? c.rtt : null, saveData: c ? c.saveData : null, online: navigator.onLine}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Battery status if available: {level, charging, chargingTime, dischargingTime}
export async function getBatteryStatus(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => { try { const b = await navigator.getBattery(); return {level: b.level, charging: b.charging, chargingTime: b.chargingTime, dischargingTime: b.dischargingTime}; } catch(e) { return {supported: false, error: e.message}; } })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// CPU and memory info: {hardwareConcurrency, deviceMemory, maxTouchPoints}
export async function getHardwareConcurrency(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return {hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory || null, maxTouchPoints: navigator.maxTouchPoints}; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value, null, 2) }] };
}

// Geolocation permission state: {state, isGranted, isDenied, isPrompt}
export async function getGeolocationPermission4(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => { try { const p = await navigator.permissions.query({ name: 'geolocation' }); return { state: p.state, isGranted: p.state === 'granted', isDenied: p.state === 'denied', isPrompt: p.state === 'prompt' }; } catch(e) { return { state: 'unknown', isGranted: false, isDenied: false, isPrompt: false, error: e.message }; } })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// navigator.geolocation availability: {available, permissionState}
export async function getGeolocationState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async () => { const available = 'geolocation' in navigator; let permissionState = 'unknown'; try { const p = await navigator.permissions.query({ name: 'geolocation' }); permissionState = p.state; } catch(e) {} return { available, permissionState }; })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Map container elements (leaflet, google maps, mapbox): [{tag, id, class_preview, mapType}] (max 10)
export async function getMapElements3(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const results = []; const selectors = ['.leaflet-container', '.gm-style', '.mapboxgl-map', '.ol-viewport', 'div[id*="map"]', 'div[class*="map"]', 'div[id*="Map"]', 'div[class*="Map"]']; const seen = new Set(); for (const sel of selectors) { try { const els = document.querySelectorAll(sel); for (const el of els) { if (seen.has(el)) continue; seen.add(el); let mapType = 'unknown'; if (el.classList.contains('leaflet-container')) mapType = 'leaflet'; else if (el.querySelector('.gm-style') || el.classList.contains('gm-style')) mapType = 'google'; else if (el.classList.contains('mapboxgl-map')) mapType = 'mapbox'; else if (el.classList.contains('ol-viewport')) mapType = 'openlayers'; results.push({ tag: el.tagName.toLowerCase(), id: el.id || null, class_preview: el.className.toString().slice(0, 80), mapType }); if (results.length >= 10) return results; } } catch(e) {} } return results; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Inputs for lat/lng/coordinates: [{id, name, placeholder_preview, type}] (max 20)
export async function getCoordinateInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const results = []; const inputs = document.querySelectorAll('input'); const coordPatterns = /lat|lng|lon|longitude|latitude|coord|geo/i; for (const inp of inputs) { const id = inp.id || ''; const name = inp.name || ''; const ph = inp.placeholder || ''; if (coordPatterns.test(id) || coordPatterns.test(name) || coordPatterns.test(ph)) { results.push({ id: id || null, name: name || null, placeholder_preview: ph.slice(0, 60) || null, type: inp.type || 'text' }); if (results.length >= 20) break; } } return results; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Address/location inputs: [{id, name, placeholder_preview, autocomplete}] (max 20)
export async function getAddressInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const results = []; const inputs = document.querySelectorAll('input'); const addrPatterns = /address|street|city|state|zip|postal|country|suburb|region|location/i; for (const inp of inputs) { const id = inp.id || ''; const name = inp.name || ''; const ph = inp.placeholder || ''; const ac = inp.getAttribute('autocomplete') || ''; if (addrPatterns.test(id) || addrPatterns.test(name) || addrPatterns.test(ph) || addrPatterns.test(ac)) { results.push({ id: id || null, name: name || null, placeholder_preview: ph.slice(0, 60) || null, autocomplete: ac || null }); if (results.length >= 20) break; } } return results; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Location search boxes: [{id, class_preview, placeholder_preview, text_preview}] (max 10)
export async function getLocationSearch(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const results = []; const locPatterns = /location|search.*place|find.*address|where|destination|place/i; const els = document.querySelectorAll('input[type="search"], input[type="text"], [role="searchbox"], [role="combobox"]'); for (const el of els) { const ph = el.getAttribute('placeholder') || ''; const cls = el.className ? el.className.toString() : ''; const id = el.id || ''; const text = (el.value || el.textContent || '').toString().slice(0, 60); if (locPatterns.test(ph) || locPatterns.test(cls) || locPatterns.test(id) || locPatterns.test(text)) { results.push({ id: id || null, class_preview: cls.slice(0, 80), placeholder_preview: ph.slice(0, 60), text_preview: text }); if (results.length >= 10) break; } } return results; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Detected geo libraries: {hasLeaflet, hasGoogleMaps, hasMapbox, hasOpenLayers, hasCesium}
export async function getGeoApiUsage(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { return { hasLeaflet: typeof L !== 'undefined' && typeof L.map === 'function', hasGoogleMaps: typeof google !== 'undefined' && typeof google.maps !== 'undefined', hasMapbox: typeof mapboxgl !== 'undefined', hasOpenLayers: typeof ol !== 'undefined', hasCesium: typeof Cesium !== 'undefined' }; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}

// Browser timezone: {timezone, timezoneOffset, locale, dateFormat}
export async function getTimezoneInfo2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() { const tz = Intl.DateTimeFormat().resolvedOptions(); const offset = -new Date().getTimezoneOffset(); const locale = navigator.language || navigator.languages && navigator.languages[0] || 'unknown'; let dateFormat = null; try { dateFormat = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(2000, 0, 15)); } catch(e) {} return { timezone: tz.timeZone, timezoneOffset: offset, locale, dateFormat }; })()`,
    returnByValue: true,
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result.value) }] };
}
