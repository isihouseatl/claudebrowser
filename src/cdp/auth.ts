// src/cdp/auth.ts
import { CdpClient } from '../cdp/client';

export interface AuthCheck {
  name: string;
  url: string;
  loggedInSelector: string;
  loggedOutSelector: string;
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
    loggedInSelector: 'a[href="/direct/inbox/"]',
    loggedOutSelector: 'input[name="username"]',
  },
  {
    name: 'Meta Ads',
    url: 'https://adsmanager.facebook.com/',
    loggedInSelector: '[data-testid="ads_manager_left_nav"]',
    loggedOutSelector: 'input[name="email"]',
  },
  {
    name: 'TikTok Ads',
    url: 'https://ads.tiktok.com/i18n/dashboard',
    loggedInSelector: '[class*="SideNavMenu"]',
    loggedOutSelector: 'input[name="email"]',
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

  const querySelector = async (selector: string): Promise<boolean> => {
    const result = await raw.Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });
    return result.result.value === true;
  };

  const loggedIn = await querySelector(check.loggedInSelector);

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
    const result = await raw.Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(check.loggedInSelector)})`,
      returnByValue: true,
    });

    if (result.result.value === true) {
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
