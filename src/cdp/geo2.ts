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

// ─── Map and Geolocation UI Detection ────────────────────────────────────────
// NOTE: getMapMarkers2 — getMapMarkers conflicts with map2.ts (imported in server.ts)
// NOTE: getGeoApiUsage2 — getGeoApiUsage conflicts with geolocation2.ts (imported in server.ts)

// 9. Find map container elements for Leaflet, Google Maps, and Mapbox.
//    Returns tag, id, class, library hint, and bounding dimensions (max 20).
export async function getMapContainers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];
      const seen = new WeakSet();

      // Leaflet containers
      const leaflet = document.querySelectorAll('.leaflet-container');
      for (const el of leaflet) {
        if (seen.has(el) || items.length >= 20) break;
        seen.add(el);
        const r = el.getBoundingClientRect();
        items.push({ library: 'leaflet', tag: el.tagName.toLowerCase(), id: el.id || null, class: el.className.slice(0, 80), width: Math.round(r.width), height: Math.round(r.height) });
      }

      // Google Maps containers
      const gmaps = document.querySelectorAll('[class*="gm-"], [id*="map"], [aria-label*="map"], [aria-label*="Map"]');
      for (const el of gmaps) {
        if (seen.has(el) || items.length >= 20) break;
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style') continue;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.width < 10 && r.height < 10) continue;
        items.push({ library: 'google-maps', tag, id: el.id || null, class: el.className.toString().slice(0, 80), width: Math.round(r.width), height: Math.round(r.height) });
      }

      // Mapbox containers
      const mapbox = document.querySelectorAll('.mapboxgl-map, .maplibregl-map, [class*="mapbox"]');
      for (const el of mapbox) {
        if (seen.has(el) || items.length >= 20) break;
        seen.add(el);
        const r = el.getBoundingClientRect();
        items.push({ library: 'mapbox', tag: el.tagName.toLowerCase(), id: el.id || null, class: el.className.slice(0, 80), width: Math.round(r.width), height: Math.round(r.height) });
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 10. Find GeoJSON script tags or data elements on the page.
//     Returns type, id, preview of content (max 20).
export async function getGeoJsonElements(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];

      // <script type="application/geo+json"> or type containing geojson
      const scripts = document.querySelectorAll('script[type]');
      for (const el of scripts) {
        if (items.length >= 20) break;
        const t = (el.getAttribute('type') || '').toLowerCase();
        if (!t.includes('geojson') && !t.includes('geo+json')) continue;
        const content = (el.textContent || '').trim();
        let parsed = null;
        try { parsed = JSON.parse(content); } catch (_) {}
        items.push({
          source: 'script-tag',
          type: t,
          id: el.id || null,
          geojson_type: parsed && parsed.type ? parsed.type : null,
          feature_count: parsed && parsed.features ? parsed.features.length : null,
          content_preview: content.slice(0, 120),
        });
      }

      // data-geojson attributes
      const dataEls = document.querySelectorAll('[data-geojson]');
      for (const el of dataEls) {
        if (items.length >= 20) break;
        const raw = el.getAttribute('data-geojson') || '';
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) {}
        items.push({
          source: 'data-attribute',
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          geojson_type: parsed && parsed.type ? parsed.type : null,
          feature_count: parsed && parsed.features ? parsed.features.length : null,
          content_preview: raw.slice(0, 120),
        });
      }

      // window.__geojson or window.geojsonData global variables
      const globals = ['__geojson', 'geojsonData', 'mapData', '__mapData'];
      for (const key of globals) {
        if (items.length >= 20) break;
        const val = window[key];
        if (val && typeof val === 'object') {
          items.push({
            source: 'window-global',
            key,
            geojson_type: val.type || null,
            feature_count: Array.isArray(val.features) ? val.features.length : null,
          });
        }
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 11. Find map marker elements across common map libraries.
//     Returns library, tag, class, aria-label, position hint (max 20).
//     NOTE: Named getMapMarkers2 — getMapMarkers conflicts with map2.ts imported in server.ts.
export async function getMapMarkers2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];
      const seen = new WeakSet();

      const selectors = [
        { sel: '.leaflet-marker-icon', lib: 'leaflet' },
        { sel: '.leaflet-div-icon', lib: 'leaflet' },
        { sel: '[class*="gm-style"] img[src*="marker"]', lib: 'google-maps' },
        { sel: '.mapboxgl-marker', lib: 'mapbox' },
        { sel: '.maplibregl-marker', lib: 'maplibre' },
        { sel: '[class*="marker"]', lib: 'generic' },
        { sel: '[role="img"][aria-label*="marker"]', lib: 'generic' },
        { sel: '[role="img"][aria-label*="pin"]', lib: 'generic' },
      ];

      for (const { sel, lib } of selectors) {
        if (items.length >= 20) break;
        let els;
        try { els = document.querySelectorAll(sel); } catch (_) { continue; }
        for (const el of els) {
          if (seen.has(el) || items.length >= 20) break;
          seen.add(el);
          const r = el.getBoundingClientRect();
          items.push({
            library: lib,
            tag: el.tagName.toLowerCase(),
            class: el.className.toString().slice(0, 60),
            aria_label: el.getAttribute('aria-label') || null,
            title: el.getAttribute('title') || null,
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2),
          });
        }
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 12. Find map layer and tile elements (tile images, layer canvases).
//     Returns library, tag, class, src_preview (max 20).
export async function getMapLayers(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];
      const seen = new WeakSet();

      const selectors = [
        { sel: '.leaflet-tile-container img', lib: 'leaflet' },
        { sel: '.leaflet-layer', lib: 'leaflet' },
        { sel: '.leaflet-overlay-pane', lib: 'leaflet' },
        { sel: '.mapboxgl-canvas', lib: 'mapbox' },
        { sel: '.maplibregl-canvas', lib: 'maplibre' },
        { sel: '[class*="gm-style"] canvas', lib: 'google-maps' },
        { sel: '.ol-layer canvas', lib: 'openlayers' },
        { sel: 'canvas[class*="map"]', lib: 'generic' },
        { sel: 'img[src*="tile"]', lib: 'tiles' },
        { sel: 'img[src*="osm"]', lib: 'osm-tiles' },
      ];

      for (const { sel, lib } of selectors) {
        if (items.length >= 20) break;
        let els;
        try { els = document.querySelectorAll(sel); } catch (_) { continue; }
        for (const el of els) {
          if (seen.has(el) || items.length >= 20) break;
          seen.add(el);
          const src = el.getAttribute('src') || null;
          items.push({
            library: lib,
            tag: el.tagName.toLowerCase(),
            class: el.className.toString().slice(0, 60),
            src_preview: src ? src.slice(0, 100) : null,
          });
        }
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 13. Return a map/geo summary state object.
//     Returns { hasMap, hasMarkers, mapLibrary, hasGeolocationPermission }.
export async function getGeoState(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(async function() {
      const hasLeaflet = typeof window.L !== 'undefined' && typeof window.L.map === 'function';
      const hasGoogleMaps = typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
      const hasMapbox = typeof window.mapboxgl !== 'undefined' || typeof window.maplibregl !== 'undefined';
      const hasOpenLayers = typeof window.ol !== 'undefined';

      let mapLibrary = null;
      if (hasLeaflet) mapLibrary = 'leaflet';
      else if (hasGoogleMaps) mapLibrary = 'google-maps';
      else if (hasMapbox) mapLibrary = 'mapbox';
      else if (hasOpenLayers) mapLibrary = 'openlayers';

      const hasMapContainer =
        document.querySelector('.leaflet-container, .mapboxgl-map, .maplibregl-map, [class*="gm-style"]') !== null;
      const hasMarkers =
        document.querySelector('.leaflet-marker-icon, .mapboxgl-marker, .maplibregl-marker') !== null;

      let hasGeolocationPermission = null;
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          hasGeolocationPermission = status.state;
        } catch (_) {
          hasGeolocationPermission = 'query-failed';
        }
      }

      return {
        hasMap: hasMapContainer || mapLibrary !== null,
        hasMarkers,
        mapLibrary,
        hasGeolocationPermission,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 14. Find address/location search input fields on the page.
//     Returns tag, type, name, placeholder, id, aria-label (max 20).
export async function getLocationInputs(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];
      const seen = new WeakSet();

      const inputs = document.querySelectorAll('input, textarea');
      for (const el of inputs) {
        if (seen.has(el) || items.length >= 20) break;
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        const name = (el.getAttribute('name') || '').toLowerCase();
        const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();

        const locationTerms = ['address', 'location', 'place', 'city', 'zip', 'postal', 'street', 'search'];
        const isLocationField =
          locationTerms.some(t => name.includes(t) || placeholder.includes(t) || id.includes(t) || ariaLabel.includes(t)) ||
          autocomplete.includes('address') ||
          autocomplete.includes('postal') ||
          autocomplete === 'street-address';

        if (!isLocationField) continue;
        seen.add(el);
        items.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || null,
          name: el.getAttribute('name') || null,
          id: el.id || null,
          placeholder: el.getAttribute('placeholder') || null,
          aria_label: el.getAttribute('aria-label') || null,
          autocomplete: el.getAttribute('autocomplete') || null,
        });
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 15. Find autocomplete address search elements (dropdowns, suggestion lists).
//     Returns tag, role, class, id, aria attributes (max 20).
export async function getAddressSearch(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const items = [];
      const seen = new WeakSet();

      const selectors = [
        // Google Places autocomplete
        '.pac-container',
        '.pac-item',
        // Generic autocomplete roles
        '[role="combobox"]',
        '[role="listbox"]',
        '[aria-autocomplete="list"]',
        '[aria-autocomplete="both"]',
        // Common patterns
        '[class*="autocomplete"]',
        '[class*="address-search"]',
        '[class*="location-search"]',
        '[class*="place-search"]',
        '[id*="autocomplete"]',
        '[id*="address-suggestions"]',
      ];

      for (const sel of selectors) {
        if (items.length >= 20) break;
        let els;
        try { els = document.querySelectorAll(sel); } catch (_) { continue; }
        for (const el of els) {
          if (seen.has(el) || items.length >= 20) break;
          seen.add(el);
          const r = el.getBoundingClientRect();
          items.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class: el.className.toString().slice(0, 80),
            role: el.getAttribute('role') || null,
            aria_autocomplete: el.getAttribute('aria-autocomplete') || null,
            aria_expanded: el.getAttribute('aria-expanded') || null,
            visible: r.width > 0 && r.height > 0,
            child_count: el.children.length,
          });
        }
      }

      return items;
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}

// 16. Detect which map/geo libraries are loaded on the page.
//     Returns { hasLeaflet, hasGoogleMaps, hasMapbox, hasOpenLayers, hasHereMaps }.
//     NOTE: Named getGeoApiUsage2 — getGeoApiUsage conflicts with geolocation2.ts imported in server.ts.
export async function getGeoApiUsage2(cdp: any): Promise<{ content: [{ type: 'text'; text: string }] }> {
  const { result } = await (cdp as any).raw.Runtime.evaluate({
    expression: `(function() {
      const hasLeaflet = typeof window.L !== 'undefined' && typeof window.L.map === 'function';
      const hasGoogleMaps = typeof window.google !== 'undefined' &&
        typeof window.google.maps !== 'undefined';
      const hasMapbox = typeof window.mapboxgl !== 'undefined';
      const hasMapLibre = typeof window.maplibregl !== 'undefined';
      const hasOpenLayers = typeof window.ol !== 'undefined';
      const hasHereMaps = typeof window.H !== 'undefined' && typeof window.H.Map !== 'undefined';
      const hasCesium = typeof window.Cesium !== 'undefined';
      const hasDeckGl = typeof window.deck !== 'undefined';

      // Check script src hints as fallback
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const srcs = scripts.map(s => (s.getAttribute('src') || '').toLowerCase());
      const scriptHints = {
        leaflet: srcs.some(s => s.includes('leaflet')),
        googleMaps: srcs.some(s => s.includes('maps.googleapis.com') || s.includes('maps.google.com')),
        mapbox: srcs.some(s => s.includes('mapbox')),
        openLayers: srcs.some(s => s.includes('openlayers') || s.includes('/ol.')),
        hereMaps: srcs.some(s => s.includes('js.api.here.com')),
      };

      return {
        hasLeaflet: hasLeaflet || scriptHints.leaflet,
        hasGoogleMaps: hasGoogleMaps || scriptHints.googleMaps,
        hasMapbox: hasMapbox || hasMapLibre || scriptHints.mapbox,
        hasOpenLayers: hasOpenLayers || scriptHints.openLayers,
        hasHereMaps: hasHereMaps || scriptHints.hereMaps,
        hasCesium,
        hasDeckGl,
        scriptCount: scripts.length,
      };
    })()`,
    returnByValue: true,
    awaitPromise: false,
  });
  return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
}
