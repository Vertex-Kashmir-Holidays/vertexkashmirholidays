# Architecture Overview

Version: 1.0.0

Last Updated: 2026-07-25

## Who this is for

This is the one document a new engineer reads to understand **what the major
architectural decisions are and why they were made** — before touching code.

It is deliberately narrative and standalone: you should be able to read it
top to bottom without opening anything else and come away knowing how the
system is shaped and *why*. Each decision links to a fuller Architecture
Decision Record (ADR) in `../adr/` when you want the full context and the
alternatives that were rejected.

**This document vs. the neighbours:**

- `../instructions/architecture.md` — the *principles* (how layers, folders,
  and data flow should relate). Stable, prescriptive, forward-looking. It says
  *how to build*; this document says *why we build it that way*.
- `../adr/` — the *decision log*. One record per significant decision, with the
  context and consequences at the time it was made. Append-only history.
- This document — the *map*. A curated summary of the decisions that shape the
  system today, each pointing to its ADR.

If any of these ever disagree, the ADR is the authority on *why a decision was
made*; `architecture.md` is the authority on *the current rule*.

────────────────────────────────────

## The system in one page

Vertex Kashmir Holidays is a production travel platform with three surfaces
served from **one Next.js 16 (App Router) application**:

- **Public website** — tour discovery, SEO, content marketing, lead capture.
- **CRM (`/admin`)** — leads, bookings, customers, payments, itineraries,
  reporting.
- **Customer area (`/account`)** — a signed-in traveller's bookings, reviews,
  and profile.

These are route groups (`(public)`, `admin`, `account`, `login`) in a single
codebase, not separate services. The stack is Next.js 16 + React 19 +
TypeScript (strict) on the front, Next.js Route Handlers + Zod + Prisma on the
back, PostgreSQL (Neon) as the store, and NextAuth v5 for auth. External work
— payments (Razorpay), media (Cloudinary), ad-conversion uploads
(Google/Meta), rate limiting (Upstash), bot protection (Turnstile) — is each
reached through a single dedicated module, never instantiated ad hoc.

A request flows one direction:

```
Browser
  → UI (Server Component by default; Client Component only for interactivity)
  → fetch() inside useTransition()        (client mutations only)
  → Route Handler (src/app/api/**)        validates (Zod) + authorizes (requirePermission)
  → Domain function (src/lib/<domain>)    where real business logic exists
  → Prisma (src/lib/prisma.ts)
  → PostgreSQL (Neon)
```

UI never reaches around this flow to call Prisma or an external API directly.
The full principle set behind this diagram is in
`../instructions/architecture.md`.

────────────────────────────────────

## The major decisions

Each decision below is summarised here and recorded in full in `../adr/`.

| # | Decision | In one line |
|---|----------|-------------|
| [0001](../adr/0001-route-handlers-over-server-actions.md) | Route Handlers + `fetch` + `useTransition`, **not** Server Actions | One mutation style across the whole app. |
| [0002](../adr/0002-prisma-neon-postgres.md) | Prisma + PostgreSQL (Neon), separate dev/prod databases | One typed data access path, forward-only migrations. |
| [0003](../adr/0003-nextauth-three-layer-authorization.md) | NextAuth v5 + three-layer authorization (middleware → layout → `requirePermission`) | Defense in depth; DB-driven RBAC. |
| [0004](../adr/0004-server-computed-pricing.md) | Prices computed server-side; the client never sends an amount | The browser is never trusted with money. |
| [0005](../adr/0005-integration-adapter-pattern.md) | Pluggable adapter pattern for external integrations | Add a provider without touching callers; no-op when unconfigured. |
| [0006](../adr/0006-domain-logic-in-lib.md) | Business logic in `src/lib/<domain>`; finance has a single source of truth | Pricing/GST computed once, imported everywhere. |

### 0001 — Route Handlers over Server Actions

The entire app mutates data through Route Handlers under `src/app/api/**`,
called from the client with `fetch()` wrapped in `useTransition()`. Next.js
Server Actions (`"use server"`) are **not used anywhere** — deliberately.

**Why:** one consistent mutation style is easier to reason about, secure, and
review than two competing ones. Route Handlers give us an explicit HTTP
boundary where Zod validation and `requirePermission` authorization always run.
Adopting Server Actions later would be a documented, project-wide decision — not
an incidental one feature at a time. → [ADR 0001](../adr/0001-route-handlers-over-server-actions.md)

### 0002 — Prisma + PostgreSQL (Neon)

A single Prisma client (`src/lib/prisma.ts`) is the only way application code
reaches the database. Neon hosts two separate databases (dev and prod), and
every schema change ships as a committed Prisma migration — never `db:push`
alone. Prisma Migrate is forward-only; there are no down-migrations.

**Why:** end-to-end type safety from schema to query, one connection seam to
manage, and an auditable migration history. The dev/prod split keeps
experiments off production data. → [ADR 0002](../adr/0002-prisma-neon-postgres.md)

### 0003 — NextAuth v5 with three-layer authorization

NextAuth v5 runs three coexisting sign-in paths (staff/customer credentials,
Google OAuth, Google One Tap), all resolving to the same session shape.
Authorization is enforced in three independent layers: edge middleware →
the admin layout → a `requirePermission(module, action)` check inside each
Route Handler. Roles and permissions are stored in the database (RBAC), not
hard-coded.

**Why:** no single layer is trusted to be the only guard. The API-route check
is the real enforcement; middleware and the layout are earlier, coarser gates.
Google sign-in is a customer-only convenience path and never provisions staff.
→ [ADR 0003](../adr/0003-nextauth-three-layer-authorization.md)

### 0004 — Server-computed pricing

Every payment amount is computed on the server from stored data (e.g.
`tour.priceFrom`). The client sends *what* to pay for, never *how much*. The
Razorpay flow is server-verified end to end: `create-order` (server prices) →
client checkout → `verify-payment` (HMAC signature check) → `webhook` (async
confirmation).

**Why:** money is the one thing a browser must never be trusted with. A
tampered client request can change what a user tries to buy, but never the
price they are charged. → [ADR 0004](../adr/0004-server-computed-pricing.md)

### 0005 — Integration adapter pattern

External integrations are reached through one dedicated module each, and the
multi-provider ones follow a shared adapter shape: a common interface, an
`isConfigured()` guard, and a `send()`/upload method per provider. The
offline-conversion adapters (`lib/offlineConversion/adapters/{google,meta,microsoft}.ts`)
are the reference implementation.

**Why:** callers speak to an interface, not a vendor SDK, so adding or swapping
a provider touches one file. Every adapter no-ops gracefully when its
credentials are absent, which keeps local development zero-setup and prevents a
missing env var from crashing a request. → [ADR 0005](../adr/0005-integration-adapter-pattern.md)

### 0006 — Domain logic in `lib/<domain>`, finance single-sourced

Business logic lives in `src/lib/<domain>/` (e.g. `lib/bookings/finance.ts`,
`lib/payments/gst.ts`, `lib/leads/schema.ts`), never inside a component and
never duplicated. Financial calculations in particular go through shared
utilities — `computeBookingFinance`, `computeDiscountAmount`, `resolveGst` — as
the single source of truth. No component or route computes a discount, GST
amount, or balance independently.

**Why:** a number computed in two places is a number that will eventually
disagree with itself. Centralising the rules means the API that writes a value
and the UI that displays it always agree. → [ADR 0006](../adr/0006-domain-logic-in-lib.md)

────────────────────────────────────

## Decisions captured elsewhere (no separate ADR)

Some architectural choices are already fully documented in the principles and
tech-stack docs and don't need a standalone ADR. They are noted here so the map
is complete:

- **Server-first rendering** — React Server Components by default; a component
  becomes a Client Component only for a genuine reason (browser APIs, forms,
  interactive state, animation, third-party browser SDKs). See
  `../instructions/architecture.md` → Server vs Client.
- **Validation at the boundary with Zod** — one schema per domain, shared
  between the form and the Route Handler it posts to. See
  `tech-stack.md` → Zod.
- **ISR for public content, `force-dynamic` for authenticated pages** — see
  `../instructions/architecture.md` → Performance.
- **Cloudinary storage seam with local-filesystem fallback** — see
  `tech-stack.md` → File Storage.

────────────────────────────────────

## Where to go next

- Principles and rules — `../instructions/architecture.md`
- The technologies in use and the rule for each — `tech-stack.md`
- Business rules (pricing, statuses, categories) — `business-rules.md`
- The full decision log and how to add one — `../adr/README.md`

────────────────────────────────────

## Related Documents

- `../adr/README.md`
- `../instructions/architecture.md`
- `project-overview.md`
- `tech-stack.md`
- `business-rules.md`
