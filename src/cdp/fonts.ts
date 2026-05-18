// src/cdp/fonts.ts
import { CdpClient } from './client';

export async function getPageFonts(
  client: CdpClient,
): Promise<Array<{ family: string; style: string; weight: string; size: string; count: number }>> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const counts = new Map();
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const cs = window.getComputedStyle(el);
    const family = cs.fontFamily;
    const style = cs.fontStyle;
    const weight = cs.fontWeight;
    const size = cs.fontSize;
    const key = family + '|' + style + '|' + weight + '|' + size;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const entries = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  return entries.map(([key, count]) => {
    const [family, style, weight, size] = key.split('|');
    return { family, style, weight, size, count };
  });
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as Array<{ family: string; style: string; weight: string; size: string; count: number }>;
}

export async function getElementFont(
  client: CdpClient,
  selector: string,
): Promise<{ family: string; style: string; weight: string; size: string; lineHeight: string; letterSpacing: string }> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Element not found: ' + ${selLiteral});
  const cs = window.getComputedStyle(el);
  return {
    family: cs.fontFamily,
    style: cs.fontStyle,
    weight: cs.fontWeight,
    size: cs.fontSize,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { family: string; style: string; weight: string; size: string; lineHeight: string; letterSpacing: string };
}

export async function findElementsByFont(
  client: CdpClient,
  fontFamily: string,
): Promise<string[]> {
  const fontLiteral = JSON.stringify(fontFamily.toLowerCase());
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const needle = ${fontLiteral};
  const elements = Array.from(document.querySelectorAll('*'));
  const selectors = [];
  for (const el of elements) {
    if (selectors.length >= 20) break;
    const cs = window.getComputedStyle(el);
    if (cs.fontFamily.toLowerCase().includes(needle)) {
      if (el.id) {
        selectors.push('#' + el.id);
      } else {
        const tag = el.tagName.toLowerCase();
        const classes = Array.from(el.classList).join('.');
        selectors.push(classes ? tag + '.' + classes : tag);
      }
    }
  }
  return selectors;
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as string[];
}

export async function getFontStack(
  client: CdpClient,
  selector: string,
): Promise<string[]> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) throw new Error('Element not found: ' + ${selLiteral});
  const fontFamily = window.getComputedStyle(el).fontFamily;
  return fontFamily.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, ''));
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as string[];
}

export async function checkFontLoaded(
  client: CdpClient,
  fontFamily: string,
): Promise<boolean> {
  const fontLiteral = JSON.stringify('12px ' + fontFamily);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `document.fonts.check(${fontLiteral})`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as boolean;
}

export async function getLoadedFonts(
  client: CdpClient,
): Promise<string[]> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const families = new Set();
  for (const face of document.fonts) {
    families.add(face.family.replace(/^['"]|['"]$/g, ''));
  }
  return Array.from(families);
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return (result.value ?? []) as string[];
}

export async function waitForFontsReady(
  client: CdpClient,
  timeoutMs?: number,
): Promise<void> {
  const timeout = timeoutMs ?? 5000;
  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `new Promise((res, rej) => { const t = setTimeout(() => rej('fonts timeout'), ${timeout}); document.fonts.ready.then(() => { clearTimeout(t); res(undefined); }); })`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

export async function getFontMetrics(
  client: CdpClient,
  selector: string,
): Promise<{ ascent: number; descent: number; lineGap: number; baseline: number } | null> {
  const selLiteral = JSON.stringify(selector);
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `(() => {
  const el = document.querySelector(${selLiteral});
  if (!el) return null;
  const cs = window.getComputedStyle(el);
  const font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + '/' + cs.lineHeight + ' ' + cs.fontFamily;
  const canvas = new OffscreenCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const m = ctx.measureText('Mg');
  return {
    ascent: m.actualBoundingBoxAscent,
    descent: m.actualBoundingBoxDescent,
    lineGap: 0,
    baseline: m.alphabeticBaseline ?? 0,
  };
})()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value as { ascent: number; descent: number; lineGap: number; baseline: number } | null;
}
