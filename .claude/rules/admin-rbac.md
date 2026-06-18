---
description: Auth and RBAC patterns for the admin panel
globs: ["src/app/admin/**", "src/app/api/**", "src/components/admin/**"]
---

# Admin auth and RBAC patterns

## Three-layer auth — coarse, then server, then fine-grained

**Layer 1 — middleware (edge, coarse):** `src/proxy.ts` runs `auth` from `auth.config.ts`. It confirms the user is a staff member (`isStaff(role)`) before the request reaches any admin route. No Prisma here.

**Layer 2 — admin layout (server):** `src/app/admin/layout.tsx` calls `auth()` and `isStaff`, then redirects to `/login` if the check fails. It also loads the `PermissionMap` via `getRolePermissions` and passes it to `AdminShell` for sidebar rendering. This is not a substitute for API-level guards — it only enforces entry and loads UI-level permission state.

**Layer 3 — API routes (server, fine-grained):** Every mutating route and any sensitive read calls `requirePermission(module, action)` from `src/lib/permissions.ts`. This checks the `RolePermission` DB table.

Never collapse these three layers. The middleware check is coarse (`isStaff` only); the layout check gates the UI shell; neither is sufficient for data endpoints.

## requirePermission is the only correct guard for API routes

```ts
// ✅ every admin API handler
export async function POST(request: Request) {
  const guard = await requirePermission("packages", "create");
  if (guard instanceof NextResponse) return guard;
  // guard is the authorized Session — proceed
}
```

`requirePermission` returns either the `Session` object or a `NextResponse` (401/403). Check `instanceof NextResponse` immediately after calling it and return early. Do not call `auth()` separately in the same handler.

For endpoints not tied to a specific module (e.g. uploads), use `requireStaff()` instead.

## Module keys come from MODULES in rbac.ts

The canonical list of permission module keys is `MODULES` in `src/lib/rbac.ts`. When adding a new admin section, add its key there first, then reference it in API guards. Never hardcode a string not in that list.

```ts
// src/lib/rbac.ts — source of truth
export const MODULES = [
  { key: "packages", ... },
  { key: "destinations", ... },
  // ...
] as const;
```

## SUPERADMIN bypasses the DB permission table

`requirePermission` and `can()` short-circuit for `SUPERADMIN` before hitting the DB. Do not add special `if SUPERADMIN` branches in handlers — the helpers already handle this.

## Keep edge-safe code isolated

`src/lib/rbac.ts` — edge-safe (pure constants, no Prisma). Used in `auth.config.ts` and `src/proxy.ts`.  
`src/lib/permissions.ts` — server-only (Prisma + NextAuth). Used in API routes and server components.  
`src/lib/auth.ts` — server-only NextAuth instance.  
`src/lib/auth.config.ts` — edge-safe NextAuth config.

Do not import `permissions.ts` or `auth.ts` from middleware. Do not import Prisma from `auth.config.ts` or `rbac.ts`.

## Admin page components don't own permission logic

Admin RSC pages (`src/app/admin/*/page.tsx`) fetch initial data and render a `*Client.tsx` component. They do not call `requirePermission` — that's enforced by the middleware (coarse) and the API routes the client calls (fine-grained). Do not add redundant session checks inside admin page RSCs unless displaying role-conditional UI that isn't controlled by an API.

## Admin page RSCs require force-dynamic when accessing Prisma or session data

Any admin list page, detail page, or edit page that contains a Prisma query or reads session-dependent state must export:

```ts
export const dynamic = "force-dynamic";
```

Without it, Next.js may statically cache the page and serve stale DB content.

**Exempt:** create/new pages (e.g. `src/app/admin/*/new/page.tsx`) that render a static form with no Prisma access. These pages have no real-time dependency and do not need the directive — adding it there is unnecessary.

## Admin UI components are in src/components/admin/

Business logic stays in API routes; the `*Client.tsx` components handle display, local state, and calling those APIs via `fetch`. Never put direct Prisma calls inside `src/components/admin/**`.

Admin client mutations always use `useTransition` wrapping an async `fetch`, with `toast` from `sonner`:

```ts
"use client";
const router = useRouter();
const [isPending, startTransition] = useTransition();

// After a delete or status change — refresh in place, no navigation
startTransition(async () => {
  const res = await fetch(`/api/resource/${id}`, { method: "DELETE" });
  if (!res.ok) { toast.error("Failed."); return; }
  toast.success("Deleted.");
  router.refresh();   // re-fetches RSC data without navigating away
});

// After a create or edit save — navigate back to the list
startTransition(async () => {
  const res = await fetch("/api/resource", { method: "POST", ... });
  if (!res.ok) { toast.error("Save failed."); return; }
  toast.success("Saved.");
  router.push("/admin/resource");
  router.refresh();   // ensures the list RSC shows the new data on arrival
});
```

Use `router.refresh()` alone for in-place mutations (delete, status change). Use `router.push()` + `router.refresh()` for create/edit flows that navigate back to the list.
