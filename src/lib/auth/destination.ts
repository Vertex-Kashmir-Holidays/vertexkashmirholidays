// Resolves where to send the user after a successful sign-in: honours a
// same-origin ?callbackUrl= query param (added by the NextAuth middleware
// redirect when it bounced an unauthenticated visitor to /login), falling back
// to the role-aware /auth/redirect endpoint. Reads window.location, so this is
// client-only — call it from an event handler or a useEffect, never at render
// time (this repo's client components are still SSR'd for the initial HTML,
// where `window` doesn't exist).
export function resolveAuthDestination(): string {
  const cb = new URLSearchParams(window.location.search).get("callbackUrl");
  if (cb) {
    try {
      const path = new URL(cb, window.location.origin).pathname;
      if (path.startsWith("/") && !path.startsWith("/login")) return path;
    } catch {
      /* ignore malformed callbackUrl */
    }
  }
  return "/auth/redirect";
}
