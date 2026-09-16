# 38 — Interview-Level System Understanding

> **What this section explains:** how to explain VK technically in a senior/top-tier engineering interview — grounded entirely in VK's actual architecture, not generic system-design answers. Every question below follows: short answer → detailed explanation → VK-specific implementation → trade-offs → likely follow-ups.
>
> **Confidence:** Synthesized from every section of this documentation set — cited inline. The goal is understanding, not a script to memorize.

---

## Architecture

### "Explain VK's architecture."

**Short answer**: One Next.js 16 application, three route-group surfaces (public/account/admin) sharing one PostgreSQL database, with a strict one-directional data flow: UI → Route Handler → domain function → Prisma → Postgres. No microservices, no Server Actions, no message queue.

**Detailed explanation**: VK is a monolith by deliberate choice, not by accident of scale. The App Router's route groups (`(public)`, `admin`, `account`, `login`) give three logically distinct surfaces without the operational cost of three separate deployments — one database migration, one CI pipeline, one deploy. Every mutation goes through an explicit HTTP boundary (a Route Handler under `src/app/api/**`) where Zod validation and RBAC authorization are structurally forced to run, rather than through Next.js Server Actions, which the team deliberately rejected (ADR 0001) specifically to avoid two competing mutation styles in a codebase where money and PII are at stake.

**VK-specific implementation**: §03 has the full request-flow diagram. The three surfaces are distinguished purely by auth requirement and query filter (public: `published:true`, no auth; account: `userId` scoped; admin: `requirePermission` per module) — not by different code or different infrastructure.

**Trade-offs**: A monolith means one bad deploy can affect all three surfaces simultaneously — there's no isolating a public-site bug from an admin-panel bug at the infrastructure level. The upside is enormous operational simplicity for a small team: one `git push`, one migration history, one set of environment variables, shared code for shared concepts (RBAC, Prisma models) with zero cross-service API overhead.

**Follow-ups an interviewer might ask**: "When would you split this into services?" → §36's answer: at genuinely large scale (1M+ users/day), the admin CRM's traffic profile diverges enough from the public site's that separating them becomes a legitimate question — not before. "Why not Server Actions, given they're the Next.js-native pattern?" → ADR 0001's actual reasoning: an explicit HTTP boundary is easier to secure and review consistently than a mutation callable from anywhere.

### "Why was this architecture chosen?"

**Short answer**: Small team, real money and PII at stake, and a strong preference for one predictable pattern over framework-native flexibility.

**VK-specific implementation**: Every one of the six ADRs (§34) reduces to the same underlying value: **predictability over cleverness**. Route Handlers over Server Actions (one mutation style), Prisma+Neon with a hard dev/prod split (no accidental prod writes), three-layer auth (no single point of failure), server-computed pricing (the browser is never trusted with money), the adapter pattern (a missing credential never crashes a request), and domain-logic centralization (a number is computed once, not twice).

**Trade-offs**: This is a conservative architecture, not a maximally scalable or maximally flexible one. It optimizes for a small, AI-assisted engineering team shipping safely and quickly, not for handling extreme scale from day one — and that's the right trade-off for VK's actual current constraints (§36).

### "What happens when a user opens the homepage?"

Walk through §06's sequence diagram: Edge Middleware checks the path (`/` doesn't need auth, so it skips NextAuth's session machinery entirely — this is deliberate, to keep the page ISR-cacheable), gets a static CSP, hits the RSC which — on a cache miss/stale-revalidate — fetches `SiteSettings`, `HomeContent`, active banners, and categories in parallel inside `(public)/layout.tsx`, renders HTML with the sitewide `TravelAgency` and homepage-only `WebSite` JSON-LD injected, and streams it to the browser, which then hydrates only the interactive islands (nav, analytics tracker) — most of the homepage never becomes client-side JavaScript at all.

### "How does a tour page load?"

Same shape as above, plus: the `[slug]` dynamic segment resolves a specific `Tour` row (filtered `published:true`), `generateMetadata()` calls `buildMetadata()` for SEO, `TouristTrip`/`Product` JSON-LD is built from the tour's data, and a client-side `PackageViewTracker` fires `trackPackageView()` on mount (§13) — the one piece of this page that's genuinely client-side beyond the booking/inquiry sidebar itself.

### "How does a lead submission work?"

This is §26 Flow 1 in full — the interviewer-friendly version: Turnstile and rate-limiting are checked **before** the request body is even parsed (cheapest-path rejection of abuse), then a 15-day active-duplicate check runs, then the `Lead` row is created at `status: NEW`. Nothing fires an ad-platform conversion at this point — that only happens later, at conversion, because the business only wants to pay for a *real* signal (a booking with money against it), not every top-of-funnel enquiry (§13's "one real signal" rule).

### "How does data flow through the system?"

One direction, always: Browser → UI → (for a mutation) `fetch()` in `useTransition()` → Route Handler → Zod validate → authorize → domain function → Prisma `$transaction` if multi-step → Postgres. UI never reaches around this to call Prisma directly — this is enforced by convention (only Route Handlers and Server Components import `@/lib/prisma`) and is one of the clearest, most consistently-applied rules in the whole codebase.

---

## Database

### "Why this database?"

**Short answer**: PostgreSQL via Prisma, hosted on Neon (serverless Postgres), with a hard dev/prod split.

**Detailed explanation**: Postgres gives real relational integrity for a genuinely relational domain — bookings have payments have GST, leads have activities have attribution, users have roles have permissions. Prisma gives end-to-end type safety from schema to query result, which matters a lot in a codebase with this much financial logic (a typo'd field name becomes a compile error, not a runtime bug in a payment calculation). Neon specifically (vs. self-managed Postgres or another provider) gives serverless-friendly connection characteristics that pair naturally with Vercel's serverless compute model.

**VK-specific implementation**: 69 models, 32 enums, 23 migrations, zero raw SQL usage anywhere (§08) — everything goes through Prisma's parameterized query builder, which also happens to make SQL injection structurally near-impossible.

**Trade-offs**: A single database serving public reads, account reads, and admin writes means they all compete for the same connection pool — fine at current scale, a real scaling question later (§36). No read replica exists today.

### "What are the important entities?"

`User` (staff and customers share one table, distinguished by `role`), `Lead` (every enquiry, source of the whole funnel), `Booking` (the financial/operational core), `BookingPayment` (the payment ledger — append-only rows, not a single mutable balance field), `BookingService` (line items), `Itinerary` (the trip plan, links exclusively to a Lead or a Booking, versioned via `ItineraryHistory`), `Tour`/`Destination`/`Activity` (the public catalog), `BookingCommission`/`SalaryRecord` (the sales-to-payroll chain). Full ER diagram in §08.

### "How are relationships modeled?"

Mostly straightforward foreign keys, with two patterns worth calling out specifically because they reveal real design thinking: (1) `Itinerary` has **two separate optional unique foreign keys** (`leadId`, `bookingId`), used mutually exclusively — an itinerary belongs to exactly one of a Lead or a Booking, never both, enforced by the uniqueness constraints rather than a single polymorphic reference; (2) `BookingCommission.rateSnapshotPct` is a **frozen snapshot**, not a live foreign-key lookup to the employee's current rate — a deliberate denormalization so a later rate change never retroactively alters an already-computed commission.

### "Where could database bottlenecks occur?"

Connection pool saturation under serverless-function burst load is the most likely first-order bottleneck (§36) — this is a known characteristic of the Next.js+Prisma+serverless combination generally, not specific to a VK mistake. The public catalog's `groupBy` queries (tour categories, sitemap generation) and the admin Dashboard's revenue aggregation are the heavier read queries in the system today; neither is confirmed to be a current problem, but they're the first places to look if one emerges.

---

## Backend

### "How is business logic organized?"

`src/lib/<domain>/` — never inside a component, and (per the target architecture) never inline in a Route Handler for anything with real logic. `computeBookingFinance`, `resolveGst`, `computeChargeable` are the single source of truth for every money calculation in the entire system (ADR 0006, §07, §26) — this is the concrete answer to "how do you prevent a discount being calculated differently in two places," which is exactly the kind of question this organization exists to make unaskable.

### "How are errors handled?"

Deliberately narrow error boundaries on the frontend (2 files total, no per-route overrides, no `global-error.tsx` — §23), consistent-but-not-fully-standardized status codes on the backend (429 is fully standardized via `tooManyRequests()`; validation-failure codes are not, a named tracked gap), and a strict rule that non-critical failures (a notification email) never fail the primary operation (a successful booking) — caught and logged instead. This is a good interview answer because it's **honest about the gap** (no `global-error.tsx`) rather than claiming perfect coverage — that honesty is itself a signal of engineering maturity worth demonstrating.

### "How are third-party failures handled?"

The adapter pattern (ADR 0005) — every integration has an `isConfigured()` guard and no-ops gracefully when unconfigured, so a missing credential never crashes a request. For a genuine live failure (not just unconfigured), the only durable retry mechanism in the whole codebase is `OfflineConversion.attempts`/`lastError` (§28) — everything else fails once, gets caught and logged, and doesn't automatically retry. This is a good place to demonstrate you understand the difference between "gracefully degrading when unconfigured" and "resiliently retrying a live failure" — VK does the former everywhere and the latter in exactly one place.

---

## Frontend

### "Why this frontend framework?"

Next.js 16's App Router gives Server Components by default, which matters a lot for a marketing-heavy public site (fast, minimal client JS) that also needs a stateful, interactive admin CRM in the same codebase — RSC lets each page decide its own rendering strategy rather than forcing a sitewide CSR-vs-SSR choice.

### "SSR vs. CSR vs. SSG?"

VK uses all three, deliberately per-context, not one dogmatically: **ISR** (a hybrid of SSG+SSR) for published public content (`revalidate=300`) — fast like static, freshens itself like server-rendered; **`force-dynamic`** (true SSR, every request) for anything session- or real-time-dependent (admin, account, booking pages); **CSR** only for genuinely interactive islands hydrated on top of server-rendered HTML (forms, admin tables, the booking checkout widget) — never for a whole page.

### "How is performance handled?"

`next/image`+`sharp` for images, lazy-loaded heavy dependencies (`next/dynamic({ssr:false})` for the admin chart and PDF export), bundle analysis on demand, and a design-system token discipline that prevents the kind of CSS bloat that comes from hundreds of one-off arbitrary Tailwind values (§06's design-system section is a genuinely good story here — a documented, deliberate normalization from ~35 arbitrary font sizes down to a clean even-step scale). Honest caveat worth stating in an interview: Lighthouse CI measures but doesn't enforce a budget today (§30, §35) — a real, nameable gap.

### "How is SEO implemented?"

A single `buildMetadata()` helper enforced project-wide (never a raw `Metadata` object), a graph-based JSON-LD structured-data system anchored on one canonical Organization `@id` (with a real historical fix — `WebSite` schema moved from sitewide to homepage-only per Google's own guidance, visible in the code comments), an hourly-revalidated sitemap that deliberately avoids re-querying the database on every crawler hit, and host-aware `robots.ts` plus an `X-Robots-Tag` header working together as two independent layers to keep preview URLs out of search indexes. Full detail in §30.

---

## Integrations

### "Why use a CMS?"

VK doesn't use an external CMS at all — content lives in the same Postgres database as bookings, edited through the same admin panel (§12). This is worth stating directly and confidently in an interview: it's a deliberate simplicity choice consistent with the "one database, one data-access path" philosophy (ADR 0002/0006), not a gap.

### "Why use GA4?"

Standard web-analytics tooling, but the more interesting VK-specific answer is the **split between client-side and server-side tracking** (§13) — GA4/GTM/Meta Pixel for on-page behavior, entirely separate server-side Meta CAPI/Google Ads uploads for actual conversions, specifically because client-side pixels are unreliable against ad-blockers and Safari ITP. This is a good opportunity to show you understand *why* server-side conversion tracking exists as a category, not just that VK has it.

### "How does CRM integration work?"

There is no external CRM — VK's admin panel **is** the CRM (§14, §27), built on the same Lead/Booking/User models as everything else. Worth flagging as a deliberate choice, and a good segue into discussing the trade-off: no vendor lock-in or per-seat CRM licensing cost, at the cost of not getting a mature CRM vendor's out-of-box reporting/automation features.

### "What happens if a third-party service goes down?"

Depends which one, and this is a good chance to show nuanced understanding rather than one blanket answer: Razorpay down → online payments fail, but staff can record payments manually/offline, so the business doesn't fully stop (§14, §32). Cloudinary down/misconfigured → uploads silently fail to persist correctly in production (the one integration where "unconfigured" is a real outage risk, not a benign feature-off state — §11, §15). GTM/analytics down → no tracking, but the site itself is completely unaffected (§13). This differentiated answer — not every integration fails the same way — is the actual point worth making.

---

## Security

### "How are secrets handled?"

Plain environment variables (Vercel dashboard + local `.env`), with **no dedicated secrets manager** — a real, named gap, not hidden in this documentation (§21, §35). Worth being upfront about this in an interview rather than overselling the security posture — the honest framing is "reasonable for current scale, a real next step at a larger team/scale."

### "How are APIs protected?"

Three independent layers (§10) — edge middleware (coarse), admin layout (UX gate), and `requirePermission` in the Route Handler (the actual enforcement) — with the explicit design principle that UI visibility is never treated as authorization. Every mutating verb (GET/POST/PATCH/DELETE) is individually guarded — a passing check on one never implies another is protected.

### "How would you prevent abuse of lead endpoints?"

This is directly answerable from VK's actual implementation, which is a strong interview position (not hypothetical): rate limiting checked *before* body parsing (cheapest-path rejection), Cloudflare Turnstile bot-challenge, and a business-logic-level duplicate-prevention rule (same phone/email, active status, 15-day window) that also happens to reduce spam pressure as a side effect of a rule that primarily exists for a business reason, not a security one. Good interview material: security and business logic aren't always separate concerns.

---

## Scalability

### "What breaks first at 10x traffic?"

Per §36's actual reasoning: the database connection pool under serverless-function burst concurrency, and the in-memory rate-limiter fallback becoming ineffective if Upstash isn't already configured (per-instance memory doesn't coordinate across Vercel's concurrent instances).

### "How would you scale the database?"

Read replicas for the public site's read-heavy queries, keeping the CRM's writes on the primary — not built today, a genuine architecture decision (ADR candidate) at the point it's actually needed, not before.

### "Where would caching be introduced?"

ISR already caches most public reads (§17) — the next caching layer, if needed, would likely be a more aggressive CDN/edge strategy or a dedicated cache in front of the heavier aggregate queries (Dashboard revenue chart, category `groupBy`s), not a wholesale re-architecture.

### "When would queues be needed?"

At the point background work (offline-conversion processing, stale-booking cleanup) stops being reasonably piggybacked on real request traffic — today, both are handled inline/immediately rather than through a queue, which is fine at current volume and a real limitation at much higher volume (§28, §36).

---

## Reliability

### "How would you detect production failures?"

Honestly: today, primarily through Vercel's own function logs and user reports — there's no APM/alerting (§22). This is the single most useful "what would you add first" answer in this entire interview-prep section, precisely because it's concrete and the reasoning ("no APM, no alerting, confirmed absent") is directly citable rather than a vague gesture at "better monitoring."

### "How would you recover from database failure?"

Also honestly: this is the weakest-documented area of the whole system (§31) — Neon's backup/PITR configuration isn't verifiable from the repository, and no tested restore procedure exists. The strong interview answer here isn't pretending this is solved — it's correctly identifying it as the highest-value gap to close, and explaining *why* (it's the one item that would matter most in an actual worst-case scenario).

### "How would you handle third-party outages?"

Point back to the differentiated Integrations answer above — the honest answer is "it depends which service," with Razorpay's offline-payment fallback as the best concrete example of designed-in resilience (a human workaround baked into the business process, not just a technical retry).

---

## Architecture trade-offs

### "What would you change if rebuilding VK?"

A genuinely good answer here should be specific, not a generic "add more tests" — options actually grounded in this documentation: wire the already-installed Storybook/Vitest tooling into CI as a real merge gate (§24, §35); add a database connection pooler proactively rather than reactively (§36); add basic APM from day one, since it's cheap early and expensive to retrofit under load (§22).

### "What is currently over-engineered?"

Arguably nothing dramatically — this codebase's own stated philosophy explicitly avoids premature abstraction (`.ai/instructions/coding-standards.md`), and the evidence supports it: no message queue, no microservices, no premature caching layer beyond ISR. If pressed, the Three.js hero mode (`HeroR3F`, currently orphaned/unused, §03/§17) is the closest candidate — built, then not actually shipped anywhere.

### "What is under-engineered?"

Observability (§22) and disaster recovery (§31) are the two honest, well-evidenced answers — both are reasonable gaps at current scale and genuinely load-bearing gaps to close before scale or team size grows meaningfully.

### "What technical debt exists?"

Point to §35's full prioritized list — the strongest interview answer references the **specific, sourced** items (stale `.ai/` docs on testing tooling, no CI test step despite tooling existing, admin audit-log coverage not exhaustively verified) rather than generic technical-debt platitudes.

### "Which architectural decision would you reconsider?"

A fair, defensible answer: the missing ADRs for hosting/media/payment-gateway choice (§34, §35) — not because those choices were wrong, but because their reasoning is only reconstructable secondhand rather than captured as a formal record, which becomes a real cost the next time someone has to defend or revisit one of them.

## Related Documents

Every answer above cites its source section — use those for the full depth behind each short/detailed/trade-off/follow-up structure. This section's purpose is to teach the underlying system, not to be memorized verbatim; an interviewer's actual follow-up question will rarely match this document exactly, so understanding *why* each answer is true (via the cited section) matters more than the words themselves.
