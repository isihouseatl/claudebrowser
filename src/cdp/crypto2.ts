// src/cdp/crypto2.ts
import { CdpClient } from './client';

// Hash a string using Web Crypto API (sha-256 by default)
export async function hashString(
  client: CdpClient,
  input: string,
  algorithm: 'sha-1' | 'sha-256' | 'sha-384' | 'sha-512' = 'sha-256'
): Promise<string> {
  const expression = `
    (async () => {
      const algo = ${JSON.stringify(algorithm.toUpperCase())};
      const encoded = new TextEncoder().encode(${JSON.stringify(input)});
      const buffer = await window.crypto.subtle.digest(algo, encoded);
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in hashString: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Hash the text content of a page element
export async function hashElementContent(
  client: CdpClient,
  selector: string,
  algorithm: string = 'sha-256'
): Promise<string> {
  const expression = `
    (async () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
      const text = el.innerText;
      const algo = ${JSON.stringify(algorithm.toUpperCase())};
      const encoded = new TextEncoder().encode(text);
      const buffer = await window.crypto.subtle.digest(algo, encoded);
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in hashElementContent: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Generate a cryptographically random UUID
export async function generateUuid(client: CdpClient): Promise<string> {
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression: `window.crypto.randomUUID()`,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in generateUuid: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Generate N cryptographically random bytes as a hex string
export async function randomBytes(client: CdpClient, count: number): Promise<string> {
  const expression = `
    [...window.crypto.getRandomValues(new Uint8Array(${count}))]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in randomBytes: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Generate a random integer between min and max (inclusive)
// Note: uses modulo reduction — sufficient for testing, has minor bias for large ranges.
export async function randomInt(
  client: CdpClient,
  min: number,
  max: number
): Promise<number> {
  const expression = `
    ${min} + (window.crypto.getRandomValues(new Uint32Array(1))[0] % (${max} - ${min} + 1))
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in randomInt: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as number;
}

// Encode a string to base64 (UTF-8 safe)
export async function base64Encode(client: CdpClient, input: string): Promise<string> {
  const expression = `btoa(unescape(encodeURIComponent(${JSON.stringify(input)})))`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in base64Encode: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Decode a base64 string (UTF-8 safe)
export async function base64Decode(client: CdpClient, input: string): Promise<string> {
  const expression = `decodeURIComponent(escape(atob(${JSON.stringify(input)})))`;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in base64Decode: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}

// Compute HMAC-SHA256 of a message with a key, returns hex string
export async function hmacSha256(
  client: CdpClient,
  key: string,
  message: string
): Promise<string> {
  const expression = `
    (async () => {
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(${JSON.stringify(key)}),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        keyMaterial,
        encoder.encode(${JSON.stringify(message)})
      );
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error in hmacSha256: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as string;
}
