# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev              # Start Next.js dev server
yarn build            # prisma generate + next build
yarn lint             # ESLint
yarn typecheck        # tsc --noEmit (no test suite exists)

# Database
yarn db:push          # Push schema without migrations (dev)
yarn db:migrate       # Create and apply a migration
yarn db:seed          # Seed the database (tsx prisma/seed.ts)
yarn db:studio        # Open Prisma Studio
```

Copy `.env.example` to `.env.local` and fill in all values before running locally.

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma (PostgreSQL) · Auth.js v5 · Tailwind CSS · shadcn/ui · Razorpay · Nodemailer

### Route groups

| Group | Path | Purpose |
|---|---|---|
| `(public)` | `/` `/tours` `/destinations` `/blog` `/booking` `/contact` `/about` `/campaign/[slug]` `/[slug]` | Public-facing marketing site |
| `admin` | `/admin/*` | CMS for staff |
| `account` | `/account/*` | Customer portal |
| `login` | `/login` | Auth screen |

The middleware (`src/proxy.ts`, exported as `middleware`) is a thin NextAuth edge guard — it protects `/admin/*` and `/account/*` with no database access (edge-safe).

### Auth & RBAC

Two files split the auth concern so middleware stays edge-safe:
- `src/lib/auth.config.ts` — edge-safe NextAuth config (callbacks, pages, session strategy)
- `src/lib/auth.ts` — server-only NextAuth instance with Credentials provider and Prisma
- `src/lib/rbac.ts` — edge-safe role/module constants; used in middleware and `auth.config.ts`
- `src/lib/permissions.ts` — server-only helpers (`requirePermission`, `requireStaff`, `can`) that query the DB-driven `RolePermission` table

Roles: `SUPERADMIN | ADMIN | SALES | EDITOR | CUSTOMER`. SUPERADMIN bypasses the permission table. All other staff roles have per-module, per-action permissions stored in `RolePermission`.

Registration uses a two-step OTP flow: `POST /api/auth/register/request-otp` → `POST /api/auth/register/verify-otp` → account created. OTPs are bcrypt-hashed in `EmailOtp`; plaintext is never persisted.

### Admin page-content system

Many admin pages edit CMS-style content rather than entity records. Two patterns:

1. **Singleton content** (`HomeContent`, `AboutContent`, `ContactContent`, `BlogContent`) — one row per table, `id: "singleton"`. Managed via `GET/POST /api/pages/content/[key]`. The delegate map is in `src/lib/admin/pageResources.ts`.

2. **List resources** (hero slides, testimonials, team members, etc.) — ordered lists with `sortOrder`/`isActive`. Managed via `GET/POST /api/pages/[resource]` and `PATCH/DELETE /api/pages/[resource]/[id]`. The registry (`RESOURCES`) in `src/lib/admin/pageResources.ts` maps resource keys → Prisma delegates + Zod schemas built from `src/lib/admin/pageFields.ts`.

### JSON columns in Tour / Campaign

`Tour` and `Campaign` store structured data (`itinerary`, `gallery`, `faqs`, `highlights`, `inclusions`, etc.) as JSON strings in `String` columns (not Prisma `Json` type). Always `JSON.parse` on read and `JSON.stringify` on write for these fields.

### Payment flow

1. `POST /api/bookings/create-order` — validates tour, computes price server-side, creates Razorpay order + `Booking` row (`status: PENDING`).
2. Client completes Razorpay checkout.
3. `POST /api/bookings/verify-payment` — verifies HMAC signature, marks booking `PAID`.
4. `POST /api/bookings/webhook` — Razorpay webhook for async confirmation.

Price is always computed server-side from `tour.priceFrom`; the client never sends an amount.

### Itinerary builder

`/admin/itinerary` lets staff build visual travel itineraries stored as JSON in `Itinerary.data`. The editor (`src/components/admin/itinerary/ItineraryEditor.tsx`) supports inline editing and PDF export via `@react-pdf/renderer` (`src/lib/itinerary/export-pdf.tsx`).

### Campaign pages

`/campaign/[slug]` renders full-page marketing microsites. Each `Campaign` row is self-contained: hero images, film embed, itinerary, pricing tiers, departures, testimonials, FAQs, and gallery are all stored as JSON strings on the model. The admin form at `/admin/campaigns/[id]` uses `src/lib/admin/campaignSchema.ts`.

### Hero modes

The homepage hero supports three render modes controlled by `NEXT_PUBLIC_HERO_MODE`:
- `parallax` — CSS parallax (`HeroParallax.tsx`)
- `r3f` — Three.js via `@react-three/fiber` (`HeroR3F.tsx`)
- `spline` — embedded Spline scene (`HeroSpline.tsx`)

### SEO

`src/lib/seo.ts` provides `buildMetadata()` used in page-level `export const metadata`. `src/app/sitemap.ts` and `src/app/robots.ts` generate dynamic sitemap/robots. `src/components/seo/JsonLd.tsx` injects structured data.

### Image uploads

`POST /api/uploads` (staff-only) accepts `multipart/form-data`, writes to `public/uploads/`, and returns the public URL. `next.config.ts` allows remote images from `picsum.photos`; add other domains there when needed.

### SiteSettings context

`SiteSettingsProvider` (`src/components/providers/SiteSettingsProvider.tsx`) passes `siteName`, `whatsapp`, and `sitePhone` from the DB singleton to client components. Access via `useSiteSettings()` hook rather than reading the DB in client components.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
