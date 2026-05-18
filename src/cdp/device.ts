// src/cdp/device.ts
import { CdpClient } from './client';

// Returns core navigator properties describing the browser environment.
export async function getBrowserInfo(client: CdpClient): Promise<{
  userAgent: string;
  vendor: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
}> {
  const expression = `({
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled
  })`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getBrowserInfo: ${exceptionDetails.text}`);
  return result.value;
}

// Returns physical and logical screen dimensions plus pixel density.
export async function getScreenInfo(client: CdpClient): Promise<{
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}> {
  const expression = `({
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio
  })`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getScreenInfo: ${exceptionDetails.text}`);
  return result.value;
}

// Returns true if the page appears to be running on a mobile device based on
// screen width and user-agent string heuristics.
export async function isMobileDevice(client: CdpClient): Promise<boolean> {
  const expression = `(screen.width < 768 || /Mobi|Android/i.test(navigator.userAgent))`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`isMobileDevice: ${exceptionDetails.text}`);
  return result.value;
}

// Returns true if the browser context supports touch input.
export async function isTouchDevice(client: CdpClient): Promise<boolean> {
  const expression = `('ontouchstart' in window || navigator.maxTouchPoints > 0)`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`isTouchDevice: ${exceptionDetails.text}`);
  return result.value;
}

// Probes WebGL, WebGL2, canvas 2D context support, and which video/audio MIME
// types the browser can play. Supported types are returned as string arrays.
export async function getMediaCapabilities(client: CdpClient): Promise<{
  webgl: boolean;
  webgl2: boolean;
  canvas: boolean;
  video: string[];
  audio: string[];
}> {
  const expression = `(() => {
    const canvas = document.createElement('canvas');

    let webgl = false;
    try {
      webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {}

    let webgl2 = false;
    try {
      webgl2 = !!canvas.getContext('webgl2');
    } catch (e) {}

    let canvasSupport = false;
    try {
      canvasSupport = !!canvas.getContext('2d');
    } catch (e) {}

    const vid = document.createElement('video');
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const supportedVideo = videoTypes.filter(t => {
      try { return vid.canPlayType(t) !== ''; } catch(e) { return false; }
    });

    const aud = document.createElement('audio');
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
    const supportedAudio = audioTypes.filter(t => {
      try { return aud.canPlayType(t) !== ''; } catch(e) { return false; }
    });

    return {
      webgl,
      webgl2,
      canvas: canvasSupport,
      video: supportedVideo,
      audio: supportedAudio
    };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getMediaCapabilities: ${exceptionDetails.text}`);
  return result.value;
}

// Tests for the presence of key Web Platform APIs by checking the relevant
// global or navigator property. Returns a boolean map keyed by feature name.
export async function getFeatureSupport(client: CdpClient): Promise<Record<string, boolean>> {
  const expression = `({
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webWorkers: typeof Worker !== 'undefined',
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    payment: 'PaymentRequest' in window
  })`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getFeatureSupport: ${exceptionDetails.text}`);
  return result.value;
}

// Returns Network Information API data if available, or null if the browser
// does not expose navigator.connection.
export async function getNetworkType(client: CdpClient): Promise<{
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
} | null> {
  const expression = `(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;
    return {
      type: conn.type || '',
      effectiveType: conn.effectiveType || '',
      downlink: conn.downlink != null ? conn.downlink : -1,
      rtt: conn.rtt != null ? conn.rtt : -1
    };
  })()`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getNetworkType: ${exceptionDetails.text}`);
  return result.value;
}

// Returns the IANA timezone name, UTC offset in minutes, and the browser's
// primary locale as reported by the Intl and navigator APIs.
export async function getTimeInfo(client: CdpClient): Promise<{
  timezone: string;
  offset: number;
  locale: string;
}> {
  const expression = `({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: new Date().getTimezoneOffset(),
    locale: navigator.language
  })`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  if (exceptionDetails) throw new Error(`getTimeInfo: ${exceptionDetails.text}`);
  return result.value;
}
