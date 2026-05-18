// src/cdp/darkmode.ts
import { CdpClient } from './client';

// Set the browser to emulate prefers-color-scheme: dark
export async function setDarkMode(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  });
}

// Set the browser to emulate prefers-color-scheme: light
export async function setLightMode(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });
}

// Clear any color-scheme emulation (return to browser/OS default)
export async function clearColorScheme(client: CdpClient): Promise<void> {
  await (client.raw.Emulation as any).setEmulatedMedia({ features: [] });
}

// Detect which color scheme is currently active in the page
export async function getColorScheme(
  client: CdpClient,
): Promise<'dark' | 'light' | 'no-preference'> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const light = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (dark) return 'dark';
  if (light) return 'light';
  return 'no-preference';
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as 'dark' | 'light' | 'no-preference';
}

// Emulate prefers-contrast media feature
export async function setContrastPreference(
  client: CdpClient,
  value: 'more' | 'less' | 'no-preference',
): Promise<void> {
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-contrast', value }],
  });
}

// Emulate prefers-reduced-motion media feature
export async function setReducedMotion(
  client: CdpClient,
  value: 'reduce' | 'no-preference',
): Promise<void> {
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-reduced-motion', value }],
  });
}

// Read the page's background color, foreground color, and first resolved accent CSS variable
export async function getThemeColors(
  client: CdpClient,
): Promise<{ background: string; foreground: string; accent: string | null }> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const body = document.body;
  const bodyStyle = getComputedStyle(body);
  const rootStyle = getComputedStyle(document.documentElement);
  const background = bodyStyle.backgroundColor;
  const foreground = bodyStyle.color;
  const candidates = ['--accent-color', '--color-accent', '--primary-color'];
  let accent = null;
  for (const name of candidates) {
    const val = rootStyle.getPropertyValue(name).trim();
    if (val) { accent = val; break; }
  }
  return { background, foreground, accent };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  }
  return result.value as { background: string; foreground: string; accent: string | null };
}

// Capture screenshots in both light and dark mode, then restore no-preference
export async function takeThemeScreenshots(
  client: CdpClient,
): Promise<{ light: string; dark: string }> {
  // Light screenshot
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });
  const lightResult = await (client.raw.Page as any).captureScreenshot({ format: 'png' });
  const light: string = lightResult.data;

  // Dark screenshot
  await (client.raw.Emulation as any).setEmulatedMedia({
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  });
  const darkResult = await (client.raw.Page as any).captureScreenshot({ format: 'png' });
  const dark: string = darkResult.data;

  // Restore to no emulation
  await (client.raw.Emulation as any).setEmulatedMedia({ features: [] });

  return { light, dark };
}
