import { CONFIG } from "../config";

interface LockoutInfo {
  failedAttempts: number;
  lockedUntil: number | null;
}

const PREFIX = "ps_lockout_";

function getKey(policyNumber: string): string {
  return `${PREFIX}${policyNumber}`;
}

export function readLockout(policyNumber: string): LockoutInfo {
  if (typeof window === "undefined") {
    return { failedAttempts: 0, lockedUntil: null };
  }
  const raw = localStorage.getItem(getKey(policyNumber));
  if (!raw) return { failedAttempts: 0, lockedUntil: null };
  try {
    return JSON.parse(raw) as LockoutInfo;
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

export function writeLockout(policyNumber: string, info: LockoutInfo): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(policyNumber), JSON.stringify(info));
}

export function clearLockout(policyNumber: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getKey(policyNumber));
}

export function registerFailedAttempt(policyNumber: string, maxAttempts = 3): LockoutInfo {
  const current = readLockout(policyNumber);
  const failedAttempts = current.failedAttempts + 1;
  let lockedUntil = current.lockedUntil;

  if (failedAttempts >= maxAttempts) {
    const hoursMs = CONFIG.lockoutHours * 60 * 60 * 1000;
    lockedUntil = Date.now() + hoursMs;
  }

  const updated: LockoutInfo = { failedAttempts, lockedUntil };
  writeLockout(policyNumber, updated);
  return updated;
}

export function canAttempt(policyNumber: string): { allowed: boolean; remainingMs: number } {
  const info = readLockout(policyNumber);
  if (!info.lockedUntil) {
    return { allowed: true, remainingMs: 0 };
  }
  const remaining = info.lockedUntil - Date.now();
  if (remaining <= 0) {
    clearLockout(policyNumber);
    return { allowed: true, remainingMs: 0 };
  }
  return { allowed: false, remainingMs: remaining };
}

