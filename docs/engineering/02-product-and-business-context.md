# 02 — Product & Business Context

> **What this section explains:** what Vertex Kashmir Holidays is as a business, who uses the platform, what the platform is for, and the business rules that govern its core entities (leads, bookings, payments, customers, tours) — independent of how any of it is implemented.
>
> **Confidence:** Confirmed from `.ai/context/project-overview.md` and `.ai/context/business-rules.md` (the team's own curated business documentation), cross-checked against the schema and route research in §08/§09/§14/§26.

---

## Non-technical explanation

Vertex Kashmir Holidays is a travel agency business specializing in Kashmir (and, secondarily, Ladakh) tourism. The platform is the company's digital storefront and internal operations system in one: a public website where travellers discover tour packages and submit enquiries, and an internal CRM where the sales team turns those enquiries into confirmed, paid bookings.

**Primary users:**

| User | What they do on the platform |
|---|---|
| **Prospective traveller** (anonymous visitor) | Browses tours/destinations/activities, reads blog content, submits a lead (enquiry) or books a tour directly online |
| **Customer** (signed-in traveller) | Views their own bookings, payments, and profile in the account portal (`/account`) |
| **Sales staff** | Works leads in the CRM, converts qualified leads into bookings, records payments, builds itineraries |
| **Admin / Superadmin** | Everything sales staff can do, plus user/role management, site content, settings, and reporting |
| **Editor** | Manages public-facing content (tours, blog, destinations, banners) without CRM access |
| **B2B travel partner** (agent) | A separate acquisition channel — submits group/agent booking requests through a dedicated program |

**Business objectives** (per `.ai/context/project-overview.md`): generate qualified travel leads, convert leads into confirmed bookings, manage the complete booking lifecycle, improve operational efficiency, deliver a strong traveller experience, and maintain a scalable engineering codebase.

## Technical explanation

Three logical surfaces share one Next.js codebase and one database, distinguished by route group and auth requirement (see §06, §10):

- **Public site** (`src/app/(public)/`) — no auth, ISR-cached, SEO-optimized.
- **Customer account** (`src/app/account/`) — any authenticated user, scoped to their own records.
- **Admin CRM** (`src/app/admin/`) — staff roles only, RBAC-gated per module.

The system's core domain objects and their lifecycle are: `Lead` → (conversion) → `Booking` → `BookingService` (line items) + `BookingPayment` (ledger) → `Itinerary`. See §08 for the full schema and §26 for the end-to-end flow.

---

## Business Rules

The following is sourced directly from `.ai/context/business-rules.md` (v1.1.0, 2026-08-02) — the team's authoritative business-rules document — reorganized here for reference alongside the rest of this documentation set. Treat `.ai/context/business-rules.md` as the living source; this is a snapshot for context.

### 1. Lead Management

- Every enquiry starts as a `Lead`, never directly as a `Booking` or `Customer`.
- **`LeadSource`**: `WEBSITE`, `MANUAL`, `GOOGLE_ADS`, `META_ADS`, `THIRD_PARTY`, `REFERRAL`. No `WHATSAPP` or `PHONE_CALL` value exists — a phone enquiry is logged as `MANUAL` or `THIRD_PARTY`.
- **`LeadStatus`**: `NEW`, `CONNECTED`, `NOT_CONNECTED`, `QUALIFIED`, `NEGOTIATION`, `ON_HOLD`, `CONVERTED`, `REJECTED`. No separate "lost" status — `REJECTED`/`ON_HOLD` are the closest equivalents.
- **`LeadCategory`**: `HONEYMOON_TOUR`, `COUPLE`, `FAMILY_TOUR`, `GROUP_TOUR`, `SKI_TOUR`, `OFFBEAT_TOUR` — a trip-type tag, distinct from source.
- **Duplicate prevention:** a new public-form lead is blocked if a lead with the same phone/email exists, is in an "active" status, and was created in the last **15 days**. `ON_HOLD`/`REJECTED`/`CONVERTED` never block a fresh enquiry.
- Every status/assignment/note/follow-up/attachment change is recorded as an immutable `LeadActivity` row.
- Leads are assigned to one staff member; only that assignee may convert their lead.
- A converted lead is `locked` until an admin explicitly unlocks it (`POST /api/leads/[id]/unlock`).

### 2. Booking Rules

- A booking is created two ways: converted from a qualified lead (no `tourId`, custom itinerary), or a direct website checkout (always has a `tourId`).
- **No registered account is required to book** — guest details live on the booking row (`guestName`/`guestEmail`/`guestPhone`); `userId` is optional.
- `BookingService` rows (HOTEL/TRANSPORT/ACTIVITY/OTHER) are the booking's line items.
- `Booking.amount` is the top-level negotiated/package price.
- Discount is booking-level: `FLAT` or `PERCENT`, clamped to `[0, bookingAmount]`.
- Once `servicesLocked`, services can't be added/edited/deleted; driver/vehicle assignment stays editable through the travel date.
- Bookings are soft-deleted (`deletedAt`).
- **Open business decision:** cascade behaviour on user deletion is inconsistent across relations — no settled policy yet (tracked in the engineering backlog).

### 3. Payment Rules

- **Provider:** Razorpay, online only. Offline payments (Cash/UPI/Card/Bank Transfer/Online) are also staff-recordable manually.
- **Online flow:** `ADVANCE` (fixed **10%**) or `FULL`, always server-computed. `create-order` → Razorpay checkout → `verify-payment` (HMAC) → `webhook` (async confirmation).
- **Token payment at conversion:** required, must be strictly less than the booking amount; recorded as the first `BookingPayment` (`type: TOKEN`).
- **Balance:** `effectivePayable (amount − discount) − sum(all payments)`. A payment can never exceed the remaining balance — except a refund.
- **GST is payment-level, not booking-level:** optional, non-cash only, computed per payment row from a configurable rate list (default 5/16/18%). It does **not** affect payable/balance — it's tax-breakdown metadata on the amount received.
- **Refunds:** a manually-recorded `BookingPayment` with `type: REFUND` (stored positive), excluded from the balance-exceeded check, and **subtracted** from `paidAmount` in `computeBookingFinance` — raising the outstanding balance, not adding to it.

See §26 (Core Business Flows) and `.ai/skills/booking-finance.md` for the full computed-value chain.

### 4. Customer Rules

- **There is no separate Customer/Traveller model** — a customer is a `User` row with `role: CUSTOMER`. Guest bookings have no `userId`.
- **Duplicate-prevention differs by origin, deliberately:** lead conversion (staff-vetted) matches by email first, then phone; direct website booking (unverified) matches **strictly by email** — phone matching is deliberately excluded there, since an unverified phone number could link a stranger's booking to someone else's account.
- A newly auto-created account gets a system-generated temporary password (`mustChangePassword: true`), emailed — never left for the customer to guess.
- **Open business decision:** no structured per-traveller record (names/ages/documents) — only a headcount (`Booking.travellers`). Needed for group bookings or visa/permit paperwork, but unbuilt.

### 5. Tour Rules

- **Published/Draft:** `Tour.published` gates public visibility everywhere, at the query level.
- **Categories:** `HONEYMOON`, `FAMILY`, `ADVENTURE`, `LUXURY`, `BUDGET`, `GROUP`, `PILGRIMAGE`, `PREMIUM`.
- **Region:** `KASHMIR` or `LADAKH` only.
- **Destinations/Activities:** many-to-many via join tables.
- **Pricing:** single `priceFrom` + optional `priceWas`/`discountPct` — no per-date/per-batch price variation.
- **`formMode`:** `BOOKING_ONLY` / `INQUIRY_ONLY` / `BOTH` — controls which form(s) a tour page shows.
- **Open business decision:** no real availability calendar/seat-count/capacity model — `batches` is unstructured JSON, `bestTime` is marketing copy only.

### 6. Itinerary Rules

- Links to **either** a Lead **or** a Booking, never both.
- **Mandatory before lead conversion** — enforced server-side (`ITINERARY_REQUIRED`), not just a UI nudge.
- On conversion: itinerary locks, status forces to `CONFIRMED`, and the booking's services auto-seed from the itinerary's hotels/transport/activities at ₹0 (staff fills in real costs afterward).
- Every save produces an `ItineraryHistory` snapshot — full version history retained.

### 7. Pricing Rules

Verified formulas from `src/lib/bookings/finance.ts` / `src/lib/payments/gst.ts` — see `.ai/skills/booking-finance.md` for the complete computation order and §26 for the sequence diagram. In short: `effectivePayable = bookingAmount − discountAmount`; `balance = effectivePayable − paidAmount`; GST is a separate, payment-level, non-cash-only calculation that never enters the payable/balance formula; the online advance is a fixed 10%, always server-computed.

### 8. CRM Rules

Actual admin modules today (32 `MODULES` entries — full list in §27): Dashboard, Packages (Tours), Destinations, Activities, Bookings, Leads, Itineraries, Proposals, Hotel Rates (Suppliers), Customers (Users), B2B Agents, B2B Requests, Employees, Salary, Leave, Vertex Connect, Galleries, Blogs, FAQs, Home/About/Contact/Legal, Adventures (Campaigns), Offline Conversions, Banners, Reviews, SEO & Pages, Settings, Roles & Permissions, Audit Log, Careers, Docs.

- **Not implemented — do not assume otherwise:** no dedicated **Vendors** module and no standalone **Reports** module (reporting is limited to the Dashboard's revenue chart).
- **Roles:** `SUPERADMIN`, `ADMIN`, `DEVELOPER`, `SALES`, `EDITOR`, `CUSTOMER`.

> Note: the module list above reflects the *current* codebase (§08/§27 research), which has grown since `.ai/context/business-rules.md` was last updated (2026-08-02) — Proposals, Hotel Rates, B2B Agents/Requests, Employees, Salary, Leave, Audit Log, and Careers are newer additions not yet reflected in that document. See §35 for this and other doc-vs-code gaps.

### 9. Marketing Rules

- **GA4 and Meta Pixel are GTM tags, not app code.** GTM is the only script this codebase injects directly.
- **UTM/click-ID attribution** is captured once, at Lead or direct-Booking creation, and never re-derived.
- **Three acquisition paths, one offline-conversion upload each:** Website Lead → CRM → Booking → payment → conversion; Direct Website Booking → online payment → conversion; Manual CRM Lead (staff-entered, ~10–20% of volume) → same downstream path as Website Lead.
- **Ad platforms see one signal, not every CRM status:** Google Ads/Meta get an offline conversion at lead-conversion and at successful online payment, not per intermediate CRM stage.
- **Duplicate-conversion prevention:** a lead-converted booking's later online payment doesn't re-fire a conversion already recorded against its originating lead.
- **Microsoft/Bing Ads offline conversions are not production-ready** — adapter exists, upload call is a stub.
- **Newsletter subscription** (`NewsletterSubscriber` model) exists in the schema with **zero usage anywhere in the app** — dormant, not a live feature.

### 10. Security Rules

See §10/§21 for full detail. Headline: three-layer authorization (middleware → layout → `requirePermission`), staff MFA (TOTP), Upstash-backed rate limiting with in-memory fallback. **Admin audit logging was, as of the last `.ai/` update, a known gap** — however, an `auditLog` module and `/admin/audit-log` page now exist in the current codebase (§27 research), so this gap has since been at least partially addressed; verify current coverage before treating it as fully closed (see §35).

### 11. Future / Not-Yet-Built

Per the engineering roadmap referenced in `.ai/context/business-rules.md`: an admin-facing audit-log viewer (see note above — may now exist), Flights, a Hotels API, deeper B2B integrations beyond the current agent/request model, a Vendor Portal, feature flags, background-job infrastructure, event-driven architecture, API versioning, i18n, and multi-tenancy — each explicitly scoped as "assess and document a decision," not "build."

**Already implemented — not a future item:** the Customer Portal (`src/app/account/**`) already exists.

---

## Related Documents

- `.ai/context/business-rules.md` — the living source for everything in this section
- `.ai/context/project-overview.md`
- §08 Database Architecture — the schema backing every rule above
- §14 CRM & Lead Management, §26 Core Business Flows — how these rules are implemented end-to-end
- §35 Technical Debt — open business decisions and doc/code gaps
