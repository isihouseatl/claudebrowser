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

export function generateSessionId(): string {
  const pid = process.pid;
  const ts = Date.now().toString(16);
  return `${pid}-${ts}`;
}

export function readSessions(): SessionRegistry {
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

export function writeSessions(registry: SessionRegistry): void {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(SESSIONS_TMP, JSON.stringify(registry, null, 2), "utf8");
    fs.renameSync(SESSIONS_TMP, SESSIONS_FILE);
  } catch {
    // If write fails, leave sessions.json as-is
  }
}

export function registerSession(sessionId: string, name?: string): void {
  const registry = readSessions();
  registry.sessions[sessionId] = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    tabs: [],
    ...(name ? { name } : {}),
  };
  writeSessions(registry);
}

export function unregisterSession(sessionId: string): void {
  const registry = readSessions();
  delete registry.sessions[sessionId];
  writeSessions(registry);
}

export function claimTab(sessionId: string, tabId: string): void {
  const registry = readSessions();
  const session = registry.sessions[sessionId];
  if (!session) {
    return;
  }
  if (!session.tabs.includes(tabId)) {
    session.tabs.push(tabId);
  }
  writeSessions(registry);
}

export function releaseTab(sessionId: string, tabId: string): void {
  const registry = readSessions();
  const session = registry.sessions[sessionId];
  if (!session) {
    return;
  }
  session.tabs = session.tabs.filter((t) => t !== tabId);
  writeSessions(registry);
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
  const registry = readSessions();
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
    writeSessions(registry);
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
