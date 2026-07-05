// Single source of truth for "this is an internal/staff route, not the public
// site." Used by both the edge middleware (to gate GTM script injection) and
// the client analytics module (to gate dataLayer pushes) — see src/proxy.ts
// and src/lib/analytics.ts. Add /crm or other internal route groups here if
// they're ever introduced; nothing else needs to change.
const INTERNAL_ROUTE_PREFIXES = ["/admin"];

export function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
