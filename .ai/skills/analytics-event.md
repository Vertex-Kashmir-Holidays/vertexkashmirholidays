This Skill defines the standard pattern for implementing analytics events in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not a GA4, GTM, Meta Pixel, or Google Ads tutorial.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# Analytics Events

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This Skill defines how analytics and conversion tracking are implemented in Vertex, and — critically — draws a hard line between two separate mechanisms that are easy to conflate:

- **Client-side tracking** (GA4, GTM, Meta Pixel) — a `dataLayer` push from the browser, for on-page behaviour.
- **Server-side tracking** (Meta Conversions API, Google Ads Offline Conversions) — a background upload from the server, independent of whether the client-side pixel fired at all.

A given business event (e.g. a booking) often needs both, fired from two different places in the codebase. Confusing the two, or assuming one implies the other, is the single most common mistake this Skill exists to prevent.

────────────────────────────────────

## When to Use

Use this Skill whenever implementing or modifying:

- A GA4/GTM/Meta Pixel event (client-side).
- A Google Ads Offline Conversion or Meta Conversions API upload (server-side).
- CTA, form, booking, WhatsApp, phone, or email click tracking.
- Anything that touches `src/lib/analytics.ts`, `src/types/analytics.ts`, or `src/lib/offlineConversion/**`.

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- SEO metadata, Schema.org/JSON-LD, Search Console, robots.txt, or the sitemap.
- UI animation or marketing copy changes with no tracking implication.
- UTM/click-ID *capture* — that's a single, fixed capture point (`AttributionCapture.tsx` + `src/lib/attribution*.ts`) at Lead/Booking creation, not something a new event re-implements.

────────────────────────────────────

## Before You Start

Confirm:

- The event doesn't already exist — check `src/types/analytics.ts`'s `AnalyticsEvent` union first; it's the complete list of every client-side event in the codebase today.
- Whether this is a **client-side** event, a **server-side** conversion, or genuinely both.
- The event fires on an actually-completed action, not on render or on a validation failure.

Never create a duplicate of an event that already exists.

────────────────────────────────────

## Prerequisites

Review:

- `src/lib/analytics.ts` — the `push()` choke point and every `track*()` function.
- `src/types/analytics.ts` — the `AnalyticsEvent` discriminated union (the authoritative event list).
- `src/components/providers/SiteAnalytics.tsx` / `GTMScript.tsx` — how GTM actually loads (and that it's never rendered on `/admin`).
- `src/lib/offlineConversion/service.ts` and `adapters/{google,meta,microsoft}.ts` — the server-side path, if relevant.
- `../context/business-rules.md` if the event relates to lead/booking status or attribution.

────────────────────────────────────

## Client-Side Tracking (GA4, GTM, Meta Pixel)

**Mechanism:** every `track*()` function in `src/lib/analytics.ts` calls one private `push()` function, which pushes a typed payload onto `window.dataLayer`. GTM (`GTMScript.tsx`) is the **only** script this codebase injects directly — GA4 and the client-side Meta Pixel are configured as tags *inside* the GTM container itself, not hardcoded anywhere in this repo. `push()` also no-ops (with a dev-mode console log) on any internal route (admin/account/login) via `isInternalRoute` — defense-in-depth, since GTM itself never loads there either.

**The complete, real event list today** (`AnalyticsEvent` in `src/types/analytics.ts` — treat this as authoritative, not illustrative):

| Event | Fires when | Called from (example) |
|---|---|---|
| `lead_submit` | A lead form submits successfully — never on a validation error | `LeadForm.tsx`, `ContactForm.tsx` |
| `whatsapp_click` | Any WhatsApp CTA is clicked (typed `source`, e.g. `header`, `footer_cta`, `tour_sidebar`) | `Footer.tsx`, `Navbar.tsx`, `ContactWhatsAppFloat.tsx` |
| `phone_click` | A `tel:` link is clicked | `Navbar.tsx`, `Footer.tsx` |
| `email_click` | A `mailto:` link is clicked | `Footer.tsx` |
| `package_view` | A tour/package detail page loads | `PackageViewTracker.tsx` |
| `inquiry_started` | A user opens an inquiry modal/form tab | `TourDetailsSidebar.tsx`, `TourCustomizationBanner.tsx` |
| `booking_started` | A user initiates the booking checkout flow | `BookingMobileBar.tsx` |
| `booking_completed` | Once, on the booking success page, after payment is confirmed — the de facto purchase/conversion event, with `value`, `currency`, and `items` | `BookingCompletedEvent.tsx` |

There is no `page_view`, `form_start`, or `payment_success` event in this codebase — don't assume one exists; `booking_completed` is what plays that role for a confirmed booking.

────────────────────────────────────

## Server-Side Tracking (Meta CAPI, Google Ads Offline Conversions, future integrations)

**Mechanism:** entirely separate from the client-side path above — no `dataLayer`, no browser involvement. A `Lead` or `Booking` is enqueued as an `OfflineConversion` row (`status: PENDING`) via `enqueueForLead(leadId)` (called from the lead-conversion route) or `enqueueForBooking(bookingId)` (called after a successful online payment). A scheduled sweep (`processPending()`, hit by the `/api/cron/offline-conversions` Vercel Cron target) then calls the matching adapter:

- **`adapters/google.ts`** — posts to the Data Manager API (`datamanager.googleapis.com/v1/events:ingest`), the current non-deprecated path for Google Ads offline conversions.
- **`adapters/meta.ts`** — posts to the Graph API Conversions endpoint directly, hashing PII (email, etc.) with SHA-256 before sending.
- **`adapters/microsoft.ts`** — interface and `isConfigured()` check exist; the actual upload call is an intentional stub. Do not treat Microsoft/Bing as production-ready.

Each adapter's `isConfigured()` no-ops safely when its credentials are absent, and a failed attempt increments `OfflineConversion.attempts` for retry — this is the one place in the codebase with a real retry mechanism, not a general pattern to assume exists elsewhere.

A `booking_completed` client-side event and an `enqueueForBooking` server-side conversion are **two separate calls from two separate places** for the same real-world event — implementing one does not implement the other.

────────────────────────────────────

## Engineering Rules

- Never call `gtag()` or `fbq()` directly — every client-side event goes through `push()` via a `track*()` function.
- Never bypass the offline-conversion queue to call a Google/Meta API directly from a route — always go through `enqueueForLead`/`enqueueForBooking` so retry and adapter configuration stay centralized.
- One event = one business action — don't fire the same event twice for one user action (e.g. once optimistically and once on confirmation).
- Track after successful completion, never before — no client-side event fires on a validation failure, and no server-side conversion is enqueued for a `FAILED`/`PENDING` booking.
- Keep the `AnalyticsEvent` union as the single source of truth for client-side event shapes — add a new variant there before adding a new `track*()` function, never send an untyped/free-form payload.
- Do not send PII in a client-side `dataLayer` event. Server-side conversions may send hashed PII (see the Meta adapter's SHA-256 hashing) — that's a deliberately different rule for a deliberately different, non-browser-exposed channel.

────────────────────────────────────

## Event Naming

Follow the existing `snake_case`, action-oriented convention already in use (`lead_submit`, `whatsapp_click`, `booking_completed`) — not a new naming style. Every event's required and optional payload fields are defined by its `AnalyticsEvent` variant in `src/types/analytics.ts`; there is no separate, undocumented payload convention to follow.

────────────────────────────────────

## Common Mistakes

- Calling `gtag()`/`fbq()` directly instead of `push()`.
- Assuming a client-side `track*()` call also produces a server-side ad-platform conversion, or vice versa — they're independent and both may be needed.
- Firing `booking_started`/`booking_completed` (or any event) before the action is actually confirmed.
- Re-implementing internal-route suppression per call site instead of relying on `isInternalRoute` inside `push()`.
- Adding a new event variant without updating `src/types/analytics.ts`, leaving the payload untyped.
- Treating the Microsoft/Bing offline-conversion adapter as live — it isn't.
- Sending PII in a client-side event payload.

────────────────────────────────────

## Verification

```bash
yarn typecheck
yarn lint
yarn build
```

Then manually verify in the browser: the event logs to the console in dev mode, fires exactly once for the action it represents, and does not fire on an internal/admin route. For a server-side conversion, confirm the corresponding `OfflineConversion` row is created with `status: PENDING` and check `lastError`/`attempts` after the next cron sweep if it doesn't reach `SENT`.

────────────────────────────────────

## Real Repository Examples

- `src/components/analytics/PackageViewTracker.tsx` → `trackPackageView` — simplest reference for a page-load client event.
- `src/components/booking/BookingCompletedEvent.tsx` → `trackBookingCompleted` — the one event carrying a monetary `value`/`items` payload.
- `src/app/api/leads/[id]/convert/route.ts` → `enqueueForLead` — the server-side conversion path, called inside the same request that creates the booking, after the `$transaction` commits.
- `src/lib/offlineConversion/adapters/meta.ts` vs. `src/lib/analytics.ts` — the clearest concrete illustration of the client-side/server-side split this Skill is built around.

────────────────────────────────────

## Delivery Summary

Every analytics task should report:

- Business purpose.
- Event(s) added or modified, and whether client-side, server-side, or both.
- Platforms affected.
- Payload changes (`AnalyticsEvent` union, `OfflineConversion` fields).
- Files modified.
- Verification performed.
- Manual deployment steps, if any (e.g. confirming a corresponding GTM-container tag exists — that configuration lives outside this repository).

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Related Documents

- `api-route.md`
- `booking-finance.md`
- `admin-crud.md`
- `../context/business-rules.md`
- `../context/tech-stack.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
