import type { Session } from "../types";
import { CONFIG } from "../config";

const SESSION_KEY = "ps_prereg_session";

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (isSessionExpired(parsed)) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isSessionExpired(session: Session): boolean {
  const ttlMs = CONFIG.sessionTtlMinutes * 60 * 1000;
  return Date.now() - session.createdAt > ttlMs;
}

