# 19 — Environments & Configuration

> **What this section explains:** every environment VK runs in, and every environment variable — its purpose, whether it's required, and what happens if it's missing. No secret values are shown anywhere in this document, only variable names and purpose.
>
> **Confidence:** Confirmed from `.env.example` (the checked-in template) cross-referenced with `src/lib/env.ts` (the Zod-validated subset) and code comments throughout the integration modules.

---

## Environments

| Environment | Where it runs | Database | Purpose |
|---|---|---|---|
| **Local** | Developer machine (`yarn dev`) | Local Postgres or a personal Neon dev branch | Day-to-day development. Every optional integration degrades to a no-op when its env vars are absent — local dev needs only `DATABASE_URL` and `AUTH_SECRET` to boot. |
| **CI (GitHub Actions)** | GitHub-hosted runner | Ephemeral `postgres:16` service container, created/destroyed per run | Typecheck/lint/build gate on every PR and push to `main`/`dev` (§20). |
| **Preview** | Vercel preview deployment (per-PR/per-branch) | **Requires verification** — Vercel preview deployments typically reuse the project's configured env vars; whether preview points at the dev Neon DB or a separate preview DB is not confirmed from the repo alone | Manual QA on a PR before merge. |
| **Production** | Vercel production deployment, `vertexkashmirholidays.com` | Neon **production** database | Live site. Builds from `main` only. |

There is no formally named "Staging" environment distinct from Preview — Preview deployments serve that role informally.

## Hard requirement

The app will not boot without `DATABASE_URL` and `AUTH_SECRET`. Every other variable below degrades gracefully when unset — the integration it powers disables itself (ADR 0005). This is a deliberate architectural rule, not an oversight.

## Core

| Variable | Purpose | Required? | Secret? |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon or local) | **Yes** | Yes |
| `AUTH_SECRET` | NextAuth v5 JWT signing key (`npx auth secret`); also derives the AES-256-GCM key for MFA secret encryption (`SHA256(AUTH_SECRET)`) | **Yes** | Yes |
| `AUTH_URL` | Auth.js base URL | Recommended | No |
| `NEXTAUTH_URL` | Legacy-named fallback base URL for transactional email/notification links, deliberately distinct from `AUTH_URL` so email links can point at a different host | Optional | No |
| `NEXT_PUBLIC_SITE_URL` | Public base URL used across the app (canonical links, metadata, email links) | Recommended | No |
| `REVALIDATE_SECRET` | Shared secret to authorize on-demand ISR revalidation calls | Optional | Yes |
| `NEXT_PUBLIC_PLACEHOLDER_IMAGE` | Full URL of the branded placeholder image; its host is also added to `next.config.ts` image `remotePatterns` — change both together | Optional | No |
| `NEXT_PUBLIC_HERO_MODE` | Homepage hero render mode: `parallax` \| `r3f` \| `spline` | Optional (default `parallax`) | No |
| `NEXT_PUBLIC_SPLINE_URL` | Spline 3D scene URL, only used when `HERO_MODE=spline` | Optional | No |

## Payments — Razorpay

| Variable | Purpose | Required? | Secret? |
|---|---|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | Server-side order creation + signature verification | For online payments | `SECRET` yes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key ID, exposed to the checkout widget | For online payments | No (public by design) |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC-SHA256 verification of the webhook | For the webhook safety net | Yes |

## Media — Cloudinary

| Variable | Purpose | Required? | Secret? |
|---|---|---|---|
| `CLOUDINARY_URL` (or discrete `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`) | Upload target | **Required on any deployed environment** — Vercel's filesystem is read-only; unset means local-filesystem fallback (dev-only) | Yes |
| `CLOUDINARY_FOLDER` | Root folder namespace, to separate environments | Optional (default `vertexkashmir`) | No |

## Cron & Internal

| Variable | Purpose | Required? | Secret? |
|---|---|---|---|
| `CRON_SECRET` | Bearer token Vercel Cron (and manual sweep triggers) send | Required for cron routes to accept calls | Yes |
| `JAAS_APP_ID`, `JAAS_KEY_ID`, `JAAS_PRIVATE_KEY` | 8x8 JaaS (Jitsi as a Service) — signs Vertex Connect meeting join JWTs, removes the 5-minute unauthenticated call cap | For Vertex Connect video beyond 5 minutes | Yes (private key) |

## Email / SMTP

| Variable | Purpose | Required? |
|---|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Generic SMTP transport (nodemailer) — example shows Gmail SMTP | For transactional email |
| `MAIL_FROM` | From address | Required (with SMTP) |
| `MAIL_REPLY_TO` | Optional Reply-To | Optional |
| `MAIL_TO_ADMIN`, `LEADS_EMAIL`, `BOOKING_EMAIL` | Internal notification recipients (leads falls back to `MAIL_TO_ADMIN` → `MAIL_FROM`) | Optional |

## Anti-bot

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile CAPTCHA | Optional — server verification is **skipped** when the secret is unset; must be set in production to actually enforce it |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Durable distributed rate limiting | Optional — falls back to an in-memory, per-instance limiter when unset |

## Analytics & Ad Platforms

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container — the only analytics script this codebase injects | Optional (disables analytics if blank) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Informational — GA4 is configured *inside* GTM, not read directly by app code | Optional |
| `NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION` | Meta Business Suite domain verification meta tag | Optional |
| `META_CAPI_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | Meta Conversions API (server-side) | For Meta offline conversions |
| `META_CAPI_TEST_EVENT_CODE` | Tags events to Meta's Test Events tab | Dev/test only — **must be unset in production** |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Declared but **no longer read** since the migration to the Data Manager API | Not currently used |
| `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_CONVERSION_ACTION_ID` | Google Ads offline conversion upload (Data Manager API) | For Google Ads offline conversions |
| `MICROSOFT_ADS_*` (6 vars) | Microsoft/Bing Ads offline conversions | **Not production-ready** — adapter's upload call is an intentional stub regardless |

## Google Identity & Maps

| Variable | Purpose | Required? |
|---|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth (customer-only login) + Google Ads token exchange (shared client) | For Google sign-in |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Public client ID (Google One Tap widget) | For One Tap |
| `GOOGLE_PLACES_API_KEY` | Server-only — live Google Reviews on `/reviews` | Optional |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Client-exposed, HTTP-referrer-restricted — real embedded map on `/contact`; falls back to a decorative illustration when unset | Optional |

## Where developers get real values

`.env.example`'s inline comments document exactly where to obtain each credential (Razorpay Dashboard, Cloudinary console, Cloudflare Turnstile dashboard, Upstash console, JaaS dashboard, Google Cloud Console, Meta Business Suite, Meta Events Manager). New developers copy `.env.example` → `.env.local` and fill in only the sections relevant to the feature they're touching (§37 Developer Onboarding). ~59 top-level `KEY=` entries exist in `.env.example` as of this documentation pass.

## What breaks when a variable is missing

By design, **nothing crashes**. Every optional integration follows the adapter pattern's `isConfigured()` graceful-degradation rule (ADR 0005) — the feature it powers is simply disabled: no Turnstile challenge shown, uploads write to local disk, offline conversions never fire, Vertex Connect calls are capped at 5 minutes.

## Related Documents

- `.env.example` — the checked-in template with full inline sourcing comments
- ADR 0005 — the adapter-pattern rule behind graceful degradation
- §11 Third-Party Integrations — what each credential set actually powers
- §37 Developer Onboarding — the practical "which vars do I need for what I'm building" guide
