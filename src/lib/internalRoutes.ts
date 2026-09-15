// Single source of truth for "this route should never be indexed or tracked."
// Used by the client analytics module (to gate dataLayer pushes) — see
// src/lib/analytics.ts and src/lib/attribution.ts. /account and /login no
// longer render <SiteAnalytics> either (GTM never mounts there, same as
// /admin), so this is now belt-and-suspenders rather than the primary guard
// for those two — but it's still the right source of truth to extend if
// another internal route group is ever introduced.
const INTERNAL_ROUTE_PREFIXES = ["/admin", "/account", "/login"];

export function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
