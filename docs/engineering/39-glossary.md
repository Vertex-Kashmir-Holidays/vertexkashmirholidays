# 39 — Glossary

> **What this section explains:** technical and VK-specific business terminology used throughout this documentation set.
>
> **Confidence:** Standard technical definitions are general knowledge; VK-specific terms are confirmed from the schema/code research underlying §02–§29.

---

## General technical terms

| Term | Meaning in this context |
|---|---|
| **SSR** (Server-Side Rendering) | A page is rendered to HTML on the server for each request |
| **SSG** (Static Site Generation) | A page is rendered to HTML once at build time |
| **ISR** (Incremental Static Regeneration) | A hybrid: a page is statically cached but regenerated in the background after a `revalidate` window — VK's default for public content (§17) |
| **CSR** (Client-Side Rendering) | Rendering happens in the browser via JavaScript, not pre-rendered HTML |
| **RSC** (React Server Component) | A React component that renders only on the server, ships no JS to the browser — VK's default component type (§03, §06) |
| **ORM** (Object-Relational Mapper) | A library mapping database rows to typed objects — Prisma, in VK's case (§08) |
| **API** (Application Programming Interface) | Here, specifically VK's Route Handlers under `src/app/api/**` (§09) |
| **Webhook** | An inbound HTTP call a third party makes into VK when an event happens on their side (e.g. Razorpay's payment webhook, §28) |
| **CDN** (Content Delivery Network) | A geographically distributed cache — Vercel's Edge Network and Cloudflare, in VK's case (§18) |
| **JWT** (JSON Web Token) | A signed token format — used for Google One Tap verification and Vertex Connect's Jitsi meeting tokens (§10, §28) |
| **Session** | The authenticated state tying a browser to a `User` — managed by NextAuth, persisted via `@auth/prisma-adapter` (§10) |
| **Migration** | A committed, forward-only schema change file, applied via Prisma Migrate (§08) |
| **Connection pool** | A managed set of reused database connections — relevant to Neon/Prisma's scaling behavior (§36) |
| **RBAC** (Role-Based Access Control) | Authorization based on a user's role and a permission matrix, not hardcoded per-user rules — VK's model (§10) |
| **HMAC** | A cryptographic signature scheme used to verify the Razorpay webhook is genuinely from Razorpay (§21) |
| **CSP** (Content Security Policy) | A browser-enforced header restricting what scripts/resources a page may load — VK's nonce-based/static dual approach (§21) |
| **Adapter pattern** | A shared interface + per-provider implementation, used for every multi-provider integration in VK (ADR 0005) |
| **Idempotent** | An operation safe to run multiple times with the same result — relevant to VK's webhook handling (payment confirmed once, not double-recorded) |

## VK-specific business terms

| Term | Meaning |
|---|---|
| **Lead** | Every enquiry, before it becomes a `Booking` — never created directly as a booking or customer (§02, §14) |
| **Qualified Lead** | A lead the sales team has vetted and is actively negotiating (`QUALIFIED`/`NEGOTIATION` status) |
| **Converting a lead** | Turning a `Lead` into a `Booking` via the dedicated `POST /api/leads/[id]/convert` transaction — not a plain status change (§26 Flow 1) |
| **Itinerary** | The trip plan document, mandatory before a lead can convert, linked exclusively to either a Lead or a Booking (§08) |
| **Effective Payable** | `bookingAmount − discountAmount` — the actual amount owed, distinct from GST (§26 Flow 3) |
| **Token payment** | The initial payment recorded at lead conversion, required to be less than the full negotiated amount (§02, §26) |
| **Advance** | The fixed 10% online-payment option at direct checkout (§26 Flow 2) |
| **Commission** (Booking Commission) | A salesperson's earned share of a lead-converted booking's profit, tracked through `EXPECTED → EARNED → PAID/REVERSED` (§26 Flow 4) |
| **Servicing / Services Locked** | `BookingService` line items (hotel/transport/activity/other); once `servicesLocked`, no longer editable (§02, §08) |
| **B2B Agent / B2B Request** | A travel-partner acquisition channel — a Lead with `b2bAgentId` set is a B2B quote request, not a separate data model (§14) |
| **Vertex Connect** | The internal staff chat + Jitsi video-meeting tool (§28) |
| **Offline Conversion** | A server-side upload of a Lead/Booking event to Google Ads or Meta, independent of client-side pixel firing (§13) |
| **Attribution** | UTM/click-ID data captured once at Lead/Booking creation, never re-derived (§13) |
| **Singleton content** | A CMS content model with exactly one row (`id: "singleton"`) — Home/About/Contact/Blog/Reviews page content, SiteSettings (§08, §12) |
| **JSON-string column** | A schema convention where structured data is stored as JSON text inside a `String` column rather than Prisma's native `Json` type (§08) |
| **Salary Record** | One payroll snapshot per employee per month, `DRAFT → REVIEW → PAID` (§26 Flow 4, §27) |
| **Leave entitlement** | Computed on read (1.5 paid days/month, no carry-forward) — not a stored balance field (§27) |
| **`RETENTION_DAYS`** | The 90-day window after which Vertex Connect chat messages/attachments are purged (§28) |
| **Key Event / Conversion** | GA4/Google Ads terminology for a tracked, business-significant user action — `booking_completed` plays this role client-side (§13) |
| **`published`** | The boolean gate controlling whether a `Tour`/`Blog`/`Campaign`/etc. row is visible on the public site — filtered at the query level everywhere, with no draft-preview mechanism (§08, §12) |
| **Soft delete** | Marking `deletedAt` rather than removing a row — the default for business records (§08) |

## Related Documents

- Every term above links back to the section where it's explained in full context — use this glossary as a fast lookup, not a substitute for reading the source section.
