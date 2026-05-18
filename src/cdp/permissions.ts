// src/cdp/permissions.ts
import { CdpClient } from './client';

// Grant a single named permission for a given origin.
// Common permission names: "geolocation", "notifications", "camera",
// "microphone", "clipboard-read", "clipboard-write".
export async function grantPermission(
  client: CdpClient,
  permission: string,
  origin: string
): Promise<void> {
  await (client.raw.Browser as any).grantPermissions({ permissions: [permission], origin });
}

// Revoke a single named permission for a given origin.
// Chrome CDP has no explicit "deny" API. Calling grantPermissions with an empty
// list removes the grant so the browser falls back to its default prompt state.
export async function denyPermission(
  client: CdpClient,
  permission: string,
  origin: string
): Promise<void> {
  // The permission parameter is accepted for API symmetry but the CDP call
  // resets the entire grant list for the origin to empty.
  void permission;
  await (client.raw.Browser as any).grantPermissions({ permissions: [], origin });
}

// Reset all permission overrides across all origins, restoring browser defaults.
export async function resetAllPermissions(client: CdpClient): Promise<void> {
  await (client.raw.Browser as any).resetPermissions({});
}

// Query the current state of a single permission via navigator.permissions.
// Returns 'granted', 'denied', or 'prompt'. Falls back to 'prompt' on error
// (e.g. unsupported permission name in the current browsing context).
export async function checkPermission(
  client: CdpClient,
  permissionName: string
): Promise<'granted' | 'denied' | 'prompt'> {
  const expression = `
    new Promise(res =>
      navigator.permissions
        .query({ name: ${JSON.stringify(permissionName)} })
        .then(r => res(r.state))
        .catch(() => res('prompt'))
    )
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as 'granted' | 'denied' | 'prompt';
}

// Shorthand: grant the "geolocation" permission for an origin.
export async function grantGeolocation(
  client: CdpClient,
  origin: string
): Promise<void> {
  await grantPermission(client, 'geolocation', origin);
}

// Shorthand: grant the "notifications" permission for an origin.
export async function grantNotifications(
  client: CdpClient,
  origin: string
): Promise<void> {
  await grantPermission(client, 'notifications', origin);
}

// Grant both "clipboard-read" and "clipboard-write" for an origin in a single
// CDP call so they are set atomically.
export async function grantClipboardAccess(
  client: CdpClient,
  origin: string
): Promise<void> {
  await (client.raw.Browser as any).grantPermissions({
    permissions: ['clipboard-read', 'clipboard-write'],
    origin,
  });
}

// Query the current state of the standard permission set and return an array
// of { name, state } objects. All queries run concurrently via Promise.all
// inside a single evaluate call.
export async function getPermissionState(
  client: CdpClient
): Promise<Array<{ name: string; state: string }>> {
  const expression = `
    (async () => {
      const names = [
        "geolocation",
        "notifications",
        "camera",
        "microphone",
        "clipboard-read",
        "clipboard-write"
      ];
      const results = await Promise.all(
        names.map(name =>
          navigator.permissions
            .query({ name: name })
            .then(r => ({ name, state: r.state }))
            .catch(() => ({ name, state: 'prompt' }))
        )
      );
      return results;
    })()
  `;
  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      `JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
    );
  }
  return result.value as Array<{ name: string; state: string }>;
}
