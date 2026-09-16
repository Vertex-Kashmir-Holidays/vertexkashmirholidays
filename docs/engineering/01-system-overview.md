# 01 — System Overview

> **What this section explains:** what Vertex Kashmir Holidays is, for both a non-technical stakeholder and an engineer — and, at the end, a single "VK at a Glance" reference letting anyone understand the whole system in about five minutes.
>
> **Confidence:** Synthesized from every section of this documentation set.

---

## Non-technical explanation

Vertex Kashmir Holidays is a Kashmir/Ladakh-focused travel agency. The platform is both its digital storefront and its internal operations system, built as one piece of software rather than separate tools bolted together:

- **A public website** where travellers discover tour packages, read about destinations, and either submit an enquiry or book directly online.
- **An internal CRM** where the sales team works those enquiries, negotiates and finalizes bookings, tracks payments, and manages day-to-day operations — leads, customers, itineraries, staff, payroll, and internal communication.
- **A customer portal** where a signed-in traveller can see their own bookings, payments, and profile.

The business runs on converting a website visitor into a qualified enquiry, and a qualified enquiry into a paid, confirmed booking — everything in the platform ultimately serves that funnel, from SEO-optimized tour pages at the top to payment reconciliation and sales commission at the bottom.

## Technical explanation

VK is a single Next.js 16 (App Router) application — not a collection of microservices — serving three route-group surfaces (public, account, admin) from one codebase and one PostgreSQL database (Neon), deployed on Vercel. Every mutation flows through an explicit HTTP boundary (a Route Handler), validated with Zod and authorized through a three-layer RBAC model, before reaching a domain function and finally Prisma. External services (payments, media, analytics, ad platforms) are each reached through one dedicated adapter module that degrades gracefully when unconfigured. Full architectural detail in §03.

---

## VK at a Glance — the five-minute version

### Architecture

One Next.js 16 app · three route-group surfaces (public/account/admin) · one PostgreSQL database (Neon) · Vercel serverless hosting · no microservices, no message queue, no Server Actions.

### Tech stack (headline)

Next.js 16 + React 19 + TypeScript (strict) · Tailwind CSS + Radix/shadcn · Prisma 6 + PostgreSQL · NextAuth v5 (3 sign-in paths) · Razorpay · Cloudinary · Zod · Upstash Redis · Vercel + GitHub Actions. Full inventory: §04.

### Database

69 models, 32 enums, 23 migrations. Core domain: `Lead → Booking → BookingPayment/BookingService → BookingCommission → SalaryRecord`. Full schema: §08.

### Integrations

Razorpay (payments), Cloudinary (media), Google (OAuth/Ads/Places/Maps), Meta (Pixel/CAPI), Cloudflare Turnstile (bot protection), Upstash Redis (rate limiting), 8x8 JaaS/Jitsi (internal video), GTM (the only analytics script injected directly). Every integration follows one adapter pattern and no-ops gracefully when unconfigured. Full inventory: §11.

### Major user flows

1. **Lead → Booking**: enquiry → sales works it → itinerary built (mandatory) → conversion transaction (customer + booking + lock, atomic) → offline ad-conversion fired.
2. **Direct booking**: tour page → checkout → server-computed price → Razorpay → HMAC-verified confirmation (client callback + server webhook, converging on one idempotent path).
3. **Commission → payroll**: a lead-converted booking generates a frozen-rate commission, earned on full payment, claimed into a monthly `SalaryRecord`, reviewed by the employee, paid by Finance.

Full sequence diagrams: §26.

### Infrastructure

Vercel (compute, Edge Middleware, one Cron job) · Neon (dev/prod split, never auto-synced) · Cloudflare (CDN/Turnstile) · Bluehost (DNS) · GitHub Actions (typecheck/lint/build gate, no test step). Full detail: §18–§20.

### Deployment

`dev` (integration) → PR → CI gate → Vercel Preview → merge to `main` → automatic production deploy. Migrations are a separate, deliberate, manual step — never automatic. Full detail: §20.

### Monitoring

No APM, no alerting, no centralized logging — Vercel's own function logs plus a handful of narrow database audit tables (`PaymentAudit`, `AuditLog`, `OfflineConversion.lastError`) are what exists today. A real, named gap, not an oversight. Full detail: §22.

### Critical dependencies (if any of these fail, something important breaks)

| Dependency | What breaks if it fails |
|---|---|
| Neon (database) | Everything |
| Vercel | Everything |
| Razorpay | Online payments (offline recording still works) |
| Cloudinary | Media uploads in any deployed environment |
| NextAuth/`AUTH_SECRET` | All sign-in |

Full risk detail: §11, §31.

---

## Primary users and their journeys

| User | Primary journey |
|---|---|
| Prospective traveller | Browse → enquire or book directly |
| Customer | Sign in → view bookings/payments/profile |
| Sales staff | Work leads → convert → manage bookings/payments |
| Admin/Superadmin | Everything above + users, roles, settings, reporting |
| Editor | Manage public content only |
| B2B travel partner | Self-register → submit/manage quote requests |

Full detail: §02, §14, §26, §27.

## Major system capabilities

Tour/destination/activity catalog with SEO · lead capture and CRM pipeline · direct online booking with server-verified payment · booking finance (discount/GST/balance, single source of truth) · sales commission tracking · payroll (salary + leave) · internal team chat and video meetings (Vertex Connect) · content management for every public page · marketing attribution and offline ad-conversion upload · role-based admin access control with MFA.

## What VK deliberately does not have

No external CMS, no dedicated search backend, no WhatsApp Business API (click-to-chat links only), no flights/hotels third-party booking API, no vendor portal, no public API product for external consumers, no message queue, no APM. Each of these is either a deliberate simplicity choice (§12, §16) or a named, tracked gap (§22, §35) — this documentation set is explicit about which is which throughout.

## Related Documents

This section is the entry point — every claim above is expanded with full detail, evidence, and confidence level in its cited section. Start with §00 for how to navigate the rest of this documentation set, or jump directly to the section matching your question via the index there.
