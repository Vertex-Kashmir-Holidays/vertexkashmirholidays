# 11 — Third-Party Services & Integrations

> **What this section explains:** every external service VK actually integrates with — what it's for, how it's reached, what data crosses the boundary, authentication, and failure behavior. Only services with confirmed real usage are listed.
>
> **Confidence:** Confirmed from `.ai/context/tech-stack.md`, `.ai/instructions/architecture.md` §10, `.ai/adr/0005-integration-adapter-pattern.md`, and direct code research (§09, §19, §28 research passes).

---

## Master Integration Inventory

| Service | Purpose | Integration method | Auth | Failure impact | Criticality |
|---|---|---|---|---|---|
| **Neon (PostgreSQL)** | Primary data store | Prisma client, direct connection string | `DATABASE_URL` | App does not boot | Critical |
| **Vercel** | Hosting, serverless compute, Edge Middleware, Cron | Git-integrated deploy | Platform-level | Site down | Critical |
| **Razorpay** | Payment gateway | REST API (order creation) + client checkout.js + HMAC-verified webhook | `RAZORPAY_KEY_ID`/`SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Online payments fail; offline payment recording still works | Critical (revenue) |
| **Cloudinary** | Media storage/CDN | SDK (server upload) + signed direct browser upload | `CLOUDINARY_URL` | Falls back to local filesystem (dev) — **breaks in any deployed environment** (Vercel FS is read-only) | Critical in production |
| **NextAuth (self-hosted, not a hosted service)** | Auth session issuance | N/A | `AUTH_SECRET` | App does not boot | Critical |
| **Google OAuth / One Tap** | Customer sign-in | OAuth redirect / signed ID token via `jose` | `GOOGLE_CLIENT_ID`/`SECRET` | Google sign-in disabled; Credentials login unaffected | Medium |
| **Google Tag Manager** | Tag management (GA4, Meta Pixel live inside it) | Client script injection | `NEXT_PUBLIC_GTM_ID` | No analytics/tracking; site otherwise unaffected | Medium |
| **Google Ads (Data Manager API)** | Server-side offline conversion upload | REST API | `GOOGLE_ADS_REFRESH_TOKEN` + related | Conversions not reported to Google Ads; booking/lead flow unaffected | Medium (marketing ROI visibility) |
| **Meta Conversions API** | Server-side offline conversion upload | REST API (Graph API v19.0), SHA-256-hashed PII | `META_CAPI_PIXEL_ID`/`ACCESS_TOKEN` | Same as above, for Meta | Medium |
| **Microsoft/Bing Ads** | Offline conversion upload | Adapter scaffold — **not production-ready**, upload call is a stub | `MICROSOFT_ADS_*` | N/A — inert regardless | None currently |
| **Cloudflare Turnstile** | Bot/CAPTCHA protection | Client widget + server verify call | `TURNSTILE_SECRET_KEY` | Verification **skipped** (passes everyone) when unconfigured | Medium (abuse surface) |
| **Upstash Redis** | Distributed rate limiting | REST API (`@upstash/ratelimit`) | `UPSTASH_REDIS_REST_URL`/`TOKEN` | Falls back to in-memory, per-instance limiter | Low-medium (defense-in-depth only) |
| **Google Places API** | Live Google Reviews on `/reviews` | Server-side REST call | `GOOGLE_PLACES_API_KEY` | Reviews page shows without live Google data | Low |
| **Google Maps Embed** | Embedded map on `/contact` | Client-side embed | `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Falls back to a decorative illustration | Low |
| **8x8 JaaS (Jitsi)** | Video meetings for Vertex Connect | Signed RS256 JWT join tokens (`jose`) | `JAAS_APP_ID`/`KEY_ID`/`PRIVATE_KEY` | Meetings capped at 5 minutes (unauthenticated Jitsi default) | Low (internal tool only) |
| **SMTP (generic, e.g. Gmail)** | Transactional email | `nodemailer` | `SMTP_HOST`/`USER`/`PASS` | `sendMail()` throws — caught and logged for non-critical sends (booking confirmation emails, etc.), never fails the primary operation | Medium |
| **TripAdvisor** (widget) | Third-party review widget embed | Sanitized HTML embed | None (public widget) | Widget doesn't render | Low |
| **GitHub + GitHub Actions** | Source control, CI | Git-integrated | Platform-level | No CI gate on PRs; deploy still possible via Vercel directly | Medium (quality gate, not uptime) |
| **Bluehost** | DNS | DNS records only | N/A | Domain resolution failure (catastrophic, rare) | Critical if it fails |

## The adapter pattern — why this list is safe to add to

Per ADR 0005, every multi-provider integration (the offline-conversion uploaders in particular) shares one shape: a common interface, an `isConfigured()` guard, and a `send()`/upload method per provider (`src/lib/offlineConversion/adapters/{google,meta,microsoft}.ts` is the reference implementation). Callers speak to the interface, never a vendor SDK directly — adding or swapping a provider touches one file. Every adapter no-ops gracefully when its credentials are absent: **no third-party integration in this list can crash a request by being unconfigured** — it simply disables the feature it powers.

## Deep-dive: Razorpay (payments)

- **Why it exists:** the only payment gateway VK has integrated; online booking payments (advance/full) and the async confirmation safety net.
- **Where integrated:** `src/app/api/bookings/create-order`, `verify-payment`, `webhook` (§09, §26).
- **Data sent:** order amount (server-computed, never client-supplied — ADR 0004), currency, booking reference.
- **Data received:** order ID, payment ID, signature (verified), webhook event payloads (`payment.captured`, `order.paid`, `payment.failed`).
- **Auth:** `RAZORPAY_KEY_ID`/`RAZORPAY_SECRET` server-side; `NEXT_PUBLIC_RAZORPAY_KEY_ID` exposed to the checkout widget by design.
- **Failure behavior:** a failed `create-order` call blocks online checkout but not offline/manual payment recording by staff. The webhook is a safety net for the case where `verify-payment`'s client-side callback never fires (browser closed mid-flow) — see §26 for the full reconciliation logic.
- **Retry:** none automatic on the VK side for a failed order-creation call — the user retries by resubmitting checkout.

## Deep-dive: Cloudinary (media)

- **Why it exists:** Vercel's filesystem is read-only in production — uploads cannot be written to disk there.
- **Where integrated:** `src/lib/storage.ts` (`saveUpload()`), `src/app/api/uploads/sign` (direct browser upload for files exceeding the ~4.5MB serverless body limit).
- **Data sent:** image/media binary, target folder (namespaced via `CLOUDINARY_FOLDER` to separate dev/prod).
- **Data received:** a public delivery URL, stored on the owning record.
- **Auth:** `CLOUDINARY_URL` or discrete cloud-name/key/secret vars.
- **Failure behavior:** unset in a deployed environment means uploads silently fail to persist correctly (the code falls back to local-filesystem writes that don't survive across serverless invocations) — this is the one integration where "unconfigured" is a real production outage risk, not a benign feature-off state, and is flagged as such.
- **Vendor lock-in:** every caller speaks only in terms of `folder` + returned `url` — never calls the Cloudinary SDK directly — so a future migration to another media host would touch one file (`storage.ts`), not every call site.

## Deep-dive: Google Ads & Meta offline conversions

- **Why they exist:** browser-side ad-blockers and Safari ITP make client-side pixel firing unreliable for measuring real conversions; these are server-side uploads independent of whether the client pixel fired at all.
- **Mechanism:** a `Lead`/`Booking` is enqueued as an `OfflineConversion` row (`status: PENDING`) at the moment of business significance (lead conversion, successful online payment) via `enqueueForLead()`/`enqueueForBooking()`, then processed **immediately at enqueue time** in production (not by the unscheduled cron sweep — see §28).
- **Google**: posts to the Data Manager API (`datamanager.googleapis.com/v1/events:ingest`) — the current non-deprecated path, since Google cut off new access to the legacy `ConversionUploadService` for any developer token created after 2026-06-15.
- **Meta**: posts directly to the Graph API (v19.0) as a plain REST call — no SDK dependency — hashing PII (email) with SHA-256 before sending.
- **Duplicate prevention:** a lead-converted booking's later online payment doesn't re-fire a conversion already recorded against its originating lead (checked via `Lead.bookingId` cross-reference — the `OfflineConversion` model's `leadId`/`bookingId` unique constraints are independent of each other, so this check is a deliberate application-level guard, not something the database alone catches).
- **Retry:** `OfflineConversion.attempts`/`lastError` — the **one confirmed retry mechanism in the entire codebase**. Not a general pattern to assume exists elsewhere.

## Deep-dive: 8x8 JaaS / Jitsi (Vertex Connect)

- **Why it exists:** internal staff video meetings (chat/calls), without building or licensing a full video platform.
- **Mechanism:** `src/app/api/connect/meetings/[meetingId]/token/route.ts` signs an **RS256 JWT** (`jose`) with `context.user`/`context.features` claims, `moderator: true` only for `SUPERADMIN`/`ADMIN`/`SALES`, `kid: "${appId}/${keyId}"` header, 1-hour validity. The client joins the JaaS-hosted Jitsi room with this token.
- **Without JaaS credentials configured:** Jitsi's public unauthenticated default applies — a 5-minute call cap. This is the specific, concrete reason JaaS credentials exist at all rather than using bare public Jitsi.

## Not integrated — confirmed absent

Per direct research (§04, §16, §22): no APM/error-tracking SDK (Sentry, LogRocket, Datadog, New Relic), no GraphQL layer, no message queue, no dedicated search backend (Algolia/Elasticsearch/MeiliSearch), no WhatsApp Business API (only `wa.me` click-to-chat links — §14), no flights/hotels-booking third-party API, no CRM platform beyond the in-house admin CRM itself.

## Related Documents

- `.ai/adr/0005-integration-adapter-pattern.md`
- §09 API Architecture — every route that calls out to one of these services
- §19 Environments & Configuration — every credential's env var name
- §13 Analytics & Tracking, §14 CRM & Lead Management, §15 Media/Storage, §26 Core Business Flows, §28 Background Jobs — per-integration deep dives in business context
- §29 External APIs — the request/response contracts of the outbound calls listed above
