# 36 — Scalability & Future Architecture

> **What this section explains:** how VK would behave as traffic grows, where the first real bottlenecks would appear, and what architectural changes each growth stage would actually require — grounded in the specific serverless/single-database architecture documented in §03/§08/§18, not generic scaling advice.
>
> **Confidence:** This section is necessarily more **inferred** than most of this documentation set — it reasons forward from confirmed current architecture rather than reporting directly observed facts. Labeled accordingly throughout.

---

## The starting characteristics that shape everything below

- **Fully serverless compute** (Vercel Functions) — horizontal scaling is "free" up to Vercel's own platform limits, but every function is stateless and short-lived (§18).
- **One PostgreSQL database** (Neon) serving public reads, admin writes, and the entire CRM — no read replica, no separate analytics database confirmed (§08).
- **ISR caching** absorbs most public-site read traffic already (§17) — the public site is the part of the system least likely to need architectural change first.
- **No APM, no alerting, no load testing** confirmed anywhere (§22, §24) — meaning the first sign of a real bottleneck today would likely be a user-reported slowdown, not a dashboard alert.

## 1,000 users/day (roughly today's likely order of magnitude — inferred, not measured)

At this scale, the current architecture is almost certainly comfortable. ISR absorbs public traffic; the admin/CRM side is used by a small internal team, not the public. The Upstash in-memory rate-limiter fallback (§21) is fine at this volume even if Upstash itself isn't configured. **No architectural change needed.**

## 10,000 users/day

- **First likely friction point**: the Neon database connection pool, under a burst of concurrent serverless function invocations each opening their own connection. Prisma's connection management against a serverless-scaled function fleet is a well-known scaling edge case for this exact stack (Next.js + Prisma + serverless) — **inferred risk**, not something this documentation confirms is currently mitigated (e.g. via Prisma Accelerate or a pooler like PgBouncer — **requires verification** whether Neon's own built-in pooling is already handling this).
- **Rate limiting**: the in-memory fallback (§21) becomes genuinely inadequate at this point if Upstash isn't already configured — per-instance memory doesn't coordinate across Vercel's multiple concurrent function instances, so a "global" rate limit becomes many smaller, ineffective per-instance limits. **Recommendation**: confirm Upstash is actually configured in production well before this traffic level, not after.
- **ISR window**: a 5-minute stale-content window (§17) starts to matter more visibly as more visitors hit a page in that window — still likely fine, but worth monitoring.

## 100,000 users/day

- **Database becomes the central scaling question.** A single Postgres instance serving both the public site's read traffic and the CRM's write traffic starts to show real contention. The natural first architectural response — **read replicas** for the public-site's read-heavy queries, keeping the CRM's writes on the primary — is not built today and would be a genuine, deliberate architecture change (a new ADR candidate, §34).
- **Observability becomes non-optional.** At this scale, the current posture (§22 — no APM, no alerting) stops being a reasonable trade-off and starts being a real operational risk: an undetected slowdown or error spike could run for hours before anyone notices via a support ticket rather than a monitor.
- **Search** (§16) — if the catalog has grown proportionally, category-only browsing likely becomes a real UX limitation; this is the point a dedicated search backend (starting with Postgres full-text search as the lowest-effort step) becomes worth evaluating.
- **Rate limiting and bot protection** need to be fully production-configured (Upstash + Turnstile, §21) — not optional at this point given lead-form/booking-form abuse surface scales with traffic.

## 1,000,000+ users/day

- **The single-database, single-region architecture is the structural ceiling.** At this point, genuinely new architecture is warranted: a CDN/edge caching layer more aggressive than Vercel's default ISR behavior, a dedicated read-replica or even a separate reporting/analytics database so CRM operations never compete with public traffic for the same connection pool, and likely a message-queue-based background-job system (§28 confirms none exists today) for anything that currently piggybacks on request-time work (offline-conversion processing, stale-booking cleanup).
- **The three-surfaces-in-one-app model** (§03) would face a real decision point: does the admin CRM's traffic/compute profile (heavier, session-bound, `force-dynamic` everywhere) warrant separating it from the public site's traffic profile (lighter, cacheable, ISR-heavy)? This isn't a given — many systems successfully keep this unified far past 1M users/day — but it becomes a legitimate question at this scale in a way it isn't today.
- **A dedicated secrets manager and IaC** (§18, §21, §31, §35) move from "nice to have" to genuinely load-bearing — manual dashboard configuration doesn't scale to a larger team or a more complex infrastructure footprint without real risk of drift and error.

## What would NOT need to change

Worth naming explicitly, since scalability discussions often over-index on rewriting everything: the **Route-Handlers-not-Server-Actions** decision (ADR 0001), the **server-computed-pricing** guarantee (ADR 0004), and the **domain-logic-in-`lib/`** organization (ADR 0006) are all traffic-agnostic architectural choices that remain correct at any scale — they're about code organization and security posture, not throughput. Similarly, the RBAC/three-layer-auth model (§10) doesn't need to change as traffic grows, only as the *team* grows (more roles, more nuanced permissions).

## The honest summary

VK's current architecture is well-suited to its likely current scale and deliberately avoids premature complexity (no message queue, no read replica, no APM — each genuinely unnecessary at low-to-moderate traffic, per `.ai/instructions/coding-standards.md`'s own stated philosophy against premature optimization). The first three concrete, confident recommendations if traffic grew meaningfully, in likely order of need: **(1) confirm/add database connection pooling and Upstash-backed rate limiting**, **(2) add basic APM/alerting**, **(3) evaluate a database read replica** — each addressing a specific, named bottleneck above rather than a generic "scale everything" instinct.

## Related Documents

- §08 Database Architecture, §18 Infrastructure & Hosting — the current architecture this section reasons forward from
- §17 Caching & Performance, §21 Security — the specific mechanisms (ISR, rate limiting) discussed at each scale tier
- §22 Observability, §35 Technical Debt — the gaps that become genuinely urgent at higher scale
- §38 Interview-Level System Understanding — this section's reasoning is the basis for the Scalability interview-question answers there
