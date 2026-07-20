This document defines the business rules of Vertex Kashmir Holidays.

This is NOT technical documentation.

This is NOT implementation documentation.

It describes how the business operates.

Future developers and AI assistants must read this document before implementing any booking, CRM, payment, lead, or customer functionality.

────────────────────────────────────

# Business Rules

Version: 1.0.0

Last Updated: 2026-07-16

## Purpose

This document defines business _behaviour_, not implementation. It describes what the business needs to be true — statuses, ownership, pricing, and lifecycle rules — independent of which file or function currently enforces them.

Business rules always take precedence over implementation assumptions. Where the repository's actual behaviour is ambiguous or looks like an oversight rather than a deliberate rule, this document says so explicitly rather than guessing.

────────────────────────────────────

## 1. Lead Management — Implemented

- Every enquiry starts as a **Lead** (`Lead` model), not directly as a Booking or Customer record.
- A lead's source is one of a fixed set (`LeadSource`): `WEBSITE`, `MANUAL`, `GOOGLE_ADS`, `META_ADS`, `THIRD_PARTY`, `REFERRAL`. There is no `WHATSAPP` or `PHONE_CALL` source value — a phone enquiry is logged as `MANUAL` or `THIRD_PARTY` today.
- A lead's status (`LeadStatus`) is one of: `NEW`, `CONNECTED`, `NOT_CONNECTED`, `QUALIFIED`, `NEGOTIATION`, `ON_HOLD`, `CONVERTED`, `REJECTED`. There is no separate "lost" status — `REJECTED` and `ON_HOLD` are the closest equivalents.
- A lead is also tagged with a `LeadCategory` (`HONEYMOON_TOUR`, `COUPLE`, `FAMILY_TOUR`, `GROUP_TOUR`, `SKI_TOUR`, `OFFBEAT_TOUR`) — a trip-type tag distinct from its source.
- **Duplicate prevention:** a new public-form lead is blocked if a lead with the same phone or email already exists, is still in an "active" status (`NEW`/`CONNECTED`/`NOT_CONNECTED`/`QUALIFIED`/`NEGOTIATION`), and was created within the last **15 days**. A lead in `ON_HOLD`, `REJECTED`, or `CONVERTED` never blocks a fresh enquiry, regardless of age (`src/app/api/leads/route.ts`).
- **Every status change, assignment change, note, follow-up, and attachment is recorded** as an immutable `LeadActivity` row — lead history is never lost or overwritten.
- Leads are assigned to a single staff member (`assignedToId`); only that assignee (not any admin) may convert their lead into a booking.
- Once converted, a lead is `locked` — further edits are blocked until explicitly unlocked by an admin.

## 2. Booking Rules — Implemented

- A booking can be created **two ways**: (a) converted from a qualified Lead by its assigned staff member, or (b) created directly by a website visitor completing checkout on a Tour page. Both paths produce the same `Booking` row; a lead-converted booking has no `tourId` (it's a custom itinerary), a direct booking always does.
- **A booking does not require a registered customer account.** Guest details (`guestName`, `guestEmail`, `guestPhone`) are always captured on the booking row itself; `userId` is optional and gets linked opportunistically (see Customer Rules).
- **Services belong to a booking** (`BookingService`: HOTEL / TRANSPORT / ACTIVITY / OTHER line items), each with its own amount.
- **Booking owns pricing** at the top level (`Booking.amount`) — the negotiated total for a lead conversion, or the tour's package price for a direct booking.
- **Discount is applied at the booking level**, as either `FLAT` (a fixed rupee amount) or `PERCENT` of the booking amount, clamped so it can never exceed the booking amount or go negative.
- **Locked bookings:** once `servicesLocked` is set, services can no longer be added, edited, or deleted. Driver/vehicle assignment is separately editable by staff only up until one day before `travelDate`.
- Bookings are soft-deleted (`deletedAt`) — hidden from listings/reports but the row (and its payments/services) is retained; a permanent delete is a separate, explicit action.
- **Requires Business Decision:** cascade behaviour on user deletion is inconsistent across relations (documented in the engineering backlog as "Define Cascade / Referential Integrity Policy for User Relations") — e.g. a departed staff member's chat messages currently block their account from being deleted. This is a technical gap with a real business consequence and has no settled policy yet.

## 3. Payment Rules — Implemented (with one nuance not commonly assumed)

- **Current payment provider:** Razorpay, for online payments only.
- **Online payment flow:** the customer chooses `ADVANCE` (a fixed **10%** token) or `FULL` online payment. The chargeable amount is always computed server-side from the booking total — the client never sends an amount. Flow: `create-order` → Razorpay checkout → `verify-payment` (HMAC signature check) → `webhook` (async confirmation).
- **Token payment at lead conversion:** converting a lead requires a token amount that must be strictly less than the booking amount; it's recorded as the booking's first payment (`PaymentType.TOKEN`).
- **Remaining balance:** tracked as `effectivePayable (amount − discount) − sum(all recorded payments)`. A payment can never be recorded for more than the remaining balance.
- **Offline payments ARE supported:** staff can manually record a payment against a booking with method `Cash`, `UPI`, `Card`, `Bank Transfer`, or `Online` — this is not Razorpay-only.
- **GST is a payment-level rule, not a booking-level rule** (a common assumption to double-check against): GST is optional, applies **only to non-cash payment methods**, and is computed per individual payment row — not once against the whole booking. The percent is chosen from a configurable list (default 5/16/18%) and the computed amount is persisted alongside the raw percent for reporting. GST does **not** change the payable/balance calculation — it's recorded as a tax breakdown _within_ the amount received, not added on top of it.
- **"Final amount" clarification:** the balance/payable calculation is `bookingAmount − discountAmount`, full stop — GST is not part of that formula. Do not assume "Final Amount = Base − Discount + GST"; GST is reporting metadata on a payment, independent of the payable total.
- **Refund behaviour:** implemented as a manually staff-recorded `BookingPayment` with `type: "REFUND"`, stored as a positive amount. Refund entries are excluded from the "can't exceed remaining balance" check (a refund isn't a collection against the payable), and `computeBookingFinance` **subtracts** REFUND rows from `paidAmount` — a refund reduces the net amount received (and correspondingly raises the outstanding balance), it does not add to it. Any caller feeding payments into `computeBookingFinance` must select `type` alongside `amount` for this netting to apply.

## 4. Customer Rules — Implemented, but no dedicated Customer entity

- **There is no separate "Customer" or "Traveller" model in the schema.** A customer is a `User` row with `role: CUSTOMER`. Guest bookings (no account) exist purely as `guestName`/`guestEmail`/`guestPhone` fields on the `Booking` row, with `userId` left null.
- **Customer uniqueness / duplicate prevention differs by booking origin, deliberately:**
  - **Lead conversion** (staff-vetted): match an existing user first by email (globally unique), then by phone among existing `CUSTOMER`-role users; only create a new account if no match and an email is present.
  - **Direct website booking** (unverified visitor): match **strictly by email only** — phone matching is deliberately _not_ used here, because phone isn't unique/verified and matching by phone alone on a public flow could link a stranger's booking to someone else's account. This asymmetry between the two paths is intentional, not an inconsistency.
- A newly auto-created customer account gets a system-generated temporary password and `mustChangePassword: true`; credentials are emailed, never left for the customer to guess.
- **Requires Business Decision — Primary/Additional traveller detail:** the schema only stores a traveller **headcount** (`Booking.travellers: Int`, derived from `Lead.adults + Lead.children` at conversion). There is no structured "primary traveller" vs "additional traveller" record (names, ages, ID documents per traveller). If the business needs per-traveller detail (e.g. for group bookings or visa/permit paperwork), that is unbuilt and needs a product decision before implementation.

## 5. Tour Rules — Implemented, with real gaps flagged

- **Published/Draft:** every `Tour` has a `published` boolean; only `published: true` tours are ever visible on the public site (enforced at the query level in every public route/RSC).
- **Categories:** fixed enum — `HONEYMOON`, `FAMILY`, `ADVENTURE`, `LUXURY`, `BUDGET`, `GROUP`, `PILGRIMAGE`, `PREMIUM`.
- **Region:** fixed enum — `KASHMIR` or `LADAKH` only (no other region exists today).
- **Destinations & Activities:** many-to-many via `TourDestination` and `ActivityTour` join tables — a tour can span multiple destinations and offer multiple bookable activities.
- **Pricing:** a single `priceFrom` (starting price) plus optional `priceWas`/`discountPct` for a struck-through "was" price display. There is no per-date or per-batch price variation stored structurally.
- **Lead-capture mode:** each tour has a `formMode` (`BOOKING_ONLY` / `INQUIRY_ONLY` / `BOTH`) controlling which form(s) the public tour page shows.
- **Requires Business Decision — Seasonality/Availability:** there is no real availability calendar, slot count, or capacity field. `bestTime`/`bestTimeDetail` are marketing copy, not bookable-date logic, and `batches` is a free-form JSON string with no enforced structure or seat-count validation. If the business intends to cap seats per departure or block out sold-out dates, that logic does not exist yet and needs a decision on data model before it can be built.

## 6. Itinerary Rules — Implemented

- An `Itinerary` links to **either** a `Lead` **or** a direct `Booking` — never both (enforced by two separate unique optional foreign keys, used mutually exclusively in practice: a converted lead's booking reuses the lead's itinerary rather than getting a second one).
- **Itinerary is mandatory before a lead can be converted to a booking** — this is enforced server-side (`ITINERARY_REQUIRED` error), not just a UI nudge. Attempting conversion without a linked itinerary is rejected.
- On conversion, the lead's itinerary is locked (`locked: true`) and its status forced to `CONFIRMED` — it becomes the final, immutable plan the booking is built on.
- Every save produces an `ItineraryHistory` snapshot — full version history is retained, not just the latest state.

## 7. Pricing Rules — Implemented

Verified formulas, from `src/lib/bookings/finance.ts` and `src/lib/payments/gst.ts`:

- `discountAmount` = a `FLAT` rupee value, or a `PERCENT` of the booking amount — always clamped between `0` and the booking amount.
- `effectivePayable` = `bookingAmount − discountAmount`.
- `paidAmount` = sum of collection rows minus REFUND rows (net amount received; see Payment Rules above).
- `balance` = `effectivePayable − paidAmount`.
- `servicesTotal` = sum of all `BookingService` line-item amounts — tracked separately, not netted against the payable total (services are cost/margin tracking, not customer-facing charges by default).
- **Online advance option:** a fixed **10%** of the total (`ADVANCE_PERCENT`), computed server-side, never client-supplied.
- **GST:** optional, non-cash-only, computed as `paymentAmount × gstPercent / 100`, stored per payment — not part of the payable/balance formula (see Payment Rules).
- Do not invent a formula beyond the above — there is no separate "extra charges" or "optional services surcharge" concept distinct from a `BookingService` line item.

## 8. CRM Rules — Implemented modules only

Actual admin modules present today (`src/lib/rbac.ts` MODULES, mirrored by `src/app/admin/*`):

Dashboard, Packages (Tours), Destinations, Activities, Bookings, Leads, Itineraries, Users, Vertex Connect (internal team chat/meetings), Galleries, Blogs, FAQs, Home/About/Contact/Legal page content, Adventures (Campaigns), Offline Conversions, Banners, Reviews, SEO & Pages, Settings, Roles & Permissions.

- **Not implemented — do not assume they exist:** there is no **Vendors** module (no `Vendor` model in the schema at all) and no dedicated **Reports** module — reporting today is limited to the admin Dashboard's revenue chart, not a standalone reporting module with exports/scheduled reports.
- **Roles:** `SUPERADMIN`, `ADMIN`, `DEVELOPER`, `SALES`, `EDITOR`, `CUSTOMER`. Note the `DEVELOPER` role exists in the schema — a separate technical-staff role in addition to the four documented in the tech-stack/CLAUDE.md role list.

## 9. Marketing Rules — Implemented

- **GA4 and Meta Pixel (client-side)** are configured as tags _inside_ the Google Tag Manager container — not hardcoded in the application. GTM itself is the only script this codebase injects directly.
- **UTM and click-ID attribution** (`utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `landingPage`, `referrer`) is captured **once, at Lead or direct-Booking creation**, and never re-derived. A lead-converted booking copies its lead's attribution verbatim at conversion time rather than capturing it a second time.
- **Google Ads Offline Conversions** and **Meta Conversions API** are implemented server-side, queued via the `OfflineConversion` model and uploaded per-lead/per-booking, independent of whether the client-side pixel fired (ad-blocker/ITP resilient).
- **Not production-ready:** a Microsoft/Bing Ads offline-conversion adapter exists in code but its actual upload call is an intentional stub — do not treat Microsoft/Bing conversion tracking as live.
- **Newsletter subscription** (`NewsletterSubscriber` model) exists in the schema but has **zero usage anywhere in the application code** — no API route, no admin page, no public signup form references it. Treat it as dormant/unimplemented, not a live feature.

## 10. Security Rules — Implemented, with one explicit gap

- **Authentication:** NextAuth v5, three coexisting sign-in paths — Credentials (password), Google OAuth, and Google One Tap. Google sign-in is customer-only; it can never provision or authenticate a staff account.
- **Authorization / Role-Based Access:** three-layer model — edge middleware (coarse staff/non-staff check) → admin layout (session + UI-level permission map) → per-route `requirePermission(module, action)` backed by the `RolePermission` DB table. `SUPERADMIN` bypasses the permission table entirely; every other staff role is checked per module/action.
- **MFA:** implemented for staff/admin accounts as TOTP (enroll via QR code → verify → confirm), with recovery codes (`MfaRecoveryCode`).
- **Rate limiting:** implemented via Upstash Redis (with an in-memory, per-instance fallback when Upstash isn't configured) on booking creation/verification, all OTP routes, login, and lead submission.
- **Audit Logs — NOT implemented for admin actions.** Only `PaymentAudit` exists, and it covers payment-gateway events only (order creation, signature verification, webhook events). Role changes, permission edits, and user deletion/restoration produce **no audit trail today** — this is a known, explicitly tracked gap (highest-priority Security item in the engineering backlog), not a documentation oversight.

## 11. Future Business Rules

Capabilities that are planned or explicitly scoped as future work, per the engineering roadmap/backlog documents in this repo — none of the following exist today:

- Admin-facing audit-log viewer (the underlying admin audit log itself doesn't exist yet either — see Security Rules above)
- Flights
- Hotels API
- B2B Integrations
- Vendor Portal
- Feature flags, background job infrastructure, event-driven architecture, API versioning, internationalization, and multi-tenancy — each explicitly scoped in the roadmap as "assess and document a decision," not "build," pending a real business trigger.

**Already implemented — do not re-list as future work:** a **Customer Portal** already exists (`src/app/account/**` — bookings, payments, profile, scoped to the authenticated user), so it should not appear on a "planned" list.

────────────────────────────────────

# Related Documents

- project-overview.md
- tech-stack.md
- folder-structure.md
- ../instructions/architecture.md
