// src/cdp/auth.ts
import { CdpClient } from '../cdp/client';

export interface AuthCheck {
  name: string;
  url: string;
  loginUrlPattern: string;   // substring in URL when redirected to login — more reliable than DOM selectors
  loggedInSelector?: string; // optional fallback DOM check
  loggedOutSelector?: string;
}

export interface AuthResult {
  name: string;
  url: string;
  loggedIn: boolean;
  checkedAt: string; // ISO timestamp
}

export const AUTH_PRESETS: AuthCheck[] = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    loginUrlPattern: 'accounts/login',
  },
  {
    name: 'Meta Ads',
    url: 'https://adsmanager.facebook.com/',
    loginUrlPattern: 'loginpage',
  },
  {
    name: 'TikTok Ads',
    url: 'https://ads.tiktok.com/i18n/dashboard',
    loginUrlPattern: '/login',
  },
];

export async function checkAuth(
  client: CdpClient,
  check: AuthCheck,
  timeoutMs = 8000,
): Promise<AuthResult> {
  const raw = client.raw;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Navigation timed out after ${timeoutMs}ms for ${check.url}`));
    }, timeoutMs);

    raw.Page.loadEventFired(() => {
      clearTimeout(timer);
      resolve();
    });

    raw.Page.navigate({ url: check.url }).catch((err: Error) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  // Primary check: URL-based — reliable across DOM changes and React re-renders
  const { result: urlResult } = await raw.Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const finalUrl: string = urlResult.value ?? '';
  const loggedIn = !finalUrl.includes(check.loginUrlPattern);

  return {
    name: check.name,
    url: check.url,
    loggedIn,
    checkedAt: new Date().toISOString(),
  };
}

export async function checkAllAuth(
  client: CdpClient,
  checks: AuthCheck[] = AUTH_PRESETS,
): Promise<AuthResult[]> {
  const results: AuthResult[] = [];
  for (const check of checks) {
    const result = await checkAuth(client, check);
    results.push(result);
  }
  return results;
}

export async function waitForAuth(
  client: CdpClient,
  check: AuthCheck,
  timeoutMs = 120000,
): Promise<boolean> {
  const raw = client.raw;
  const pollIntervalMs = 3000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { result } = await raw.Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
    const currentUrl: string = result.value ?? '';
    if (!currentUrl.includes(check.loginUrlPattern)) {
      return true;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.min(pollIntervalMs, remaining)),
    );
  }

  return false;
}
