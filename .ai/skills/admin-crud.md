This Skill defines the standard pattern for implementing Admin CRUD modules in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not a generic CRUD tutorial.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# Admin CRUD Module

Version: 1.0.0

Last Updated: 2026-07-17


## Purpose

This Skill defines how a new, first-class Admin CRUD module is added in Vertex — one that gets its own sidebar entry, its own RBAC module key, its own API route pair, and its own list/create/edit pages. It keeps every module consistent in architecture, permissions, and user experience instead of each one reinventing the pattern slightly differently.

────────────────────────────────────

## Before You Start

Confirm:

- This pattern doesn't already exist.
- This isn't a variation of an existing module.
- Business rules are understood.
- Required permissions are known.

────────────────────────────────────

## When to Use

Use this Skill when adding a new first-class admin module — a new entity staff manage directly, with its own list, create, and edit pages (recent real examples: Tours, Destinations, Activities, Blogs, Banners, Galleries, FAQs, Campaigns, Users).

Also use it when adding, to an existing module: Publish/Unpublish, a status change, or a bulk action.

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- A list resource inside an existing page-content section (Home/About/Contact/Blog page content) — those go through the generic `src/app/api/pages/[resource]` system already built for that purpose; don't hand-roll a new one.
- Public website pages, customer account pages, authentication, or payment workflows.
- Adding a single field to an existing model with no new admin surface (`prisma-migration.md` covers that).

────────────────────────────────────

## Prerequisites

Before creating a module, read:

- `src/lib/rbac.ts` — the `MODULES` array; confirm the key you're adding doesn't already exist.
- `prisma/schema.prisma` — the model you'll be managing, its fields and enums.
- `prisma/seed.ts` — the `PERMISSION_DEFAULTS` block; you'll add rows here.
- A canonical existing module to copy the shape of — `src/app/admin/destinations/` (pages) and `src/components/admin/destinations/` (client components) is the reference implementation this Skill is based on.

Decide, before writing code:
- **Does it need a public page?** Only if visitors browse this entity (Tours/Destinations: yes. Bookings/Users: no). A public page always filters `where: { published: true }` and uses `revalidate = 300`.
- **Does it need a customer account page?** Only if a logged-in customer owns records of this type — every query then scopes to `where: { userId: session.user.id }`.
- **Does the entity need a `published` boolean or a status enum?** If a status enum, plan for a Zod `z.enum` in both route schemas, a `STATUS_STYLES` display map, and an `ALLOWED_TRANSITIONS` map if staff can change status.

────────────────────────────────────

## Vertex Standard Workflow

Produce this task map before coding, then build in this order — each step should compile before moving to the next:

1. **Prisma model** (see `prisma-migration.md` for schema-change mechanics). New columns on populated tables must be nullable or `@default(...)`; add `published Boolean @default(false)` if staff controls visibility; add a `slug String @unique` if the entity has public URLs.
2. **Register the module key** — add `{ key, label, href }` to `MODULES` in `src/lib/rbac.ts`.
3. **Seed `RolePermission` rows** — add the new key to `PERMISSION_DEFAULTS` in `prisma/seed.ts` for ADMIN, SALES, and EDITOR, then run `yarn db:seed`.
4. **Collection API route** (`src/app/api/<resource>/route.ts`) — `GET` (public, no guard, if the list is public; otherwise `requirePermission(<key>, "view")`) and `POST` (always `requirePermission(<key>, "create")`).
5. **Item API route** (`src/app/api/<resource>/[id]/route.ts`) — `GET`/`PATCH`/`DELETE`, each with its own `requirePermission` call and the matching action. Remember `params` is a `Promise` — always `await` it.
6. **Admin list page** (`src/app/admin/<module>/page.tsx`) — Server Component, `export const dynamic = "force-dynamic"`, `select` only the columns the list needs, renders a `*Client.tsx`. No auth check here — the admin layout already handles that.
7. **Admin create page** (`src/app/admin/<module>/new/page.tsx`) — no DB access, no `force-dynamic` needed, renders the form with no `defaults`.
8. **Admin edit page** (`src/app/admin/<module>/[id]/edit/page.tsx`) — fetches the record, calls `notFound()` if missing, renders the form with `defaults`.
9. **List client** (`src/components/admin/<module>/<Name>Client.tsx`) — `"use client"`, `useTransition` + `fetch` + `toast` (sonner) + `router.refresh()` for delete/status changes.
10. **Form client** (`src/components/admin/<module>/<Name>Form.tsx`) — React Hook Form + `zodResolver`, one component serving both create (`POST`) and edit (`PATCH`) via a `defaults` prop; `router.push()` + `router.refresh()` after a successful save.
11. **Public exposure**, if applicable — `src/app/(public)/<module>/page.tsx` (`revalidate = 300`, `where: { published: true }`) and `[slug]/page.tsx` with `generateMetadata` via `buildMetadata()`.

────────────────────────────────────

## Engineering Rules

- Route Handlers only — see `../instructions/coding-standards.md` → Next.js Mutation Standard; this pattern is not a candidate for Server Actions.
- Never access Prisma from a Client Component — only Route Handlers and Server Components import `@/lib/prisma`.
- All four verbs (GET/POST/PATCH/DELETE) call `requirePermission` individually — a passing check on one verb never implies another is guarded.
- `createSchema` fields are required as appropriate; `patchSchema` fields are the same set but every one `.optional()`/`.optional().nullable()`, so a partial save never has to resend the whole record.
- Reuse the shared UI primitives that exist (`coding-standards.md` → Design System) before hand-rolling table/form markup.
- Follow the existing admin layout and the repository's standard mutation pattern (`fetch` → `useTransition` → `toast` → `router.refresh()`/`router.push()`) exactly — don't introduce a new state-management shape for one module.

────────────────────────────────────

## Common UI Pattern

The consistent Admin CRUD experience across existing modules: list page with search/filters → table → pagination → create/edit form → delete confirmation → empty state → loading state → success/error toast on every mutation. A new module should visibly match this, not introduce a different interaction shape without a reason.

────────────────────────────────────

## RBAC

- **`MODULES` registration** (`src/lib/rbac.ts`) — without this, `requirePermission` resolves against a missing entry and the sidebar link never renders, for every role including SUPERADMIN.
- **`RolePermission` seed rows** (`prisma/seed.ts`) — SUPERADMIN bypasses the permission table entirely, so a module missing its seed rows will appear to work when tested as SUPERADMIN and be completely locked out for ADMIN/SALES/EDITOR until `yarn db:seed` runs.
- **Route protection** — every API verb calls `requirePermission`, per Engineering Rules above.
- **UI visibility** — the admin layout reads the permission map to decide what renders in the sidebar; this is a UI convenience, never a substitute for the route-level check.

────────────────────────────────────

## Common Mistakes

- Forgetting the `MODULES` registration — the module silently has no sidebar entry and no working permission key.
- Forgetting the seed rows — works for SUPERADMIN, breaks for every other staff role.
- Adding `force-dynamic` to the `new` page — it has no DB query and no session dependency; the directive is only needed where one exists.
- Making a collection `GET` require permission when the resource is meant to be public (or the reverse — leaving a resource that should never be public, like bookings or users, unguarded).
- Declaring a JSON-array field as Prisma `Json` instead of `String @default("[]")` — breaks the parse/stringify convention every consumer expects.
- A `patchSchema` field that isn't `.optional()`/`.optional().nullable()` — forces the client to always send it, breaking partial saves.
- Not calling `notFound()` on the edit page when the record doesn't exist — renders the form with `null` data and crashes at runtime instead of a clean 404.
- Not awaiting `params` — it's a `Promise` in Next.js 16, in both the page RSC and `generateMetadata`.
- Using `router.push` instead of `router.refresh()` after an in-place mutation (delete, status change) — `push` is for navigating back to the list after create/edit; in-place actions just refresh.
- Forgetting the `published: true` filter on a new public query for this entity.

────────────────────────────────────

## Typical Effort

Small

- Add a new field to an existing CRUD
- Add a filter
- Add a bulk action
- Add a status

Medium

- New CRUD module using an existing pattern
- New public listing
- New edit form

Large

- New module with RBAC
- Public pages
- SEO
- Media uploads
- New relationships
- New permissions

────────────────────────────────────

## Verification

```bash
yarn typecheck   # catches guard/Zod/Prisma type mismatches
yarn lint
yarn build       # confirms full compile with prisma generate
```

Run in that order; fix every error before considering the module done. Then manually verify in the browser: CRUD operations, permission boundaries (test as a non-SUPERADMIN role), search/filters/pagination if present, and that mutation toasts and loading states actually appear.

────────────────────────────────────

## Delivery Summary

Every completed CRUD module should report:

- Business purpose and entity.
- Files created and files modified.
- RBAC changes (module key, seed rows).
- Migration, if any (see `prisma-migration.md`).
- API routes added.
- Verification performed.
- Manual deployment steps, if any.
- Suggested branch name and commit message.

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Related Documents

- `prisma-migration.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
