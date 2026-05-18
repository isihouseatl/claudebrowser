import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface SessionEntry {
  pid: number;
  startedAt: string;
  tabs: string[];
  name?: string;
}

export interface SessionRegistry {
  sessions: Record<string, SessionEntry>;
}

const SESSIONS_DIR = path.join(os.homedir(), ".claudebrowser");
const SESSIONS_FILE = path.join(SESSIONS_DIR, "sessions.json");
const SESSIONS_TMP = path.join(SESSIONS_DIR, "sessions.json.tmp");

const SESSIONS_LOCK = path.join(SESSIONS_DIR, "sessions.lock");
const LOCK_TIMEOUT_MS = 5000;
const LOCK_RETRY_MS = 20;

// Shared buffer for Atomics.wait — lets us sleep synchronously without
// burning CPU in a busy-wait loop. One 4-byte cell is sufficient.
const _lockSleepBuf = new Int32Array(new SharedArrayBuffer(4));

function acquireLock(): void {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      fs.writeFileSync(SESSIONS_LOCK, String(process.pid), { flag: "wx" });
      return; // acquired
    } catch {
      // Lock held by another process — sleep without burning CPU.
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      Atomics.wait(_lockSleepBuf, 0, 0, Math.min(LOCK_RETRY_MS, remaining));
    }
  }
  // Timed out — stale lock. Remove and take it.
  try { fs.unlinkSync(SESSIONS_LOCK); } catch { /* ignore */ }
  fs.writeFileSync(SESSIONS_LOCK, String(process.pid), { flag: "wx" });
}

function releaseLock(): void {
  try { fs.unlinkSync(SESSIONS_LOCK); } catch { /* ignore */ }
}

// Internal helpers — perform raw I/O without acquiring the lock.
// These are used inside lock-holding callers to avoid double-locking.
function readSessionsRaw(): SessionRegistry {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.sessions &&
      typeof parsed.sessions === "object"
    ) {
      return parsed as SessionRegistry;
    }
    return { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}

function writeSessionsRaw(registry: SessionRegistry): void {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(SESSIONS_TMP, JSON.stringify(registry, null, 2), "utf8");
    fs.renameSync(SESSIONS_TMP, SESSIONS_FILE);
  } catch (err) {
    process.stderr.write(`[claudebrowser] Warning: failed to write sessions.json: ${err}\n`);
  }
}

export function generateSessionId(): string {
  const pid = process.pid;
  const ts = Date.now().toString(16);
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${pid}-${ts}-${rand}`;
}

export function readSessions(): SessionRegistry {
  return readSessionsRaw();
}

export function writeSessions(registry: SessionRegistry): void {
  acquireLock();
  try {
    writeSessionsRaw(registry);
  } finally {
    releaseLock();
  }
}

export function registerSession(sessionId: string, name?: string): void {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    registry.sessions[sessionId] = {
      pid: process.pid,
      startedAt: new Date().toISOString(),
      tabs: [],
      ...(name ? { name } : {}),
    };
    writeSessionsRaw(registry);
  } finally {
    releaseLock();
  }
}

export function unregisterSession(sessionId: string): void {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    delete registry.sessions[sessionId];
    writeSessionsRaw(registry);
  } finally {
    releaseLock();
  }
}

export function claimTab(sessionId: string, tabId: string): void {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    const session = registry.sessions[sessionId];
    if (!session) return;
    if (!session.tabs.includes(tabId)) session.tabs.push(tabId);
    writeSessionsRaw(registry);
  } finally {
    releaseLock();
  }
}

export function releaseTab(sessionId: string, tabId: string): void {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    const session = registry.sessions[sessionId];
    if (!session) return;
    session.tabs = session.tabs.filter((t) => t !== tabId);
    writeSessionsRaw(registry);
  } finally {
    releaseLock();
  }
}

export function getSessionTabs(sessionId: string): string[] {
  const registry = readSessions();
  const session = registry.sessions[sessionId];
  if (!session) {
    return [];
  }
  return [...session.tabs];
}

export function getAllSessions(): SessionRegistry {
  return readSessions();
}

export function pruneDeadSessions(): void {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    let changed = false;
    for (const [sessionId, entry] of Object.entries(registry.sessions)) {
      let alive = true;
      try {
        process.kill(entry.pid, 0);
      } catch {
        alive = false;
      }
      if (!alive) {
        delete registry.sessions[sessionId];
        changed = true;
      }
    }
    if (changed) {
      writeSessionsRaw(registry);
    }
  } finally {
    releaseLock();
  }
}

export function isTabOwnedByOther(
  sessionId: string,
  tabId: string
): { owned: boolean; ownerSessionId?: string; ownerName?: string } {
  const registry = readSessions();
  for (const [sid, entry] of Object.entries(registry.sessions)) {
    if (sid === sessionId) {
      continue;
    }
    if (entry.tabs.includes(tabId)) {
      return {
        owned: true,
        ownerSessionId: sid,
        ...(entry.name ? { ownerName: entry.name } : {}),
      };
    }
  }
  return { owned: false };
}

// Atomically verify a tab is not owned by another session and pre-emptively
// remove it from the caller's session registry — all inside one lock acquisition.
// This eliminates the TOCTOU window between the ownership check and the actual
// CDP.Close call in closeTab().
export function atomicClaimForClose(
  sessionId: string,
  tabId: string,
): { canClose: boolean; ownerSessionId?: string; ownerName?: string } {
  acquireLock();
  try {
    const registry = readSessionsRaw();
    // Check whether another session owns this tab.
    for (const [sid, entry] of Object.entries(registry.sessions)) {
      if (sid === sessionId) continue;
      if (entry.tabs.includes(tabId)) {
        return {
          canClose: false,
          ownerSessionId: sid,
          ...(entry.name ? { ownerName: entry.name } : {}),
        };
      }
    }
    // Safe to close — pre-emptively release from our own session so no
    // second caller can race past the ownership check before Chrome closes.
    const session = registry.sessions[sessionId];
    if (session) {
      session.tabs = session.tabs.filter((t) => t !== tabId);
      writeSessionsRaw(registry);
    }
    return { canClose: true };
  } finally {
    releaseLock();
  }
}
