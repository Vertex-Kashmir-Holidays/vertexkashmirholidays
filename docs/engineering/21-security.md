# 21 — Security

> **What this section explains:** every security control actually implemented in VK — authentication, authorization, secrets, headers, CSP, rate limiting, bot protection — and, explicitly, what is not implemented or only partially implemented.
>
> **Confidence:** Confirmed from `.ai/context/tech-stack.md` → Security, `.ai/instructions/coding-standards.md` → Security, and direct research of `next.config.ts`, `src/proxy.ts`. Each control below is tagged: **Implemented** / **Partially implemented** / **Not implemented**.

---

## Quick Reference — status of every control

| Control | Status |
|---|---|
| Authentication (NextAuth v5, 3 paths) | **Implemented** — §10 |
| Authorization (3-layer RBAC) | **Implemented** — §10 |
| MFA (TOTP, staff) | **Implemented** — SUPERADMIN/ADMIN only |
| Rate limiting | **Implemented** — Upstash-backed, in-memory fallback |
| Bot protection (Turnstile) | **Implemented** — degrades to "pass" if unconfigured |
| CSP (nonce-based) | **Implemented** — authenticated routes only; static CSP elsewhere |
| Security headers (HSTS, X-Frame-Options, etc.) | **Implemented** |
| Webhook signature verification | **Implemented** — Razorpay HMAC-SHA256 |
| Admin audit logging | **Implemented** (post-dates the last `.ai/` update — see note below) |
| CSRF | **Not a dedicated token mechanism** — see note below |
| Secrets management (dedicated vault) | **Not implemented** — plain env vars only |
| Upload magic-byte validation | **Partially implemented** — images only, not video/documents |

## Authentication & Authorization

Full detail in §10. Headline: NextAuth v5, three sign-in paths (Credentials, Google OAuth, Google One Tap), all resolving to one session shape; three independent authorization layers (edge middleware → admin layout → `requirePermission` in the Route Handler) with the Route Handler check as the only real enforcement.

## MFA

TOTP-based (`otpauth` + `qrcode`), required only for `SUPERADMIN`/`ADMIN` (`MFA_REQUIRED_ROLES` in `src/lib/rbac.ts`). Flow: enroll (generates secret + QR) → verify (confirms possession) → confirm (enables). Recovery codes (`MfaRecoveryCode`) are bcrypt-hashed one-time-use. The TOTP secret itself is stored only through `mfaCrypto` — AES-256-GCM encrypted at rest, the key derived as `SHA256(AUTH_SECRET)` — never as a raw column value.

## Secrets & Environment Variables

**No dedicated secrets manager** (Vault, Doppler, AWS Secrets Manager) — confirmed absent. Secrets are plain environment variables, managed through the Vercel dashboard in deployed environments and `.env`/`.env.local` locally. Full variable inventory in §19.

The one hard runtime requirement: the app will not boot without `DATABASE_URL` and `AUTH_SECRET`. Every other integration credential is optional and the integration it powers no-ops gracefully when absent (ADR 0005) — a missing env var disables a feature, it never crashes a request.

## Rate Limiting

`src/lib/ratelimit.ts` — Upstash Redis + `@upstash/ratelimit`, with an **in-memory, per-serverless-instance fallback** (resets on redeploy) when Upstash env vars are unset. Applied to: booking creation/verification, every OTP route (register/reset/careers/booking/B2B), login, lead submission, newsletter signup, careers application, admin MFA verify/confirm, `GET /api/spotlight`, and the password-change branch of profile update.

A rejected request is always returned via the shared `tooManyRequests()` helper — a `429` with a `Retry-After` header — the one error-response shape that is fully standardized across the API (§09). Treat any rate-limit result as **advisory defense-in-depth**, never the sole guard on an endpoint — the in-memory fallback is not durable across instances or deploys.

## Bot / CAPTCHA Protection

Cloudflare Turnstile (`@marsidev/react-turnstile`, `src/lib/security/turnstile.ts`) on: register OTP request, forgot-password OTP request, contact form, lead form, campaign-hero lead capture, and the login brute-force path. Server-side verification **degrades gracefully to "pass" when `TURNSTILE_SECRET_KEY` is unset** — always confirm the secret is actually set in a new environment before relying on it; local dev intentionally needs no Turnstile setup.

## Content Security Policy

Generated per-request in edge middleware (`src/proxy.ts`), in two variants:

- **Nonce-based** (`/admin`, `/account`, `/login`, `/api`): a fresh 128-bit nonce per request (`crypto.getRandomValues` + `btoa` — `Buffer` isn't available on the Edge runtime), `script-src 'nonce-{nonce}' 'strict-dynamic' 'unsafe-inline' 'wasm-unsafe-eval' ...SCRIPT_HOSTS` (dev additionally allows `'unsafe-eval'`). The nonce is forwarded downstream via an `x-nonce` request header so layouts can pass it to `ThemeProvider`/GTM scripts.
- **Static** (every other route): precomputed once at module load, no nonce/`strict-dynamic`, relies on `'unsafe-inline'` + an explicit `SCRIPT_HOSTS` allowlist — kept static specifically so public pages remain ISR-cacheable (a per-request nonce would force them dynamic).

Both variants share a base directive set (`sharedCspDirectives()`) covering Cloudinary, Razorpay, Cloudflare Turnstile, GTM/GA, Facebook, Google One Tap/Maps, Jitsi/JaaS video, and the TripAdvisor widget across `img-src`/`font-src`/`style-src`/`frame-src`/`connect-src`/`media-src`/`worker-src`.

Any new inline `<script>` on an authenticated route must carry the nonce from `x-nonce` or it will be blocked; a new script host must be added to the shared `SCRIPT_HOSTS` allowlist, never worked around with a blanket relaxation.

## Security Headers

Set globally in `next.config.ts` → `headers()`:

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| X-Frame-Options | `SAMEORIGIN` |
| Permissions-Policy | camera/microphone/display-capture/fullscreen scoped to Jitsi domains (`meet.jit.si`, `8x8.vc`, `*.8x8.vc`) only; `geolocation=()`, `browsing-topics=()` blocked entirely |
| X-Powered-By | Disabled (`poweredByHeader: false`) |

Additionally, `/admin/:path*`, `/api/:path*`, `/account/:path*`, `/login/:path*` get `X-Robots-Tag: noindex, nofollow, nocache` — defense-in-depth alongside `robots.ts` and the admin layout's own metadata (§30).

Any new iframe-embedded third party needs an explicit, scoped `Permissions-Policy` addition — never a blanket relaxation beyond the documented Jitsi allowlist.

## Webhook Verification

`POST /api/bookings/webhook` (Razorpay) reads the raw request body before JSON parsing, computes `HMAC-SHA256(RAZORPAY_WEBHOOK_SECRET, rawBody)`, and compares it against the `x-razorpay-signature` header using `crypto.timingSafeEqual` (length-checked first, to avoid a timing side-channel) — a mismatch returns `400` before any event is processed. Full detail in §09, §28.

## Input Validation, Sanitization, Injection

- **Validation**: Zod at every API boundary (§09) — never trust client input, especially a client-sent monetary amount (ADR 0004).
- **SQL injection**: structurally near-impossible via the ORM path — **zero raw SQL usage** (`$queryRaw`/`$executeRaw`) confirmed anywhere in the codebase; every query goes through Prisma's parameterized query builder.
- **XSS**: `sanitize-html` runs on every piece of staff-authored or third-party-embed HTML before it's rendered via `dangerouslySetInnerHTML` (blog body, destination/activity content, TripAdvisor widget markup).
- **CSRF**: **no dedicated CSRF token mechanism found** — mutation routes rely on the combination of session-cookie same-site behavior, the CSP/nonce setup, and (on public-form routes) a same-origin check plus Turnstile, rather than a classic CSRF token pattern. This is a gap worth naming explicitly (marked **not implemented** as a distinct control) rather than assuming Next.js/NextAuth provides blanket CSRF protection for every custom Route Handler — **requires verification** against NextAuth v5's own CSRF handling for its own auth endpoints specifically, as opposed to the app's other mutation routes.

## Upload Security

Images are **magic-byte validated server-side** before being accepted (`src/lib/storage.ts` → `saveUpload()`). **Confirmed gap**: video/document upload types do not yet have the same magic-byte validation — tracked as a known engineering-backlog item, not silently assumed safe.

## Audit Logging

`.ai/context/business-rules.md` (last updated 2026-08-02) states admin audit logging is **not implemented** and is the highest-priority tracked security gap. As of this documentation pass, an `AuditLog` model, an `auditLog` RBAC module, and a `/admin/audit-log` admin page all exist in the current schema/codebase (§08, §27), covering role changes, permission edits, user soft/hard-delete/restore, salary lifecycle events, leave lifecycle events, and B2B agent status changes (14-value `AuditAction` enum). **This appears to close the gap `.ai/` flags as open** — but the exact coverage (which admin actions actually write an `AuditLog` row today vs. which are still silent) has not been independently verified line-by-line in this documentation pass. Treat "audit logging exists" as confirmed from the schema and admin page; treat "every sensitive action is audited" as **requires verification**. See §35.

## PII Handling

- Server-side ad-platform conversions (Meta CAPI) hash PII (email, etc.) with SHA-256 before transmission.
- Client-side analytics events (`dataLayer` pushes) deliberately **never** carry PII — a distinct, enforced rule from the server-side hashing above (`.ai/skills/analytics-event.md`).
- No dedicated data-retention/erasure workflow beyond Vertex Connect's 90-day chat-message purge (§28) is confirmed to exist for customer PII broadly — **requires verification** if this becomes a compliance question.

## What is explicitly NOT implemented

- A dedicated secrets manager
- A classic CSRF-token mechanism for general mutation routes
- Video/document upload magic-byte validation
- A general application-wide input-validation gateway beyond per-route Zod (there is no WAF confirmed in front of the app beyond whatever Cloudflare/Vercel provide at the platform level — **requires verification**, since this is infrastructure-level, not code-level)

## Related Documents

- §10 Authentication & Authorization — full mechanics
- §09 API Architecture — where rate limiting and validation apply per-route
- §19 Environments & Configuration — the full secret inventory (names, never values)
- §28 Background Jobs — the Vertex Connect retention purge and cron secret mechanism
- §35 Technical Debt — the audit-log coverage question and CSRF gap, prioritized
