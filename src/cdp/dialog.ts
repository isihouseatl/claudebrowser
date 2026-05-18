// src/cdp/dialog.ts
import { CdpClient } from './client';

export interface DialogInfo {
  type: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  message: string;
  defaultPrompt?: string; // for prompt dialogs
}

// Per-client pending dialog state
const pendingDialogs = new WeakMap<CdpClient, DialogInfo | null>();

// Ensure the WeakMap entry exists for a client (null = no dialog pending)
function ensureTracked(client: CdpClient): void {
  if (!pendingDialogs.has(client)) {
    pendingDialogs.set(client, null);
  }
}

// Wait for a browser dialog to appear. Resolves with dialog info when shown.
// Automatically accepts or dismisses based on the accept param (default: accept).
export async function waitForDialog(
  client: CdpClient,
  options?: { accept?: boolean; promptText?: string; timeoutMs?: number },
): Promise<DialogInfo> {
  const accept = options?.accept ?? true;
  const promptText = options?.promptText;
  const timeoutMs = options?.timeoutMs ?? 15000;

  ensureTracked(client);

  return new Promise<DialogInfo>((resolve, reject) => {
    let settled = false;
    let removeListener: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      removeListener?.();
      reject(
        new Error(
          `waitForDialog: no dialog appeared within ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    removeListener = client.raw.Page.javascriptDialogOpening(
      ({
        type,
        message,
        defaultPrompt,
      }: {
        type: string;
        message: string;
        defaultPrompt?: string;
      }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        removeListener?.();

        const info: DialogInfo = {
          type: type as DialogInfo['type'],
          message,
          ...(defaultPrompt !== undefined ? { defaultPrompt } : {}),
        };

        // Update tracked state to indicate dialog is open
        pendingDialogs.set(client, info);

        // Respond to the dialog, then clear tracked state
        const handleParams: { accept: boolean; promptText?: string } = {
          accept,
        };
        if (type === 'prompt' && promptText !== undefined) {
          handleParams.promptText = promptText;
        }

        client.raw.Page.handleJavaScriptDialog(handleParams)
          .then(() => {
            pendingDialogs.set(client, null);
            resolve(info);
          })
          .catch((err: unknown) => {
            pendingDialogs.set(client, null);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      },
    ) as unknown as () => void;
  });
}

// Check if a dialog is currently open for this client (non-blocking).
// Relies on state set by the javascriptDialogOpening listener registered
// via waitForDialog or startDialogTracking.
export async function isDialogOpen(client: CdpClient): Promise<boolean> {
  ensureTracked(client);
  return pendingDialogs.get(client) !== null;
}

// Dismiss all pending print dialogs by sending a handleJavaScriptDialog dismiss.
// Silently ignores errors (e.g. no dialog currently open).
export async function dismissPrintDialog(client: CdpClient): Promise<void> {
  try {
    await client.raw.Page.handleJavaScriptDialog({ accept: false });
  } catch {
    // No dialog open or already handled — safe to ignore
  }
}
