# Coding Standards

Version: 1.1.0

Last Updated: 2026-07-17

---

# Purpose

This document defines the engineering standards for the Vertex Kashmir Holidays codebase.

It is intentionally aspirational.

Not every part of the current repository follows these standards yet.

These standards represent the direction of the project.

Every new feature, bug fix, refactor, and enhancement should move the codebase closer to these standards.

These standards take precedence over existing implementation patterns unless maintaining backward compatibility requires otherwise.

---

# Engineering Philosophy

Write code that is:

- Readable
- Maintainable
- Reusable
- Testable
- Predictable
- Scalable

Code is read far more often than it is written.

Optimise for the next developer.

---

# General Principles

Every implementation should:

- Solve one problem well.
- Keep functions small and focused.
- Avoid unnecessary abstraction.
- Prefer composition over inheritance.
- Prefer reuse over duplication.
- Keep business logic independent from UI.
- Keep side effects isolated.
- Leave the codebase cleaner than before.

---

# File Responsibilities

Every file should have a single responsibility.

Examples

✅ BookingCard.tsx

Displays a booking card.

❌ BookingCard.tsx

Displays booking data

Fetches booking

Calculates totals

Validates permissions

Updates booking

Sends analytics

One file should not perform multiple unrelated responsibilities.

---

# Component Standards

Components should focus on presentation.

Avoid placing business logic directly inside UI components.

Instead use:

- hooks
- services
- utilities
- route handlers

Components should be:

- reusable
- composable
- predictable

---

# Component Size

Recommended

Small Component

100–150 lines

Medium Component

150–300 lines

Large Component

300+ lines

Once a component grows beyond roughly 300 lines, review whether it should be split.

The goal is not to satisfy a line count but to improve readability and separation of concerns.

---

# Separation of Concerns

Separate:

UI

Business Logic

Validation

Data Access

API

Utilities

Never mix these responsibilities in a single file unless there is a clear reason.

---

# Next.js Standards

Use:

- App Router
- Server Components by default
- Client Components only when required
- Route Handlers for APIs
- Metadata API
- Dynamic imports where appropriate

Avoid unnecessary "use client".

Page and layout files are thin orchestrators — they fetch data and pass props; they do not contain business logic, form handling, or multi-step state. All interactivity, state, and mutations belong in the corresponding `*Client.tsx` component.

`params` is a `Promise` in Next.js 16 — always `await` it before destructuring, in both the page and `generateMetadata`.

Caching:

| Context | Setting |
|---|---|
| Public content pages | `export const revalidate = 300` |
| Admin list, detail, and edit pages (Prisma or session reads) | `export const dynamic = "force-dynamic"` |
| Admin create/new pages (no DB access) | no directive needed |
| Account pages | `export const dynamic = "force-dynamic"` |
| Booking/payment pages | `export const dynamic = "force-dynamic"` |

Without `force-dynamic` on a page that queries Prisma or reads session state, Next.js may statically cache it and serve stale data — the create/new-page exemption above is the only case where that risk doesn't apply.

`generateMetadata` always returns `buildMetadata({ title, description, canonical, ogImage })` — never a raw `Metadata` object.

Layouts fetch shared data once for their whole subtree (e.g. the `SiteSettings` singleton in `src/app/(public)/layout.tsx`, passed down via a Context provider) — do not add per-page data fetching to a layout file.

---

# Next.js Mutation Standard

Route Handlers are the default mutation architecture.

Client mutations should follow:

fetch() → useTransition() → toast.success() / toast.error() → router.refresh() or router.push() where appropriate.

```ts
"use client";
const router = useRouter();
const [isPending, startTransition] = useTransition();

// In-place mutation (delete, status change) — refresh, no navigation
startTransition(async () => {
  const res = await fetch(`/api/resource/${id}`, { method: "DELETE" });
  if (!res.ok) { toast.error("Failed."); return; }
  toast.success("Deleted.");
  router.refresh();
});

// Create/edit — navigate back to the list
startTransition(async () => {
  const res = await fetch("/api/resource", { method: "POST" /* ... */ });
  if (!res.ok) { toast.error("Save failed."); return; }
  toast.success("Saved.");
  router.push("/admin/resource");
  router.refresh();
});
```

Server Actions are NOT currently adopted.

Introducing Server Actions requires an explicit architecture decision — it must not be done on individual features.

---

# React Standards

Prefer:

Functional Components

Composition

Custom Hooks

Memoization only when necessary

Avoid:

Deep prop drilling

Massive JSX files

Complex inline logic

Duplicated state

---

# TypeScript Standards

Always

- Use strict typing.
- Prefer interfaces for manually defined object contracts.
- Prefer inferred types from Zod schemas whenever a validation schema already exists.
- Never duplicate a Zod schema with a manually-written interface.
- Avoid any.
- Avoid unknown unless intentionally narrowing.

Public APIs should always be strongly typed.

---

# Validation Standards

Validation belongs outside UI.

Use:

Zod

React Hook Form

Share validation schemas wherever possible.

Never duplicate validation logic.

---

# Database Standards

Use Prisma — the single client instance in `src/lib/prisma.ts` (`import { prisma } from "@/lib/prisma"`). Never call `new PrismaClient()` anywhere else.

Avoid raw SQL unless performance requires it.

Prisma transactions are the required standard for multi-step writes. Existing gaps are technical debt — future implementations must use transactions by default.

Migration cadence: one migration file per sprint, generated via `yarn db:migrate` once that sprint's schema changes are finalized — not one migration per individual change. Schema history as of 2026-07-17 was fully re-baselined into a single migration (`prisma/migrations/20260717000000_baseline`) after the prior per-change history turned out to have significant gaps from ad hoc `db:push` usage; the pre-baseline history is archived under `prisma/migrations_archive/` for reference only, not read by Prisma.

Never query the database from UI components.

Keep database access inside dedicated server-side layers.

Select only the columns a list query needs — don't load a full row just to display a few fields.

Singleton rows (e.g. `SiteSettings`, `HomeContent`, `AboutContent`, `ContactContent`, `BlogContent`) have exactly one row, `id: "singleton"`. Read with `findUnique({ where: { id: "singleton" } })`, write with `upsert` — never `create` a second row.

Public list endpoints use cursor-based pagination (`take + 1`, check `hasMore`, return `nextCursor`); admin list endpoints use offset (`skip`/`take`). Don't mix the two conventions on one endpoint.

Check a caught Prisma error's message for `"P2002"` to detect a duplicate slug/email conflict, and return `409` with a human-readable message — never a raw database error.

JSON Columns

Some columns store JSON inside a String field. Always:

- Stringify on write.
- Safely parse on read, with a sensible fallback.
- Centralize parsing — never parse the same column inline in multiple places.

Affected columns on `Tour` (15): `gallery`, `itinerary`, `inclusions`, `exclusions`, `batches`, `highlights`, `perfectFor`, `notIdealFor`, `accommodation`, `budgetBreakdown`, `personalExpenses`, `thingsToCarry`, `localTravelTips`, `importantNotes`, `relatedTours`. Affected columns on `Campaign` (11): `facts`, `strip`, `stats`, `highlights`, `activities`, `itinerary`, `tiers`, `batches`, `inclusions`, `exclusions`, `gallery`. Zod schemas for these accept them as `z.string()` (the raw JSON string), not `z.array(...)`.

`faqs` is **not** a JSON-string column on either model — it was migrated to a centralized `Faq[]` relation (see the schema comment above `Faq`). `testimonials` is not a `Campaign` field at all (only `testimonialsKicker`/`testimonialsTitle` plain strings exist elsewhere in the schema). Verify against `prisma/schema.prisma` directly rather than trusting this list if the schema has changed since 2026-07-17.

Financial Calculations

All booking, pricing, discount, and GST calculations must come from shared business logic.

- Never duplicate a money calculation.
- Never calculate totals directly inside a component.
- Use the shared finance utilities as the single source of truth.

Soft Delete

Business records should default to soft deletion unless there is a strong reason otherwise. Hard delete must be an explicit decision.

---

# API Standards

Route handlers should:

- Validate input
- Authorize access
- Return consistent responses
- Never expose internal errors

Keep handlers thin.

Business logic belongs elsewhere.

---

# State Management

Prefer:

Server Components

Route Handlers for mutations (see Next.js Mutation Standard)

React Hooks

Context API

Avoid unnecessary global state.

---

# Styling Standards

Use Tailwind CSS.

Reuse existing utility classes.

Prefer shared UI components over one-off styling.

Avoid duplicated utility combinations.

---

# Design System

Always reuse existing UI components before creating new ones.

If a reusable component does not exist:

1. Check existing patterns.
2. Generalise if appropriate.
3. Add it to the design system.

Avoid creating multiple implementations of the same UI pattern.

---

# Error Handling

Errors should:

- be handled gracefully
- provide useful messages
- never expose sensitive information
- be logged where appropriate

Avoid silent failures.

---

# Logging

Use structured logging.

- No temporary console.log().
- No debugging logs.
- Operational logs are temporarily acceptable until structured logging is implemented.
- Future work will replace them with a centralized logger.

Never commit:

debugger

temporary code

commented code

---

# Performance

Optimise only after measuring.

Prefer:

Server rendering

Image optimisation

Lazy loading

Memoization when justified

Bundle splitting

Avoid premature optimisation.

---

# Accessibility

Every feature should consider:

Keyboard navigation

Semantic HTML

ARIA labels

Colour contrast

Focus management

Accessibility is part of implementation—not an enhancement.

---

# Security

Never trust client input.

Always:

Validate

Sanitize

Authorize

Rate limit sensitive endpoints

Protect secrets

Never expose environment variables to the client unless explicitly public.

Authorization is a mandatory three-layer model. Every protected feature must enforce all three:

Layer 1 — Middleware: authentication.

Layer 2 — Layout / UI: permission-aware visibility.

Layer 3 — Route handler: permission enforcement via requirePermission().

UI visibility alone must never be treated as authorization.

`requirePermission(module, action)` returns either the authorized `Session` or a `NextResponse` (401/403) — check `instanceof NextResponse` immediately and return early; don't call `auth()` again separately in the same handler. Use `requireStaff()` for a route not tied to a specific module (e.g. uploads).

Module keys are the canonical `MODULES` list in `src/lib/rbac.ts` — add a key there before referencing it in a guard; never hardcode a string outside that list. `SUPERADMIN` bypasses the permission table inside `requirePermission`/`can()` already — never add a separate `if role === "SUPERADMIN"` branch.

Keep edge-safe code isolated: `rbac.ts` (pure constants) and `auth.config.ts` are edge-safe and may be imported by middleware; `permissions.ts` and `auth.ts` are server-only (Prisma + NextAuth) and must never be imported from middleware.

Public / Account / Admin data boundary — three distinct areas, never mixed:

| Area | Path prefix | Auth | Data access |
|---|---|---|---|
| Public site | `src/app/(public)/` | None | Published records only, ISR |
| Customer account | `src/app/account/` | Any authenticated user | Own records (filtered by `userId`) |
| Admin CMS | `src/app/admin/` | Staff roles only | All records, no `published` filter |

Public queries always filter `published: true` — there is no draft-preview mechanism on the public site. Account queries always scope to `where: { userId: session.user.id }` and never call `requirePermission` (that's staff-only). Admin components (`src/components/admin/**`) never import from public-site component trees, and vice versa. The middleware (`src/proxy.ts`) enforces the redirect boundary (unauthenticated → `/login`; an authenticated customer hitting `/admin/*` → `/account`) — don't replicate that logic in individual pages.

---

# Integration Standards

Third-party integrations must degrade gracefully.

When an optional credential is missing, the integration should:

- Disable the feature.
- Log a warning.
- Never crash local development.
- Never break unrelated functionality.

This applies to Cloudinary, Turnstile, Upstash, Offline Conversion adapters, and future integrations.

---

# Documentation

Document:

Architectural decisions

Complex business logic

Public utilities

Shared components

Avoid obvious comments.

Code should explain "how".

Documentation should explain "why".

---

# Refactoring

Refactoring should:

Improve readability

Reduce duplication

Improve separation of concerns

Not change business behaviour

Refactoring should never introduce feature changes.

---

# Testing

Every implementation should be verifiable.

Minimum verification:

- TypeScript
- ESLint
- Production Build

Future:

- Unit Tests
- Integration Tests
- End-to-End Tests

---

# Code Review Checklist

Before considering work complete verify:

- No duplicated code
- No dead code
- No unnecessary dependencies
- Strong typing
- Correct folder placement
- Business logic separated
- Responsive UI preserved
- Accessibility maintained
- Existing functionality unchanged
- Documentation updated if required

---

# Technical Debt

Do not increase technical debt.

If existing code violates these standards:

- Leave it better than you found it.
- Improve incrementally.
- Avoid unnecessary large-scale rewrites.

Current repository violations should be tracked in Plane.

Coding Standards define the target architecture, not the current implementation.

---

# Related Documents

- ../context/project-overview.md
- ../context/business-rules.md
- ../context/tech-stack.md
- architecture.md
- git-workflow.md
- testing.md