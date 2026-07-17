This document defines the target software architecture of Vertex Kashmir Holidays.

This is NOT documentation of the current codebase.

This is the engineering architecture the project should evolve towards over the coming sprints.

Where the current implementation differs, this document defines the target state — see the separate architecture review for where that gap exists today.

Do not invent technologies not used in this repository.

────────────────────────────────────

# Architecture

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This document defines the architectural principles for Vertex Kashmir Holidays — how layers, folders, and data flow should relate to one another, independent of any single feature.

Architecture should remain stable over time. Business logic (pricing rules, lead statuses, tour categories — see `business-rules.md`) may evolve freely without requiring an architectural change. A change to this document should be rare and deliberate; a change to `business-rules.md` should not require one.

────────────────────────────────────

## 1. Architectural Principles

- **Separation of Concerns** — presentation, business logic, validation, and data access are never mixed in one file.
- **Single Responsibility** — one file, one job (see `coding-standards.md` → File Responsibilities).
- **Composition over duplication** — a shared hook/utility/component beats a second copy of the same logic.
- **Modular, domain-oriented design** — code is organized by business domain (`bookings`, `leads`, `tours`, `payments`) inside shared layers, not by technical type alone.
- **Predictable data flow** — one direction, described in Section 5; no component reaches around the flow to call Prisma or an external API directly.
- **Strong typing** — TypeScript strict mode; Zod schemas are the source of truth for any type that crosses a validation boundary.
- **Reusable UI** — shared primitives before bespoke markup (see `coding-standards.md` → Design System).
- **Server-first** — Server Components and Route Handlers do the work; the client renders and dispatches.

────────────────────────────────────

## 2. Layered Architecture

**Presentation Layer** — `src/app/**` (routes, layouts, metadata) and `src/components/**` (UI, organized by domain: `bookings/`, `leads/`, `admin/`, `tours/`, `ui/` for shared primitives). Server Components by default; Client Components only per Section 4.

**Application Layer** — client-side orchestration: `useTransition`-wrapped `fetch()` calls, local component state, and the small set of Context providers under `src/components/providers/` (`ThemeProvider`, `SiteSettingsProvider`, `SiteAnalytics`, `AttributionCapture`). A dedicated `src/hooks/` directory for shared custom hooks does not exist yet — this is a named target (see Section 7 and the Refactoring Opportunities in the architecture review), not an invented one.

**Domain Layer** — business logic and validation, living in `src/lib/<domain>/` (e.g. `lib/bookings/finance.ts`, `lib/payments/gst.ts`, `lib/leads/schema.ts`, `lib/bookings/customer.ts`). This is where pricing, GST, lead deduplication, and customer-resolution rules are computed — never inside a component or inline in a route handler.

**Infrastructure Layer** — Prisma/PostgreSQL (Neon), Cloudinary, Razorpay, Upstash Redis, Cloudflare Turnstile, Google (OAuth, Ads, Places), Meta Conversions API, and Jitsi (Vertex Connect). Each is accessed through a single dedicated module (`lib/prisma.ts`, `lib/storage.ts`, `lib/ratelimit.ts`, `lib/security/turnstile.ts`) — never instantiated ad hoc in a route or component.

────────────────────────────────────

## 3. Component Architecture

Separate, within any feature:

- **UI** — the component itself, presentation only.
- **Logic** — extracted into a hook or a `lib/<domain>` function.
- **Data** — fetched in the parent Server Component (RSC) and passed down as props, or fetched client-side via `fetch()` inside a `useTransition`.
- **Validation** — a Zod schema imported from `lib/<domain>`, shared between the form and the Route Handler it posts to.

Avoid massive components — see `coding-standards.md` → Component Size (300+ lines triggers a split review). Promote composition: a large admin screen is a composition of focused sub-components, not one file with 20+ pieces of local state.

────────────────────────────────────

## 4. Server vs Client

Server Components by default. Client Components only when the component genuinely needs one of:

- **Browser APIs** — `localStorage`, `matchMedia`, clipboard, etc.
- **Forms** — React Hook Form + Zod resolvers require client-side state.
- **Interactive state** — admin tables/filters, multi-step wizards, anything with `useState`/`useTransition`.
- **Animations** — Framer Motion transitions.
- **Third-party browser SDKs** — Cloudflare Turnstile widget, Google One Tap script, Razorpay `checkout.js`, Three.js/`@react-three/fiber` (the `r3f` hero mode).

Avoid marking a component client-only for static content that merely sits inside a client-only animation wrapper — this is a known, tracked gap (see architecture review).

────────────────────────────────────

## 5. Data Flow

```
Browser
  ↓
UI (Server Component, or Client Component for interactivity)
  ↓
fetch() inside useTransition()          — client mutations only; see coding-standards.md → Next.js Mutation Standard
  ↓
Route Handler (src/app/api/**)          — validates (Zod) + authorizes (requirePermission)
  ↓
Domain function (src/lib/<domain>)      — where one exists for this operation
  ↓
Prisma (src/lib/prisma.ts)
  ↓
PostgreSQL (Neon)
```

UI never accesses Prisma directly — only Route Handlers and Server Components import `@/lib/prisma`. The "Domain function" step is real (`resolveLeadCustomer`, `computeBookingFinance`, `resolveGst` are genuine, imported, single-source-of-truth functions) but not yet universal — several Route Handlers call `prisma.<model>.create/update` directly inline rather than through a named domain function. The target is that any operation with real business logic (pricing, customer matching, dedup) always goes through a named `lib/<domain>` function; simple CRUD may remain inline in the Route Handler.

────────────────────────────────────

## 6. Business Logic

- Business logic must not live inside a component — it lives in `src/lib/<domain>`.
- Business logic should be reusable across the Route Handler that mutates data and the UI that displays a derived value (e.g. payment status), never recomputed twice.
- **Financial calculations must use the shared finance utilities** — `computeBookingFinance`, `computeDiscountAmount`, `resolveGst` (see `lib/bookings/finance.ts`, `lib/payments/gst.ts`) — as the single source of truth. No component or route may compute a discount, GST amount, or balance independently.
- Validation must be centralized as a Zod schema per domain, imported by both the form and the Route Handler — never duplicated as two parallel checks.

────────────────────────────────────

## 7. Folder Responsibility

- **`app/`** — routes, layouts, route handlers (`app/api/**`). Thin orchestrators only — fetch data, pass props, no business logic (see `coding-standards.md` → Next.js Standards).
- **`components/`** — presentation, organized by domain (`bookings/`, `leads/`, `admin/`, `tours/`, …), plus `components/ui/` for shared primitives and `components/providers/` for the small set of Context providers.
- **`lib/`** — the combined application + domain + infrastructure layer: cross-cutting utilities (`auth.ts`, `permissions.ts`, `rbac.ts`, `ratelimit.ts`, `prisma.ts`) alongside per-domain subfolders (`bookings/`, `leads/`, `payments/`, `tours/`, `security/`, `admin/`, `offlineConversion/`).
- **`types/`** — shared TypeScript types, one file per domain (`tours.ts`, `campaign.ts`, `analytics.ts`, …) plus ambient module augmentation (`next-auth.d.ts`).
- **`hooks/`** — not yet a real top-level directory. Target: shared custom hooks (e.g. the hydration-mount-guard pattern currently duplicated across several components) move here once extracted.
- **`schemas/`** — intentionally not centralized as a separate top-level folder. A Zod schema lives beside the domain it validates (`lib/leads/schema.ts`, `lib/admin/campaignSchema.ts`, `lib/bookings/service-schema.ts`), or inline in the Route Handler for a simple, single-use shape. Do not introduce a top-level `schemas/` folder — it would fight the domain-oriented organization of `lib/`.
- **`actions/`** — does not exist and is not planned. Server Actions are not adopted in this project (see `coding-standards.md` → Next.js Mutation Standard); introducing one would require an explicit architecture decision, not an incidental folder.

────────────────────────────────────

## 8. API Architecture

Every Route Handler:

- **Validates** input with a Zod schema before touching anything else.
- **Authorizes** via `requirePermission(module, action)` (or `requireStaff()` for non-module routes) — checked immediately, returned early on failure. This is layer 3 of the three-layer authorization model in `coding-standards.md` → Security; middleware and the admin layout are layers 1 and 2, and neither substitutes for this check.
- **Delegates** to a domain function in `lib/<domain>` for any real business logic (pricing, dedup, customer resolution); simple single-table CRUD may stay inline.
- **Wraps multi-step writes in a Prisma `$transaction`** — the established pattern for lead conversion, lead unlock, and itinerary updates; the payment-verification path is the one confirmed gap (see architecture review).
- **Returns consistent, typed JSON responses** and never leaks an internal error message or stack trace to the client.

────────────────────────────────────

## 9. State Management

- **Server Components first** — most page state is just "what did Prisma return," fetched once per request.
- **React state + `useTransition`** for local, per-component UI state and the mutation lifecycle (pending/success/error), per the Next.js Mutation Standard.
- **Context API only for genuinely cross-cutting client state** — today that's exactly three providers: `ThemeProvider` (admin dark mode), `SiteSettingsProvider` (site name/WhatsApp/phone, fetched once per layout), and the GTM/analytics providers. Introducing a fourth provider should be held to the same bar: shared by many otherwise-unrelated components, not a convenience for one feature.
- Avoid unnecessary global state — a value only one component tree needs stays local to that tree.

────────────────────────────────────

## 10. External Integrations

- **Cloudinary** — media storage (`lib/storage.ts`), production-only; falls back to local filesystem in development.
- **Razorpay** — payments (order creation, checkout, webhook verification).
- **Google** — OAuth + One Tap login, Google Ads offline conversions (Data Manager API), Places/Maps embeds.
- **Meta** — client Pixel (via GTM) + server-side Conversions API.
- **Upstash Redis** — rate limiting, with an in-memory fallback when unconfigured.
- **Cloudflare Turnstile** — bot/CAPTCHA protection on public forms.
- **Jitsi** — video meetings for Vertex Connect (internal tool).

**Adapter pattern:** `lib/offlineConversion/adapters/{google,meta,microsoft}.ts` is the reference implementation — a shared `PlatformAdapter` interface, an `isConfigured()` guard, and a `send()`/upload method per platform. Every future ad-platform or notification integration should follow this same shape: one file per provider, a common interface, graceful no-op when unconfigured (see `coding-standards.md` → Integration Standards). The Microsoft/Bing adapter in this same folder is the example of the interface existing before the credentials do — that's an acceptable intermediate state, not a violation.

────────────────────────────────────

## 11. Error Handling

- **Graceful failures** — a failed non-critical step (e.g. sending a notification email after a successful booking) must never fail the primary operation; it's caught and logged, not allowed to bubble up.
- **User-friendly errors** — API error responses are a short, human-readable message; never a raw Prisma or gateway error string.
- **Structured logging** — the target state. Today, operational events are logged with plain `console.log`/`console.error` calls (upload progress, mail results, offline-conversion uploads) — acceptable until the centralized logger from the engineering backlog exists (see `coding-standards.md` → Logging).
- **Retry where appropriate** — implemented today only for offline-conversion uploads (`OfflineConversion.attempts`, retried by a scheduled job). This is not yet a general pattern; do not assume a failed Cloudinary or Razorpay call retries itself.
- Never expose internal errors — no stack traces, no raw database error messages, in any client-facing response.

────────────────────────────────────

## 12. Performance

- **Lazy loading** — `next/dynamic` with `ssr: false` for heavy, rarely-needed client bundles (Three.js hero mode, PDF renderer, chart library). Target state — not yet applied anywhere in the codebase today (see architecture review).
- **Image optimization** — `next/image` + `sharp`, project-wide on the public site; a handful of campaign marketing components still use a raw `<img>` (tracked gap).
- **Bundle splitting** — `@next/bundle-analyzer`, already wired into `next.config.ts` (`ANALYZE=true yarn build`).
- **Caching** — ISR (`revalidate = 300`) on published public content; `force-dynamic` on admin/account/booking pages that read session or real-time data (see `coding-standards.md` → Next.js Standards).
- **Server rendering** — RSC by default; see Section 4.

Avoid premature optimization — memoization (`React.memo`, `useMemo`) is applied only after profiling shows a real re-render cost, not speculatively.

────────────────────────────────────

## 13. Technical Debt

Architecture defines the destination, not the current state. Legacy implementations may temporarily differ from this document — that gap is tracked, not hidden (see the accompanying architecture review and Plane).

Refactoring should move the codebase incrementally toward this architecture as features are touched. Avoid unnecessary large-scale rewrites purely to satisfy this document — see `coding-standards.md` → Technical Debt for the same principle applied at the code level.

────────────────────────────────────

## 14. Related Documents

- `../context/project-overview.md`
- `../context/business-rules.md`
- `../context/tech-stack.md`
- `coding-standards.md`
- `git-workflow.md`
