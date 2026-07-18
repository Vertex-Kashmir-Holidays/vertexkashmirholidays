This Skill defines how a CRM, admin operations, or business-workflow ticket is oriented before implementation in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not generic workflow advice.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# CRM / Admin / Business Workflow Ticket

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This Skill defines how a CRM or admin operations ticket is scoped in Vertex — any change involving staff workflows, booking/inquiry management, customer data, admin UI, or business-rule logic. It exists to force identification of the owning surface, the RBAC module, and any status-transition rules *before* code is written, instead of discovering mid-build that a route was left unguarded or a transition wasn't validated server-side.

────────────────────────────────────

## When to Use

Use this Skill when implementing a CRM or admin operations ticket: adding a new booking action, building an admin report, adding a status field, wiring a new notification, adding a new admin module, or any change touching staff workflows, booking/lead management, or customer data.

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- Building a first-class admin CRUD module with its own sidebar entry, list/create/edit pages, and RBAC module key — use `admin-crud.md`; this Skill orients a ticket, `admin-crud.md` covers the build mechanics.
- A schema-only change with no admin workflow implication — use `prisma-migration.md`.
- Public-site-only or customer-account-only changes with no staff-facing workflow.

────────────────────────────────────

## Prerequisites

Before touching any code, read the files relevant to the owning surface:

| Always read | Purpose |
|---|---|
| `src/lib/rbac.ts` | Module key list (`MODULES`), role constants |
| `src/lib/permissions.ts` | `requirePermission`, `requireStaff` API guard pattern |
| `src/lib/auth.config.ts` | Edge-safe session/role callbacks |
| `prisma/schema.prisma` | Model fields and status enums |

Then read the specific existing implementation closest to the ticket:

- For bookings: `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`, `src/components/admin/bookings/BookingsClient.tsx`
- For leads: `src/app/api/leads/route.ts`, `src/app/api/leads/[id]/route.ts`, `src/components/admin/leads/LeadsClient.tsx` — note the lead-to-booking conversion path is a dedicated endpoint, `src/app/api/leads/[id]/convert/route.ts`, not a plain status PATCH (see Status Transitions below).
- For a new entity: the nearest model in `prisma/schema.prisma` + its API route pair

────────────────────────────────────

## Step 1 — Identify the owning surface

Answer these questions before writing any task map:

**Which area owns the work?**

| Surface | Signs |
|---|---|
| **Public site** | Visible to guests, no auth, `published: true` filter required, ISR |
| **Customer account** | Requires login, scoped to `session.user.id`, `force-dynamic` |
| **Admin CMS** | Staff-only, uses `requirePermission`, `force-dynamic` |
| **CRM / operations** | Admin sub-area: bookings, leads, itineraries, reviews, users |

Most CRM tickets live in admin + API routes only. If the ticket also touches the public site (e.g. a status badge visible to customers), name that explicitly.

**Which RBAC module key applies?**

Check `MODULES` in `src/lib/rbac.ts`. Every new admin section needs a `{ key, label, href }` entry there. Every mutating API route needs `requirePermission("<key>", "<action>")`.

**What status enum is involved?**

Check `prisma/schema.prisma` for the relevant enum — `LeadStatus`, `BookingStatus`, or `ItineraryStatus`. See Status Transitions below before assuming a plain enum swap is safe.

────────────────────────────────────

## Step 2 — Produce a task map before coding

Write out this map and confirm it before writing any implementation:

```
Surface: [public | account | admin-cms | crm-ops]
RBAC module key: <key from MODULES>
New module key needed: [yes | no]
JSON column affected: [yes — <field names, verified against schema.prisma> | no]

Prisma changes:
  - [ ] New model / field / enum value: <name>
  - [ ] Migration required: [db:push (dev only) | db:migrate (records a migration file)]

Module registration (if new key):
  - [ ] Add { key, label, href } to MODULES in src/lib/rbac.ts
  - [ ] Add RolePermission rows for ADMIN, SALES, EDITOR in prisma/seed.ts
  - [ ] Run yarn db:seed

API routes touched:
  - [ ] GET  /api/<resource>   — requirePermission("<key>", "view")
  - [ ] POST /api/<resource>   — requirePermission("<key>", "create")
  - [ ] PATCH /api/<resource>/[id] — requirePermission("<key>", "edit")
  - [ ] DELETE /api/<resource>/[id] — requirePermission("<key>", "delete")

Admin page files:
  - [ ] src/app/admin/<module>/page.tsx        (list — export const dynamic = "force-dynamic")
  - [ ] src/app/admin/<module>/new/page.tsx    (create — no force-dynamic if no DB access)
  - [ ] src/app/admin/<module>/[id]/edit/page.tsx  (edit — export const dynamic = "force-dynamic")

Admin UI components:
  - [ ] src/components/admin/<module>/<Name>Client.tsx  (list — "use client")
  - [ ] src/components/admin/<module>/<Name>Form.tsx    (create/edit — "use client", dual-use via defaults prop)

Public page impact: [none | <describe>]
Account page impact: [none | <describe>]

Email notification: [none | sendMail() from src/lib/mail.ts — throws if SMTP env vars are unset, acceptable in prod, account for it in local dev]
Seed update needed: [yes | no]
```

────────────────────────────────────

## Step 3 — Implementation order

**If the task map above concluded this needs a new module** (new sidebar entry, new list/create/edit pages) — stop here and hand off to `admin-crud.md` → Vertex Standard Workflow for the full build sequence. Don't duplicate those steps in this ticket's plan; reference them.

**If it's a smaller change to an existing module** (a new action, field, notification, or status on a model that already has its admin surface) — schema change first (`prisma-migration.md` if the model itself changes), then the specific route(s)/component(s) the ticket touches, following the existing module's established pattern rather than introducing a new one. Re-seed `RolePermission` only if a new module key was actually added in Step 1 — most small changes reuse an existing key and need no seed change.

────────────────────────────────────

## Status Transitions

There is no client-side `ALLOWED_TRANSITIONS` allow-list in this codebase today — `BookingsClient.tsx` and `LeadsClient.tsx` both offer the full enum in their status control, and the PATCH route validates the value is a legal enum member (Zod) but does not run a general transition state machine. Instead, specific transitions are special-cased server-side per model:

- **`Booking.status = CANCELLED`** — `PATCH /api/bookings/[id]` requires an admin role; a non-admin request setting this value is rejected.
- **`Lead.status = CONVERTED`** — blocked entirely from the normal `PATCH /api/leads/[id]` path; conversion only happens through the dedicated `POST /api/leads/[id]/convert` endpoint (which also creates the `Booking` and locks the itinerary in one `$transaction`).

When a ticket adds a new status value or a new transition-sensitive action, check the specific model's PATCH handler for an existing special case before assuming a plain enum swap is safe — and add a new special case there (not a client-side check) if the transition needs guarding.

────────────────────────────────────

## Common Mistakes

Observed failure modes in this repository's actual patterns — not generic advice:

- **Skipping `requirePermission` on a new handler.** The middleware only checks `isStaff` — module-level access is not enforced until the API route guard. A new route without `requirePermission` is accessible to all staff roles.
- **Assuming a status transition is validated by a client-side allow-list.** There isn't one (see Status Transitions above) — guard sensitive transitions server-side, in the route handler.
- **Forgetting `export const dynamic = "force-dynamic"` on admin pages.** Admin pages that read session-dependent or real-time data will be incorrectly cached without this.
- **Adding a new RBAC module without seeding `RolePermission` rows.** SUPERADMIN bypasses the table, so a module missing its seed rows will appear to work when tested as SUPERADMIN and be completely locked out for ADMIN/SALES/EDITOR until `yarn db:seed` runs.
- **Mixing admin query scope into public routes.** Public API routes must always filter `published: true`. Do not add a staff-only filter bypass to a public route — create a separate admin route instead.
- **Offset pagination in admin ≠ cursor pagination in public.** Admin list endpoints use `skip`/`take` with page numbers. Public endpoints use cursor-based pagination. Don't change the pattern when editing an existing route.
- **Sending email from an API route without checking SMTP config.** `sendMail()` in `src/lib/mail.ts` will throw if SMTP env vars are not configured. This is acceptable behaviour in production, but account for it in local dev.

────────────────────────────────────

## Verification

```bash
yarn typecheck   # catches guard/Zod/Prisma type mismatches
yarn lint
yarn build       # confirms full compile with prisma generate
```

Run in that order; fix every error before considering the ticket done. Then manually verify in the browser: the workflow end-to-end, permission boundaries (test as a non-SUPERADMIN role), and — if a status transition was touched — that the server-side guard actually rejects the disallowed case, not just that the happy path works.

────────────────────────────────────

## Delivery Summary

Every completed CRM/admin ticket should report:

- Business purpose and owning surface (public / account / admin-cms / crm-ops).
- RBAC changes (module key, seed rows), if any.
- Migration, if any (see `prisma-migration.md`).
- API routes added or modified.
- Status-transition guards added, if any.
- Verification performed.
- Manual deployment steps, if any.
- Suggested branch name and commit message.

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Related Documents

- `admin-crud.md`
- `prisma-migration.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
