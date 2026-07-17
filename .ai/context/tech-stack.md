# Tech Stack

Version: 2.0.0

Last Updated: 2026-07-16

# Scope

This document describes technologies that are currently implemented in the repository.

Planned technologies belong in the Future Roadmap section only.

Deprecated technologies should be removed once no longer used.

This document must always reflect the current repository.

---

# Purpose

This document is an engineering reference for the technology actually present in this repository — not a generic package inventory. For every technology it states what it's for, exactly where it's used in Vertex Kashmir Holidays, and the rule an engineer must follow when touching that part of the codebase.

Every implementation should use these technologies and existing project patterns before introducing new libraries. Avoid adding dependencies unless there is a clear engineering benefit.

---

# Frontend

| Technology | Purpose | Usage in Vertex | Engineering Rules |
|---|---|---|---|
| Next.js 16 (App Router) | Framework — routing, RSC, ISR | Route groups: `(public)`, `admin`, `account`, `login` | Page/layout files are thin orchestrators — fetch data and pass props only; interactivity and mutations live in `*Client.tsx`. `params` is a `Promise` — always `await` it, including in `generateMetadata`. |
| React 19 | UI rendering | Server Components by default; Client Components only where hooks/events/browser APIs are required | Don't mark a component `"use client"` unless it genuinely needs interactivity. |
| TypeScript | Static typing | Project-wide; `strict: true` in `tsconfig.json` | No `any` (ESLint warns on it) — prefer real types over casts. |
| Tailwind CSS | Styling | All UI styling; scale documented in `docs/DESIGN_SYSTEM.md` | Use an existing design token (spacing/color/type scale) instead of an arbitrary `text-[Npx]`-style value. |
| shadcn/ui + Radix UI + class-variance-authority + tailwind-merge + clsx | Accessible unstyled primitives (Radix) + variant styling (CVA) + class merging (`cn()`) | Only 3 real primitives exist today — `Accordion`, `Sheet`, `Button` (`src/components/ui/`). Most admin UI still hand-rolls markup rather than using these (tracked as a Design System backlog gap). | New shared UI belongs in `src/components/ui/`, built on Radix + the `cn()` helper in `src/lib/utils.ts`. Don't hand-roll a modal/dropdown/tabs/etc. that Radix already solves. |
| next-themes | Dark/light theme switching | Admin panel only (`ThemeProvider.tsx`, `ThemeToggle.tsx`) | Public site has no dark mode — don't assume `useTheme()` works there; it's an explicit Future Enhancement gated on product sign-off. |
| Recharts | Charting | Admin revenue chart only (`src/components/admin/RevenueChart.tsx`) | Keep chart components client-only and code-split — don't let a chart library ship in the initial bundle of a page that doesn't render it. |
| Three.js + @react-three/fiber + @react-three/drei | 3D rendering | One of three homepage hero render modes (`HeroR3F.tsx`), selected via `NEXT_PUBLIC_HERO_MODE=r3f` | Heavy dependency — must stay behind a `next/dynamic` boundary with `ssr: false`, never imported into a component that renders on every route. |
| Sonner | Toast notifications | Every admin mutation (create/edit/delete) surfaces success/failure via `toast()` | Pair `toast.success`/`toast.error` with `useTransition` per the standard admin mutation pattern — don't build a custom notification UI. |

---

# Backend

| Technology | Purpose | Usage in Vertex | Engineering Rules |
|---|---|---|---|
| Next.js Route Handlers | HTTP API layer | ~100 routes under `src/app/api/**` — the only server API mechanism in active use | Keep controllers thin; validate all inputs with Zod; never expose internal error details in a response. |
| Server Actions | Next.js form-mutation primitive | **Not used anywhere in this codebase** — `"use server"` does not appear once. The established convention is Route Handler + `fetch` + `useTransition`. | Don't introduce Server Actions for a feature area that already follows the Route Handler pattern — that creates two competing mutation styles in one app. Adopting them project-wide would be a deliberate, documented decision, not an incidental one. |
| Zod | Runtime validation | Every API route; forms via `@hookform/resolvers`; JSON-string `Tour`/`Campaign` columns are validated as `z.string()`, not `z.array(...)` | Always validate at the boundary; share schemas between client and server (e.g. `src/lib/admin/campaignSchema.ts`) instead of duplicating validation logic. |
| NextAuth v5 | Authentication | See the [Authentication](#authentication) section | — |
| @auth/prisma-adapter | NextAuth ↔ Prisma bridge | Persists `User`/`Session`/`Account` rows for the Credentials and Google providers | Don't hand-roll session storage — this is the single adapter in use. |
| bcryptjs | Password / OTP hashing | Password hashing in `auth.ts`; OTP hashing for `EmailOtp` (plaintext OTP is never persisted); MFA confirm flow; booking credential resend; account password change | Never persist a plaintext secret — always `bcrypt.hash` before storing, `bcrypt.compare` to verify. |
| jose | JWT verify/sign | Verifies Google One Tap ID tokens against Google's published JWKS (`src/lib/auth.ts`); signs Jitsi meeting join tokens for Vertex Connect (`src/app/api/connect/meetings/[meetingId]/token/route.ts`) | Use `jose`, not `jsonwebtoken`, for anything that may need to run on the Edge runtime. |
| libphonenumber-js | Phone validation/formatting | Contact form, lead form, auth phone input, signup validation schema | Validate phone numbers through this library — not a hand-rolled regex. |
| sanitize-html | HTML sanitization | Blog post body, destination/activity content sections, and the TripAdvisor widget markup (`src/lib/sanitize.ts`, `src/lib/reviews/tripadvisorWidget.ts`) | Any HTML sourced from staff input or a third-party embed must pass through `sanitize-html` before being rendered with `dangerouslySetInnerHTML`. |
| sharp | Image processing | Upload pipeline (`src/lib/storage.ts`); itinerary image compression (`src/lib/itinerary/compress-image.ts`) | Registered under `serverExternalPackages` in `next.config.ts` — don't remove that or Vercel builds break. |
| @react-pdf/renderer | PDF generation | Itinerary export (`ItineraryPdf.tsx`, `export-pdf.tsx`) **and** booking invoice PDFs (`invoice-pdf.tsx`, `InvoiceDocuments.tsx`) | Keep PDF document templates in `src/lib/pdf` / feature-specific lib folders, not inline in UI components. |

---

# Authentication

NextAuth v5 (`src/lib/auth.ts` — server-only instance, `src/lib/auth.config.ts` — edge-safe config) runs three coexisting sign-in paths:

1. **Credentials (password)** — staff and customer email/password login. Gated by a per-IP + per-account rate limiter and, when `TURNSTILE_SECRET_KEY` is set, a Turnstile challenge — both are defense-in-depth against brute force. Every failure collapses to the same generic `CredentialsSignin` error so the flow never reveals whether an email exists.
2. **Google OAuth (redirect)** — a customer-only convenience login. The `signIn` callback rejects the sign-in outright for any staff role or a disallowed email domain (`isAllowedGoogleDomain`), and never provisions a staff account.
3. **Google One Tap** — modeled as a second Credentials provider (`id: "google-one-tap"`) so it reuses NextAuth's normal session issuance instead of the OAuth redirect dance. The client widget (`src/components/auth/GoogleOneTap.tsx`) posts a signed Google ID token; `auth.ts` verifies it server-side against Google's JWKS via `jose` before trusting it. Both Google paths funnel through the same shared `resolveGoogleCustomer()` helper, so the customer-only/domain rule is enforced identically either way.

Staff/admin accounts additionally support **TOTP-based MFA** as a second factor — see the Security section below.

**Engineering Rules**
- Google sign-in (either surface) is a customer-only convenience path — never a staff auth path. Don't relax the `isAllowedGoogleDomain` / `isStaff` checks inside `resolveGoogleCustomer`.
- All three providers must resolve to the same session shape (`role`, `mustChangePassword`) — don't special-case one provider's session payload.
- Session/RBAC enforcement on top of whichever provider authenticated the user follows the three-layer model in `../instructions/coding-standards.md` → Security (edge middleware → admin layout → `requirePermission` in API routes) — don't collapse those layers.

---

# Database

| Technology | Purpose | Usage in Vertex |
|---|---|---|
| Prisma | ORM / query builder | Single client instance, imported as `import { prisma } from "@/lib/prisma"` everywhere |
| PostgreSQL (Neon) | Database | Two separate Neon databases — dev and prod |
| Prisma Migrate | Schema migration | 44 committed migrations under `prisma/migrations/` |
| Prisma Seed | Local seed data | `tsx prisma/seed.ts`, run via `yarn db:seed` |

**Engineering Rules**
- Never call `new PrismaClient()` outside `src/lib/prisma.ts`.
- Never use raw SQL (`$queryRaw` / `$executeRaw`) unless there is no way to express the query through the Prisma client API — verified zero usage in the codebase today.
- Use a Prisma `$transaction` for any multi-step write. It's already the established pattern in several places — lead conversion (`src/app/api/leads/[id]/convert/route.ts`: customer resolution + booking + lead update + itinerary lock, one transaction), lead unlock, admin bulk lead actions, itinerary updates, and MFA confirm. The one confirmed gap is the payment path: `verify-payment`, `webhook`, and `reconcile` under `src/app/api/bookings/**` perform unwrapped multi-table writes (booking status + payment ledger) with no `$transaction` — this is the highest-priority engineering-backlog item (booking/payment transaction integrity) and must not be treated as an acceptable pattern to replicate.
- Never access the database directly from a UI component (`src/components/**`) — only Route Handlers and Server Components query Prisma.
- Every schema change gets a real migration via `yarn db:migrate` — never leave a change as `db:push`-only.
- `Tour`/`Campaign` JSON-string columns (`gallery`, `itinerary`, `faqs`, etc.) must be `JSON.parse`'d on read with a fallback and `JSON.stringify`'d on write — see `../instructions/coding-standards.md` → Database Standards → JSON Columns.
- Singleton rows (`SiteSettings`, `HomeContent`, `AboutContent`, `ContactContent`, `BlogContent`) are read with `findUnique({ where: { id: "singleton" } })` and written with `upsert` — never `create` a second row.

---

# Security

| Technology | Purpose | Usage in Vertex | Engineering Rules |
|---|---|---|---|
| Cloudflare Turnstile (`@marsidev/react-turnstile`, `src/lib/security/turnstile.ts`) | Bot / CAPTCHA protection | Register OTP request, forgot-password OTP request, contact form, lead form, campaign-hero lead capture, and the login brute-force path | Verification degrades gracefully to "pass" when `TURNSTILE_SECRET_KEY` is unset (local dev) — always confirm the secret is actually set in a new environment before relying on it; never remove the graceful-degradation check, or local dev breaks. |
| Upstash Redis + @upstash/ratelimit (`src/lib/ratelimit.ts`) | Rate limiting | Booking creation/verification, every OTP request/verify route, login, leads | Falls back to an in-memory limiter (per-serverless-instance, resets on redeploy) when Upstash env vars are unset — treat any rate-limit result as advisory defense-in-depth, never the sole guard on an endpoint. |
| TOTP MFA — otpauth + qrcode (`src/lib/security/mfaTotp.ts`, `mfaCrypto.ts`, `src/app/api/admin/mfa/*`) | Second factor for staff/admin accounts | Enroll (QR code rendered via `qrcode`) → verify → confirm flow, admin-only | MFA secrets are stored only through `mfaCrypto` (encrypted at rest) — never persist a raw TOTP secret in a Prisma column. |
| Nonce-based CSP (`src/proxy.ts`) | Script-injection defense | A fresh per-request nonce is generated in middleware for `/admin`, `/account`, `/login`, `/api` and forwarded via an `x-nonce` request header; public pages get a separate static CSP instead | Any new inline `<script>` on an authenticated route must carry the nonce from `x-nonce` or it will be blocked. Don't add a new script host without updating the shared `SCRIPT_HOSTS` allowlist in `proxy.ts`. |
| Security Headers (`next.config.ts`) | Baseline hardening | HSTS, `X-Content-Type-Options`, `X-Frame-Options`, and a `Permissions-Policy` that scopes camera/microphone/display-capture to the Jitsi domains used by Vertex Connect, applied to every response | Don't loosen `Permissions-Policy` beyond the documented Jitsi allowlist — any new iframe-embedded third party needs an explicit, scoped addition, not a blanket relaxation. |

---

# File Storage

**Cloudinary** (`src/lib/storage.ts`)

- **Purpose:** production media storage — Vercel's filesystem is read-only, so uploads can't be written to disk in production.
- **Usage in Vertex:** `saveUpload()` uploads to Cloudinary whenever `CLOUDINARY_URL` (or the discrete `CLOUDINARY_*` vars) are configured; otherwise it falls back to writing `public/uploads/<folder>/` locally, so local development needs zero setup. Also backs the signed direct-from-browser upload path (`src/app/api/uploads/sign`). The root Cloudinary folder is namespaced via `CLOUDINARY_FOLDER` (e.g. to separate dev/prod media).
- **Engineering Rules:** every caller speaks only in terms of a `folder` + returned `url` — never call the Cloudinary SDK directly from a new route; go through `saveUpload()`. Uploaded images are magic-byte validated server-side; video/document magic-byte validation is a known gap (tracked in the engineering backlog), not yet covering those upload types.

---

# Payments

**Razorpay**

- **Purpose:** payment gateway — order creation, checkout, and webhook-based confirmation.
- **Usage in Vertex:** a 3-step server-verified flow — `create-order` (server computes price) → client completes Razorpay checkout → `verify-payment` (HMAC signature check) → `webhook` (async confirmation).
- **Engineering Rules:** price is always computed server-side from `tour.priceFrom`; the client never sends an amount.
- Additional payment gateways may be integrated later — no other gateway is wired up today.

---

# Analytics

## Client-side

| Technology | Purpose | Usage in Vertex |
|---|---|---|
| Google Tag Manager (GTM) | Single tag-management container | The **only** analytics script injected directly by this codebase (`src/components/providers/GTMScript.tsx`), loaded with the request's CSP nonce and suppressed entirely on internal/admin routes (`isInternalRoute` guard). |
| GA4 | Web analytics | Configured as a tag **inside** the GTM container — not hardcoded anywhere in this repo. |
| Meta Pixel | Ad-platform pixel | Also configured as a tag inside GTM — no `fbq()` call exists in application code. |

**Engineering Rules:** application code never calls `gtag()` or `fbq()` directly. All app-side tracking flows through the `track*()` helpers in `src/lib/analytics.ts`, which push a structured event onto `window.dataLayer` — GTM remains the single source of truth for tag configuration. Adding a new tracked event means adding a `track*()` helper, not a new inline script.

## Server-side

| Technology | Purpose | Usage in Vertex |
|---|---|---|
| Google Ads Offline Conversions | Server-side conversion upload, resilient to ad-blockers/ITP | `src/lib/offlineConversion/adapters/google.ts`, called from `src/lib/offlineConversion/service.ts`. Posts to the **Data Manager API** (`datamanager.googleapis.com/v1/events:ingest`) — the current, non-deprecated path, since Google cut off new access to the legacy `ConversionUploadService` for any developer token created after 2026-06-15. |
| Meta Conversions API (CAPI) | Server-side conversion upload | `src/lib/offlineConversion/adapters/meta.ts`. Posts directly to the Graph API (`v19.0`) as a plain REST call, hashing PII (e.g. email) with SHA-256 before sending — no SDK dependency. |

**Engineering Rules:** both adapters expose `isConfigured()` and no-op safely when their env vars are absent — don't remove that guard. A third adapter, **Microsoft/Bing Ads** (`src/lib/offlineConversion/adapters/microsoft.ts`), exists only as a scaffold: the `isConfigured()` check and interface are real, but the actual upload call is an intentional `TODO` pending an Azure AD app registration and Bing Ads API credentials. Do not treat it as production-ready or route real conversion traffic through it.

---

# Deployment

| Technology | Purpose | Usage in Vertex |
|---|---|---|
| GitHub | Source control, PR review | `main` is production; `dev` is the active working branch |
| Vercel | Hosting, build, deploy | Build runs `prisma generate && next build`; one Vercel Cron job is configured in `vercel.json` (`/api/cron/connect-retention`, daily at 02:00 UTC) for Vertex Connect's retention cleanup |
| Neon | Managed PostgreSQL | Separate dev and prod databases — always verify which database a migration targets before applying it to production |
| Bluehost DNS | Domain DNS | — |
| Cloudflare | CDN + Turnstile | CDN "where applicable"; also the vendor behind the Turnstile bot-protection integration documented under Security |

**Engineering Rules:** the default `*.vercel.app` host permanent-redirects to the real domain (`next.config.ts` → `redirects()`) — don't remove this. Session cookies are host-specific (`trustHost` in `auth.config.ts`), so serving auth traffic from two hosts would fragment sessions.

---

# Developer Tools

| Category | Technology |
|---|---|
| Version Control | Git |
| Project Management | Plane |
| Package Manager | Yarn |
| Code Editor | VS Code |
| AI Assistants | Claude, ChatGPT, Codex, GitHub Copilot, Cursor, Windsurf |

Engineering standards are AI-tool agnostic — every assistant listed above is expected to follow the same rules documented across `.ai/`, starting from `.ai/START.md`.

---

# Code Quality

| Technology | Purpose | Usage in Vertex |
|---|---|---|
| ESLint | Linting | `eslint.config.mjs` extends `next/core-web-vitals` + `next/typescript`. `@typescript-eslint/no-explicit-any`, `react/no-unescaped-entities`, and `@next/next/no-html-link-for-pages` are downgraded to warnings (not build-blocking) to accommodate existing patterns — new code should still avoid `any` where practical. |
| TypeScript | Type checking | `strict: true` in `tsconfig.json`; `yarn typecheck` runs `tsc --noEmit` (no automated test suite exists yet) |
| Bundle Analyzer | Bundle size inspection | `@next/bundle-analyzer`, wired into `next.config.ts`, run via `ANALYZE=true yarn build` — **already implemented**, not merely planned |
| Lighthouse CI | Performance budget enforcement | `@lhci/cli` + `.lighthouserc.js` + the `yarn lhci` script — **already implemented**, not merely planned |
| Production Build Verification | Release gate | `yarn build` (`prisma generate && next build`) is the release gate today; there is no CI pipeline enforcing it automatically yet (see Future Roadmap — GitHub Actions CI) |

---

# Future Roadmap

The following are genuinely **not implemented** in this repository today — confirmed absent (e.g. no `.github/workflows` directory exists, no Storybook config, no test runner config):

- Storybook
- Playwright
- Vitest
- GitHub Actions CI
- Design Token System
- Visual Regression Testing

These technologies should only be introduced after approval.

---

# Related Documents

- project-overview.md
- business-rules.md
- folder-structure.md
- ../instructions/architecture.md
- ../instructions/coding-standards.md
