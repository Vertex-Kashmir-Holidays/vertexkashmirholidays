# Skill: CRM / Admin / Business Workflow Ticket

## When to use

Use this skill when implementing a CRM or admin operations ticket — any change that involves staff workflows, booking/inquiry management, customer data, admin UI, or business-rule logic. Examples: adding a new booking action, building an admin report, adding a status field, wiring a new notification, or adding a new admin module.

---

## Step 1 — Read these files first

Before touching any code, read the files relevant to the owning surface:

| Always read | Purpose |
|---|---|
| `src/lib/rbac.ts` | Module key list, role constants |
| `src/lib/permissions.ts` | `requirePermission`, `requireStaff` API guard pattern |
| `src/lib/auth.config.ts` | Edge-safe session/role callbacks |
| `prisma/schema.prisma` | Model fields and status enums |

Then read the specific existing implementation closest to the ticket:

- For bookings: `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`, `src/components/admin/bookings/BookingsClient.tsx`
- For inquiries: `src/app/api/inquiries/route.ts`, `src/app/api/inquiries/[id]/route.ts`
- For a new entity: the nearest model in `prisma/schema.prisma` + its API route pair

---

## Step 2 — Identify the owning surface

Answer these questions before writing any task map:

**Which area owns the work?**

| Surface | Signs |
|---|---|
| **Public site** | Visible to guests, no auth, `published: true` filter required, ISR |
| **Customer account** | Requires login, scoped to `session.user.id`, `force-dynamic` |
| **Admin CMS** | Staff-only, uses `requirePermission`, `force-dynamic` |
| **CRM / operations** | Admin sub-area: bookings, inquiries, itineraries, reviews, users |

Most CRM tickets live in admin + API routes only. If the ticket also touches the public site (e.g. a status badge visible to customers), name that explicitly.

**Which RBAC module key applies?**

Check `MODULES` in `src/lib/rbac.ts`. Every new admin section needs a key there. Every mutating API route needs `requirePermission("<key>", "<action>")`.

**What status enum is involved?**

Check `prisma/schema.prisma` for the relevant enum (`BookingStatus`, `InquiryStatus`, `ItineraryStatus`). Status transitions must be validated server-side — the client `ALLOWED_TRANSITIONS` map in `BookingsClient.tsx` is a UI convenience, not the authority.

---

## Step 3 — Produce a task map before coding

Write out this map and confirm it before writing any implementation:

```
Surface: [public | account | admin-cms | crm-ops]
RBAC module key: <key from MODULES>
New module key needed: [yes | no]
JSON column affected: [yes — <field names> | no]

Prisma changes:
  - [ ] New model / field / enum value: <name>
  - [ ] Migration required: [db:push | db:migrate]

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

Email notification: [none | sendMail() from src/lib/mail.ts]
Seed update needed: [yes | no]
```

---

## Step 4 — Implementation order

1. **Schema first** — add or alter the Prisma model, run `yarn db:push`
2. **Module registration (if new key)** — add `{ key, label, href }` to `MODULES` in `src/lib/rbac.ts` before writing any route that calls `requirePermission("<key>", ...)`. `ModuleKey` is a derived `const` type; a missing key is a TypeScript error at the call site.
3. **Seed RolePermission rows** — add rows for ADMIN, SALES, EDITOR to `PERMISSION_DEFAULTS` in `prisma/seed.ts`, then run `yarn db:seed`. Do this before testing any API route, otherwise all non-SUPERADMIN roles are silently locked out.
4. **API routes** — add/modify route handlers with `requirePermission` guards and Zod validation
5. **Admin page RSCs** — list page (`force-dynamic`, Prisma `select`, renders `*Client`); create page (no DB access, no `force-dynamic`); edit page (`force-dynamic`, full `findUnique`, passes `defaults` to form)
6. **Admin UI components** — `*Client.tsx` for the list (`"use client"`, `useTransition` + `router.refresh()` after mutations, toast via `sonner`); `*Form.tsx` for create/edit (dual-use via `defaults` prop, `useForm` + `zodResolver`, `router.push` + `router.refresh()` on save)

---

## Common risks in this repo

**Skipping `requirePermission` on a new handler.** The middleware only checks `isStaff` — module-level access is not enforced until the API route guard. A new route without `requirePermission` is accessible to all staff roles.

**Status transitions not validated server-side.** `ALLOWED_TRANSITIONS` in `BookingsClient.tsx` is client-side UI only. The `PATCH /api/bookings/[id]` handler must independently validate which transitions are legal, not trust the client.

**Forgetting `export const dynamic = "force-dynamic"` on admin pages.** Admin pages that read session-dependent or real-time data will be incorrectly cached without this.

**Adding a new RBAC module without seeding `RolePermission` rows.** SUPERADMIN bypasses the table, but ADMIN/SALES/EDITOR will have no access to the new module until rows are seeded or manually set.

**Mixing admin query scope into public routes.** Public API routes must always filter `published: true`. Do not add a staff-only filter bypass to a public route — create a separate admin route instead.

**Offset pagination in admin ≠ cursor pagination in public.** Admin list endpoints use `skip`/`take` with page numbers. Public endpoints use cursor-based pagination. Don't change the pattern when editing an existing route.

**Sending email from an API route without checking SMTP config.** `sendMail()` in `src/lib/mail.ts` will throw if SMTP env vars are not configured. This is acceptable behaviour in production, but account for it in local dev.
