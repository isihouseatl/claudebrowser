// src/cdp/geo3.ts
// CDP module for geographic and contact data inspection.
// No DOM lib — all browser APIs are accessed inside Runtime.evaluate expression strings.
//
// Naming notes:
//   getSchemaOrg2         — getSchemaOrg conflicts with json2.ts (imported in server.ts)
//   getGeolocationPermission2 — getGeolocationPermission conflicts with geolocation.ts (imported in server.ts)

import type { CdpClient } from './client';

type McpContent = { content: [{ type: 'text'; text: string }] };

function ok(data: unknown): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): McpContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }] };
}

// 1. Find iframes containing maps (Google Maps, OpenStreetMap, Mapbox URLs)
//    and map containers (.map, #map, [data-map]). Returns id, class, src_preview (max 10).
export async function getMapElements(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const MAP_PATTERNS = ['maps.google', 'google.com/maps', 'openstreetmap.org', 'mapbox.com', 'maps.googleapis.com'];
        const items = [];

        // iframes with map src
        const iframes = document.querySelectorAll('iframe[src]');
        for (const el of iframes) {
          const src = el.getAttribute('src') || '';
          if (MAP_PATTERNS.some(p => src.includes(p))) {
            items.push({
              tag: 'iframe',
              id: el.id || null,
              class: el.className || null,
              src_preview: src.slice(0, 80),
            });
          }
          if (items.length >= 10) break;
        }

        // map containers by class, id, or data-map attribute
        if (items.length < 10) {
          const containers = document.querySelectorAll('.map, #map, [data-map], [id*="map"], [class*="map"]');
          for (const el of containers) {
            if (items.length >= 10) break;
            const tag = el.tagName.toLowerCase();
            if (tag === 'iframe') continue; // already captured above
            const src = el.getAttribute('src') || el.getAttribute('data-src') || null;
            items.push({
              tag,
              id: el.id || null,
              class: el.className || null,
              src_preview: src ? src.slice(0, 80) : null,
            });
          }
        }

        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 2. Find <address> elements and elements with itemtype containing "PostalAddress".
//    Returns text_preview, id (max 10).
export async function getAddressElements(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const seen = new Set();
        const items = [];

        const candidates = [
          ...document.querySelectorAll('address'),
          ...document.querySelectorAll('[itemtype*="PostalAddress"]'),
        ];

        for (const el of candidates) {
          if (items.length >= 10) break;
          if (seen.has(el)) continue;
          seen.add(el);
          const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
          items.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            itemtype: el.getAttribute('itemtype') || null,
            text_preview: text.slice(0, 120),
          });
        }

        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 3. Find <a href="tel:..."> links. Returns href, text (max 20).
export async function getPhoneNumbers(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const links = document.querySelectorAll('a[href^="tel:"]');
        const items = [];
        for (const el of links) {
          if (items.length >= 20) break;
          items.push({
            href: el.getAttribute('href'),
            text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
          });
        }
        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 4. Find <a href="mailto:..."> links. Returns href, text (max 20).
export async function getEmailLinks(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const links = document.querySelectorAll('a[href^="mailto:"]');
        const items = [];
        for (const el of links) {
          if (items.length >= 20) break;
          items.push({
            href: el.getAttribute('href'),
            text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
          });
        }
        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 5. Find <a> elements linking to social platforms. Returns platform, href, text (max 20).
export async function getSocialLinks(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const PLATFORMS = [
          { name: 'twitter',   patterns: ['twitter.com', 'x.com'] },
          { name: 'facebook',  patterns: ['facebook.com', 'fb.com'] },
          { name: 'instagram', patterns: ['instagram.com'] },
          { name: 'linkedin',  patterns: ['linkedin.com'] },
          { name: 'youtube',   patterns: ['youtube.com', 'youtu.be'] },
          { name: 'tiktok',    patterns: ['tiktok.com'] },
          { name: 'github',    patterns: ['github.com'] },
        ];

        const links = document.querySelectorAll('a[href]');
        const items = [];

        for (const el of links) {
          if (items.length >= 20) break;
          const href = el.getAttribute('href') || '';
          let matched = null;
          for (const p of PLATFORMS) {
            if (p.patterns.some(pat => href.includes(pat))) {
              matched = p.name;
              break;
            }
          }
          if (!matched) continue;
          items.push({
            platform: matched,
            href: href.slice(0, 200),
            text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
          });
        }

        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 6. Find JSON-LD <script> tags with schema.org @context.
//    Returns type, name_preview (max 10).
//    NOTE: Named getSchemaOrg2 — getSchemaOrg already imported from json2.ts in server.ts.
export async function getSchemaOrg2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        const items = [];

        for (const el of scripts) {
          if (items.length >= 10) break;
          try {
            const data = JSON.parse(el.textContent || '{}');
            const context = (data['@context'] || '').toString();
            if (!context.includes('schema.org')) continue;
            const type = Array.isArray(data['@type'])
              ? data['@type'].join(', ')
              : (data['@type'] || null);
            const name = (data['name'] || data['headline'] || data['title'] || '');
            items.push({
              type,
              name_preview: name.toString().slice(0, 80),
              context,
            });
          } catch (_) {
            items.push({ type: null, name_preview: null, parse_error: true });
          }
        }

        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 7. Find elements with itemscope + itemtype (HTML Microdata).
//    Returns itemtype, id, text_preview (max 10).
export async function getMicrodata(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `
      (() => {
        const els = document.querySelectorAll('[itemscope][itemtype]');
        const items = [];
        for (const el of els) {
          if (items.length >= 10) break;
          const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
          items.push({
            itemtype: el.getAttribute('itemtype'),
            id: el.id || null,
            tag: el.tagName.toLowerCase(),
            text_preview: text.slice(0, 120),
          });
        }
        return items;
      })()
    `,
    returnByValue: true,
  });
  if (exceptionDetails) {
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  return ok(result.value);
}

// 8. Check the Permissions API for the 'geolocation' permission.
//    Returns { state } or { supported: false }.
//    NOTE: Named getGeolocationPermission2 — getGeolocationPermission already imported
//    from geolocation.ts in server.ts.
export async function getGeolocationPermission2(client: CdpClient): Promise<McpContent> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `navigator.permissions.query({name:'geolocation'}).then(r => JSON.stringify({state: r.state}))`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    if (exceptionDetails.exception?.description?.includes('navigator.permissions')) {
      return ok({ supported: false });
    }
    return err(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'Unknown error');
  }
  try {
    return ok(JSON.parse(result.value as string));
  } catch {
    return ok({ supported: false });
  }
}
