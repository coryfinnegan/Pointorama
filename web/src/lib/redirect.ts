/**
 * Returns a safe same-origin path to send the user to after logging in.
 * Only relative paths under /admin are allowed (prevents open redirects and
 * bouncing back to the login page itself).
 */
export function getPostLoginPath(from: string | null | undefined): string {
  const fallback = "/admin";
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.includes("\\")) return fallback;
  if (from !== "/admin" && !from.startsWith("/admin/") && !from.startsWith("/admin?")) return fallback;
  if (from === "/admin/login" || from.startsWith("/admin/login?") || from.startsWith("/admin/login/")) return fallback;
  return from;
}

/** Full page navigation — bypasses the client router cache. */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}
