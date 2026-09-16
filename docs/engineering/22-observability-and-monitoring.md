# 22 — Observability & Monitoring

> **What this section explains:** what actually exists to see inside a running production system — and, in more direct terms than most sections, what doesn't.
>
> **Confidence:** Confirmed absent by direct dependency inspection (§04 research) and confirmed present by direct code inspection of logging call sites and the Lighthouse CI config.

---

## Quick Reference — honest status

| Capability | Status |
|---|---|
| APM / error tracking (Sentry, etc.) | **Not implemented** — confirmed absent |
| Structured/centralized logging | **Not implemented** — stated target, `console.log`/`console.error` today |
| Uptime monitoring | **Not confirmed in repository** — likely a Vercel-dashboard-level feature if enabled at all; requires verification |
| Database monitoring | **Requires verification** — Neon's own dashboard provides connection/query metrics, not inspectable from this repo |
| Log aggregation | **Not implemented** — Vercel's own function logs are the only log destination, not aggregated/searchable beyond the Vercel dashboard |
| Alerting | **Not confirmed** — no alerting config found in the repository |
| Performance measurement | **Partially implemented** — Lighthouse CI collects but doesn't enforce budgets (§17, §30) |
| Health check endpoint | **Not confirmed** — no dedicated `/api/health` or similar route found in the §09 route inventory |

## What actually exists today

- **Vercel's own platform logging**: every serverless function invocation's `console.log`/`console.error` output is captured by Vercel and viewable in its dashboard/CLI (`vercel logs`). This is real and is, today, the primary way to see what happened during a specific request in production — but it is not searchable/aggregated/alerting, just a log stream.
- **`PaymentAudit`** (§08) — an append-only database table of Razorpay gateway events (order creation, signature verification, webhook events). This is the closest thing to a durable audit trail for the single highest-stakes integration (payments) — deliberately narrow in scope, not a general application event log.
- **`AuditLog`** (§08, §21) — role changes, permission edits, user lifecycle, salary/leave lifecycle, B2B agent status changes. Also narrow by design — an admin-action audit trail, not a technical observability tool.
- **`OfflineConversion.attempts`/`lastError`** — the one place a failure is durably recorded with enough detail to debug without digging through ephemeral function logs.
- **Lighthouse CI** (`.lighthouserc.js`) — collects Core Web Vitals/Lighthouse scores against 9 URLs, 3 runs each, uploaded to `./.lighthouseci` (filesystem target, not a hosted dashboard). **No `assert` budget block is configured** — it measures and stores results but does not fail a build or alert on regression today.

## What genuinely does not exist

- No error-tracking SDK anywhere — a runtime exception in a Route Handler that isn't explicitly caught and logged produces, at best, a Vercel function log entry that nobody is proactively watching, and at worst, a silent 500 with no record beyond that ephemeral log.
- No APM (no distributed tracing, no latency percentile dashboards beyond whatever Vercel's own platform-level analytics provide).
- No alerting — nothing pages anyone when an error rate spikes, a cron job fails silently, or the database approaches a connection limit.
- No log aggregation across function invocations — correlating "what happened across these 5 requests for this one booking" means manually searching Vercel's raw log stream by timestamp, not querying a structured log store.

## Where an engineer should actually look first, today

Given the above, an incident-response reality (expanded fully in §32/§33):

1. **Vercel dashboard → Deployments → Functions/Logs** — the primary window into what a specific request actually did.
2. **The relevant database table** — `PaymentAudit` for a payment issue, `AuditLog` for an admin-action question, `OfflineConversion` for a marketing-attribution issue, `LeadActivity` for a lead-history question.
3. **Neon's own dashboard** — for anything database-performance-shaped (slow queries, connection saturation) — not visible from application code or this repository.
4. **GTM's Preview mode / GA4 Realtime** — for anything analytics-shaped, since there's no server-side event log for client-side tracking.

## Why this matters for §36 (Scalability) and §38 (Interview Prep)

A small, solo/near-solo engineering team operating without APM or alerting is a normal, reasonable trade-off at VK's current traffic and team size — not a mistake to be embarrassed about. It becomes a real risk the moment traffic, team size, or the cost of an undetected outage grows meaningfully — this is one of the clearest, most concrete "what would you add first" answers for a scalability or interview discussion about this system (§36, §38), precisely because the current gap is well-understood and easy to point to rather than vague.

## Related Documents

- §07 Backend Architecture — the current `console.log`-based logging convention, in context
- §17 Caching & Performance, §30 SEO & Web Performance — what Lighthouse CI does measure
- §32 Operational Runbooks, §33 Troubleshooting — the practical "where to look" procedures this section informs
- §35 Technical Debt — observability gaps, prioritized
- §36 Scalability — when this gap becomes a real bottleneck
