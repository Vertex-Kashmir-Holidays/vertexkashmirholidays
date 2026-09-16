# 29 — External APIs

> **What this section explains:** the request/response contracts of every outbound call VK makes to a third-party API — complementing §11 (which covers the business "why"), this section is the technical "what exactly gets sent and received."
>
> **Confidence:** Confirmed from the integration research underlying §09/§11/§13/§28. VK exposes no public API of its own for external consumers — every "API" in this section is either something VK calls, or an inbound webhook a third party calls into VK.

---

## Outbound: Razorpay

| Call | Direction | Payload sent | Payload received |
|---|---|---|---|
| Create order | VK → Razorpay | Server-computed amount, currency, receipt reference | `order_id` |
| Checkout (client-side) | Browser → Razorpay | `order_id`, `key_id` (public) | `razorpay_payment_id`, `razorpay_signature` |
| Webhook | Razorpay → VK | Event payload (`payment.captured`, `order.paid`, `payment.failed`), signed | — (VK verifies and acks) |

Full flow in §26 Flow 2. Auth: `RAZORPAY_KEY_ID`/`SECRET` server-side; webhook verified via `RAZORPAY_WEBHOOK_SECRET` HMAC (§21).

## Outbound: Cloudinary

| Call | Direction | Payload sent | Payload received |
|---|---|---|---|
| Server upload | VK server → Cloudinary | File binary, target folder | Delivery URL, public ID |
| Signed direct upload | Browser → Cloudinary (bypassing VK server) | File binary, VK-signed upload params | Delivery URL, public ID |
| Asset deletion | VK → Cloudinary | Public ID | Confirmation |

Used both for catalog/content media and Vertex Connect chat attachments (§15, §28).

## Outbound: Google Ads (Data Manager API)

| Call | Endpoint | Payload | Auth |
|---|---|---|---|
| Ingest conversion event | `datamanager.googleapis.com/v1/events:ingest` | Conversion action ID, conversion value, click ID (`gclid`) or hashed identifier | OAuth refresh token (`GOOGLE_ADS_REFRESH_TOKEN`) + `GOOGLE_ADS_LOGIN_CUSTOMER_ID`/`GOOGLE_ADS_CUSTOMER_ID` |

**Note on API version**: this is the current, non-deprecated path — Google cut off new access to the legacy `ConversionUploadService` for any developer token created after 2026-06-15, which is why this codebase uses Data Manager rather than the older API. `GOOGLE_ADS_DEVELOPER_TOKEN` is declared in `.env.example` but **no longer read** by the current adapter — a leftover from before this migration, kept in case a future direct-Ads-API path needs it.

## Outbound: Meta Conversions API

| Call | Endpoint | Payload | Auth |
|---|---|---|---|
| Upload conversion | Graph API `v19.0`, Conversions endpoint | Event name, value, currency, **SHA-256-hashed** PII (email) | `META_CAPI_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` |

Plain REST call, no SDK dependency. `META_CAPI_TEST_EVENT_CODE` routes events to Meta's Test Events tab instead of live reporting — must be unset in production.

## Outbound: Microsoft/Bing Ads

Adapter interface and `isConfigured()` check exist; **the actual upload call is an intentional stub** — not production-ready regardless of credentials being set (§11, §13).

## Outbound: Google OAuth / One Tap

| Call | Direction | Detail |
|---|---|---|
| OAuth redirect | Browser → Google → VK callback | Standard OAuth 2.0 authorization-code flow |
| One Tap | Browser → VK (ID token only) | VK server verifies the signed ID token against **Google's published JWKS** via `jose` before trusting it — no round-trip to Google needed at verification time |

Both funnel through `resolveGoogleCustomer()` — customer-only, domain-restricted (`isAllowedGoogleDomain`), never provisions staff (§10).

## Outbound: Google Places API

`GOOGLE_PLACES_API_KEY` (server-only) — fetches live Google Reviews for display on `/reviews`. Read-only, no data sent beyond the place/business identifier.

## Outbound: Google Maps Embed

`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (client-exposed, HTTP-referrer-restricted) — a plain embedded iframe map on `/contact`, not a programmatic API call in the request/response sense.

## Outbound: 8x8 JaaS / Jitsi

VK **signs** a JWT (RS256, `jose`) and hands it to the client, which then connects directly to JaaS's Jitsi infrastructure — VK's server never makes an outbound HTTP call to JaaS itself; the integration is entirely in token issuance. Full detail in §11, §28.

## Outbound: SMTP

Not a REST API — `nodemailer` speaks SMTP directly to the configured mail server. Payload: recipient, subject, HTML/text body. No response payload beyond delivery/rejection at the SMTP protocol level, caught and logged, never blocking the primary operation (§07, §23).

## Inbound: Razorpay Webhook (VK exposes this)

The one genuine inbound "API" VK exposes to a third party — `POST /api/bookings/webhook` (§09, §21, §28).

## VK exposes no public API for external consumers

There is no documented/versioned public API (no `/api/v1/**`, no API-key-authenticated external integration surface, no OpenAPI/Swagger spec). Every route under `src/app/api/**` is for VK's own frontend (public, admin, account) or a specific named third-party webhook — not a general-purpose API product. API versioning is explicitly named in `.ai/context/business-rules.md` §11 as scoped for "assess and document a decision," not built.

## Related Documents

- §11 Third-Party Integrations — the business "why" behind each service above
- §09 API Architecture — VK's own inbound route inventory
- §13 Analytics & Tracking, §26 Core Business Flows — these calls in full business-process context
- §19 Environments & Configuration — every credential env var referenced above
- §21 Security — webhook signature verification in full detail
