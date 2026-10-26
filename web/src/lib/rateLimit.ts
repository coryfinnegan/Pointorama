// In-memory limiter for PIN guessing. Single-process only, which matches the
// single systemd service this app runs as.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export function checkPinAttempt(key: string, now = Date.now()): boolean {
  const entry = failures.get(key);
  if (!entry) return true;
  if (now >= entry.resetAt) {
    failures.delete(key);
    return true;
  }
  return entry.count < MAX_FAILURES;
}

export function recordPinFailure(key: string, now = Date.now()): void {
  const entry = failures.get(key);
  if (!entry || now >= entry.resetAt) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export function clearPinFailures(key: string): void {
  failures.delete(key);
}

export function resetRateLimits(): void {
  failures.clear();
}
