const minutesFromEnv = Number(import.meta.env.VITE_SESSION_TTL_MINUTES ?? "15");
const lockoutHoursFromEnv = Number(import.meta.env.VITE_LOCKOUT_HOURS ?? "24");
const fileMinSizeKbFromEnv = Number(import.meta.env.VITE_FILE_MIN_SIZE_KB ?? "20");

export const CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  sessionTtlMinutes: Number.isFinite(minutesFromEnv) ? minutesFromEnv : 15,
  lockoutHours: Number.isFinite(lockoutHoursFromEnv) ? lockoutHoursFromEnv : 24,
  fileMinSizeKb: Number.isFinite(fileMinSizeKbFromEnv) ? fileMinSizeKbFromEnv : 20
};

