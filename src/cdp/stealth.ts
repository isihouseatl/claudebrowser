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

// Call this right after connect() to inject stealth patches.
// Uses Page.addScriptToEvaluateOnNewDocument so patches survive navigation.
export async function applyStealthPatches(client: CdpClient): Promise<void> {
  await client.raw.Page.addScriptToEvaluateOnNewDocument({ source: PATCH_SCRIPT });
}
