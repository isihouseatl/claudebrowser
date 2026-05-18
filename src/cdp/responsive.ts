// src/cdp/responsive.ts
import { CdpClient } from './client';

export interface DeviceProfile {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  userAgent: string;
}

const DEVICE_PRESETS: DeviceProfile[] = [
  {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'Pixel 7',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'Galaxy S23',
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'MacBook Pro',
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  },
  {
    name: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  },
  {
    name: 'Desktop 720p',
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  },
  {
    name: 'Laptop',
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  },
];

export async function setDevicePreset(
  client: CdpClient,
  deviceName: string
): Promise<DeviceProfile> {
  const key = deviceName.toLowerCase();
  const profile = DEVICE_PRESETS.find(p => p.name.toLowerCase() === key);
  if (!profile) {
    const names = DEVICE_PRESETS.map(p => p.name).join(', ');
    throw new Error(`Unknown device preset "${deviceName}". Available: ${names}`);
  }

  await (client.raw.Emulation as any).setDeviceMetricsOverride({
    width: profile.width,
    height: profile.height,
    deviceScaleFactor: profile.deviceScaleFactor,
    mobile: profile.mobile,
    screenWidth: profile.width,
    screenHeight: profile.height,
  });

  await (client.raw.Emulation as any).setUserAgentOverride({
    userAgent: profile.userAgent,
  });

  return profile;
}

export async function setCustomViewport(
  client: CdpClient,
  width: number,
  height: number,
  deviceScaleFactor = 1,
  mobile = false
): Promise<void> {
  await (client.raw.Emulation as any).setDeviceMetricsOverride({
    width,
    height,
    deviceScaleFactor,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

export async function getViewportSize(
  client: CdpClient
): Promise<{ width: number; height: number; devicePixelRatio: number }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `JSON.stringify({ width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio })`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `getViewportSize failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error'}`
    );
  }

  return JSON.parse(result.value as string);
}

export async function resetViewport(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).setDeviceMetricsOverride({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1280,
    screenHeight: 800,
  });
}

export async function checkMediaQuery(
  client: CdpClient,
  query: string
): Promise<boolean> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.matchMedia(${JSON.stringify(query)}).matches`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `checkMediaQuery failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error'}`
    );
  }

  return result.value as boolean;
}

export async function getActiveBreakpoints(client: CdpClient): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var seen = {};
      var results = [];
      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        var rules;
        try { rules = sheets[i].cssRules; } catch (e) { continue; }
        if (!rules) continue;
        for (var j = 0; j < rules.length; j++) {
          var rule = rules[j];
          if (rule instanceof CSSMediaRule) {
            var mediaText = rule.media.mediaText;
            if (!seen[mediaText]) {
              seen[mediaText] = true;
              results.push(mediaText);
            }
          }
        }
      }
      return JSON.stringify(results);
    })()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `getActiveBreakpoints failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error'}`
    );
  }

  return JSON.parse(result.value as string);
}

export async function responsiveScreenshots(
  client: CdpClient,
  sizes?: Array<{ name: string; width: number; height: number }>
): Promise<Array<{ name: string; width: number; height: number; screenshot: string }>> {
  const targets = sizes ?? [
    { name: 'Mobile (375px)', width: 375, height: 667 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Laptop (1280px)', width: 1280, height: 800 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
    { name: 'Desktop 1080p', width: 1920, height: 1080 },
  ];

  const original = await getViewportSize(client);
  const results: Array<{ name: string; width: number; height: number; screenshot: string }> = [];

  try {
    for (const size of targets) {
      await setCustomViewport(client, size.width, size.height);
      const { data } = await client.raw.Page.captureScreenshot({ format: 'png' });
      results.push({ name: size.name, width: size.width, height: size.height, screenshot: data });
    }
  } finally {
    await setCustomViewport(client, original.width, original.height, original.devicePixelRatio);
  }

  return results;
}

export async function findHorizontalOverflow(
  client: CdpClient
): Promise<Array<{ selector: string; overflowWidth: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(function() {
      var overflowing = [];
      var allElements = document.querySelectorAll('*');
      for (var i = 0; i < allElements.length && overflowing.length < 20; i++) {
        var el = allElements[i];
        var style = getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth && style.overflow !== 'visible' && el.clientWidth > 0) {
          var selector = '';
          if (el.id) {
            selector = '#' + el.id;
          } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
            var classes = el.className.trim().split(/\\s+/).slice(0, 3).join('.');
            selector = el.tagName.toLowerCase() + '.' + classes;
          } else {
            var tag = el.tagName.toLowerCase();
            var parent = el.parentElement;
            if (parent) {
              var siblings = Array.prototype.slice.call(parent.children);
              var index = siblings.indexOf(el) + 1;
              selector = tag + ':nth-child(' + index + ')';
            } else {
              selector = tag;
            }
          }
          overflowing.push({ selector: selector, overflowWidth: el.scrollWidth - el.clientWidth });
        }
      }
      return JSON.stringify(overflowing);
    })()`,
    returnByValue: true,
  });

  if (exceptionDetails) {
    throw new Error(
      `findHorizontalOverflow failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown error'}`
    );
  }

  return JSON.parse(result.value as string);
}
