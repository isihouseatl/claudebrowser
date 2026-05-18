// src/cdp/stealth.ts
import { CdpClient } from './client';

const PATCH_SCRIPT = `
(function () {
  // 1. Remove navigator.webdriver
  try {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true,
    });
  } catch (_) {}

  // 2. Spoof navigator.plugins with 3 fake entries
  try {
    const makeMimeType = (type, description, suffixes) => {
      const mt = Object.create(MimeType.prototype);
      Object.defineProperties(mt, {
        type:        { get: () => type,        enumerable: true },
        description: { get: () => description, enumerable: true },
        suffixes:    { get: () => suffixes,    enumerable: true },
      });
      return mt;
    };

    const makePlugin = (name, description, filename, mimeTypes) => {
      const plugin = Object.create(Plugin.prototype);
      Object.defineProperties(plugin, {
        name:        { get: () => name,        enumerable: true },
        description: { get: () => description, enumerable: true },
        filename:    { get: () => filename,    enumerable: true },
        length:      { get: () => mimeTypes.length, enumerable: true },
      });
      mimeTypes.forEach((mt, i) => {
        Object.defineProperty(plugin, i, { get: () => mt, enumerable: true });
      });
      return plugin;
    };

    const pdfMime = makeMimeType('application/pdf', 'Portable Document Format', 'pdf');
    const pdfMime2 = makeMimeType('text/pdf', 'Portable Document Format', 'pdf');
    const nacl = makeMimeType('application/x-nacl', 'Native Client Executable', 'nexe');

    const fakePlugins = [
      makePlugin('PDF Viewer',        'Portable Document Format',  'internal-pdf-viewer',  [pdfMime]),
      makePlugin('Chrome PDF Viewer', 'Portable Document Format',  'internal-pdf-viewer',  [pdfMime2]),
      makePlugin('Native Client',     'Native Client',             'internal-nacl-plugin',  [nacl]),
    ];

    const pluginArray = Object.create(PluginArray.prototype);
    Object.defineProperty(pluginArray, 'length', { get: () => fakePlugins.length, enumerable: true });
    fakePlugins.forEach((p, i) => {
      Object.defineProperty(pluginArray, i, { get: () => p, enumerable: true });
    });

    Object.defineProperty(navigator, 'plugins', {
      get: () => pluginArray,
      configurable: true,
    });
  } catch (_) {}

  // 3. Spoof navigator.languages if not already set
  try {
    if (!navigator.languages || navigator.languages.length === 0) {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true,
      });
    }
  } catch (_) {}
})();
`;

// Full stealth patch for social media / anti-bot sites (Instagram, TikTok, Meta Ads).
// Patches webdriver flag, chrome object, permissions, notifications, WebGL, canvas,
// hardware concurrency, device memory, connection type, and screen properties.
const SOCIAL_STEALTH_SCRIPT = `
(function () {
  // 1. Remove navigator.webdriver
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
  } catch (_) {}

  // 2. Inject window.chrome (Chrome-specific object that Instagram checks for)
  try {
    if (!window.chrome) {
      window.chrome = {
        app: {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        },
        runtime: {
          OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
          OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
          PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
          RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
        },
      };
    }
  } catch (_) {}

  // 3. Spoof Permissions API — return 'granted' for notification queries
  try {
    const origQuery = window.Permissions && window.Permissions.prototype.query;
    if (origQuery) {
      window.Permissions.prototype.query = function (parameters) {
        if (parameters && parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission, onchange: null });
        }
        return origQuery.apply(this, arguments);
      };
    }
  } catch (_) {}

  // 4. Spoof Notification.permission — CDP automation often shows 'denied'
  try {
    if (Notification.permission === 'denied' || Notification.permission === 'default') {
      Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
    }
  } catch (_) {}

  // 5. Spoof navigator.plugins (3 realistic entries)
  try {
    const makeMimeType = (type, desc, sfx) => {
      const m = Object.create(MimeType.prototype);
      Object.defineProperties(m, { type: { get: () => type }, description: { get: () => desc }, suffixes: { get: () => sfx } });
      return m;
    };
    const makePlugin = (name, desc, filename, mimes) => {
      const p = Object.create(Plugin.prototype);
      Object.defineProperties(p, { name: { get: () => name }, description: { get: () => desc }, filename: { get: () => filename }, length: { get: () => mimes.length } });
      mimes.forEach((m, i) => Object.defineProperty(p, i, { get: () => m }));
      return p;
    };
    const pm1 = makeMimeType('application/pdf', 'Portable Document Format', 'pdf');
    const pm2 = makeMimeType('text/pdf', 'Portable Document Format', 'pdf');
    const plugins = [
      makePlugin('PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer', [pm1]),
      makePlugin('Chrome PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer', [pm2]),
    ];
    const arr = Object.create(PluginArray.prototype);
    Object.defineProperty(arr, 'length', { get: () => plugins.length });
    plugins.forEach((p, i) => Object.defineProperty(arr, i, { get: () => p }));
    Object.defineProperty(navigator, 'plugins', { get: () => arr, configurable: true });
  } catch (_) {}

  // 6. Spoof navigator.languages
  try {
    if (!navigator.languages || navigator.languages.length === 0) {
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
    }
  } catch (_) {}

  // 7. Spoof hardwareConcurrency (typical: 4 or 8)
  try {
    const real = navigator.hardwareConcurrency || 4;
    const spoofed = real > 8 ? 8 : (real < 4 ? 4 : real);
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => spoofed, configurable: true });
  } catch (_) {}

  // 8. Spoof deviceMemory (typical: 4 or 8 GB)
  try {
    if (navigator.deviceMemory !== undefined) {
      const real = navigator.deviceMemory;
      const spoofed = real > 8 ? 8 : (real < 4 ? 4 : real);
      Object.defineProperty(navigator, 'deviceMemory', { get: () => spoofed, configurable: true });
    }
  } catch (_) {}

  // 9. Spoof connection type
  try {
    if (navigator.connection) {
      Object.defineProperties(navigator.connection, {
        effectiveType: { get: () => '4g', configurable: true },
        rtt:           { get: () => 50,  configurable: true },
        downlink:      { get: () => 10,  configurable: true },
        saveData:      { get: () => false, configurable: true },
      });
    }
  } catch (_) {}

  // 10. Add subtle canvas noise (single pixel randomization to break canvas fingerprinting)
  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
      const ctx = this.getContext('2d');
      if (ctx) {
        // Add imperceptible noise to 1 pixel
        const pixel = ctx.getImageData(0, 0, 1, 1);
        pixel.data[0] = pixel.data[0] ^ 1;
        ctx.putImageData(pixel, 0, 0);
      }
      return origToDataURL.apply(this, arguments);
    };
  } catch (_) {}

  // 11. Spoof WebGL renderer strings
  try {
    const origGetParam = WebGLRenderingContext.prototype.getParameter;
    const UNMASKED_VENDOR_WEBGL = 0x9245;
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    WebGLRenderingContext.prototype.getParameter = function (param) {
      if (param === UNMASKED_VENDOR_WEBGL)   return 'Intel Inc.';
      if (param === UNMASKED_RENDERER_WEBGL) return 'Intel Iris OpenGL Engine';
      return origGetParam.apply(this, arguments);
    };
  } catch (_) {}

  // 12. Remove CDP-specific properties from window
  try {
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  } catch (_) {}
})();
`;

// Call this right after connect() to inject stealth patches.
// Uses Page.addScriptToEvaluateOnNewDocument so patches survive navigation.
export async function applyStealthPatches(client: CdpClient): Promise<void> {
  await client.raw.Page.addScriptToEvaluateOnNewDocument({ source: PATCH_SCRIPT });
}

// Stronger stealth for social media sites (Instagram, TikTok, Meta Ads).
// Patches: webdriver, window.chrome, permissions, notifications, plugins,
// languages, hardwareConcurrency, deviceMemory, connection, canvas, WebGL, CDP leftovers.
export async function applySocialStealth(client: CdpClient): Promise<void> {
  await client.raw.Page.addScriptToEvaluateOnNewDocument({ source: SOCIAL_STEALTH_SCRIPT });
  // Also run immediately on the current page in case it's already loaded
  await client.raw.Runtime.evaluate({ expression: SOCIAL_STEALTH_SCRIPT });
}
