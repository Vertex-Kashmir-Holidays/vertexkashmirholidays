# 18 — Infrastructure & Hosting

> **What this section explains:** where VK actually runs — hosting, compute, database, CDN, DNS — and the shape of that infrastructure in local, preview, and production environments.
>
> **Confidence:** Confirmed from configuration (`vercel.json`, `next.config.ts`, `.env.example`) and `.ai/context/tech-stack.md` → Deployment. No infrastructure-as-code repo exists — hosting is configured through the Vercel dashboard, which cannot be inspected directly from this repository; anything about dashboard-only settings is marked "Requires verification."

---

## Quick Reference

| Layer | Provider | Notes |
|---|---|---|
| Hosting / compute | **Vercel** | Serverless Functions (Node runtime) + Edge Middleware |
| Database | **Neon** (managed PostgreSQL) | Two separate databases — dev and prod |
| DNS | **Bluehost DNS** | Per `.ai/context/tech-stack.md` |
| CDN | **Vercel Edge Network**, and **Cloudflare** "where applicable" | Cloudflare is also the Turnstile vendor |
| Media storage | **Cloudinary** | Production-only; local filesystem fallback in dev |
| Source control / CI | **GitHub** + **GitHub Actions** | `main` = production, `dev` = integration |
| Scheduled jobs | **Vercel Cron** | One job declared: `/api/cron/connect-retention`, daily 02:00 UTC |
| Secrets | Plain environment variables (Vercel dashboard + local `.env`) | No dedicated secrets manager — **confirmed absent** |

## No container orchestration, no IaC repo

There is no Docker/Kubernetes anywhere in this repository, no self-managed VM, and no separate application server — Vercel's managed serverless platform is the entire compute layer. There is also no Terraform/Pulumi/CloudFormation — infrastructure is configured directly through the Vercel and Neon dashboards, which this documentation set cannot inspect and marks accordingly.

**This is an architectural characteristic worth naming explicitly** (relevant to §36 Scalability and §38 Interview Prep): VK scales horizontally "for free" up to Vercel's serverless limits, but is also bound by Vercel's per-function constraints — e.g. the ~4.5MB request-body limit, which already forced a direct browser→Cloudinary signed-upload path for large files (`POST /api/uploads/sign`, §09) rather than routing them through a Route Handler.

## Hosting architecture, by environment

**Local development**

```
Developer machine
  └─ next dev (Node)
       ├─ Local Postgres or a personal Neon dev branch (DATABASE_URL)
       └─ Every optional integration no-ops unless its env vars are set locally
```

**Production**

```
vertexkashmirholidays.com  (Bluehost DNS → Vercel)
  └─ Vercel Edge Network / CDN
       ├─ Edge Middleware (src/proxy.ts) — CSP, auth gate, robots header
       ├─ Serverless Functions — Route Handlers, dynamic/SSR pages
       ├─ ISR cache — public content pages (revalidate=300)
       └─ Vercel Cron — /api/cron/connect-retention (daily)
  └─ Neon PostgreSQL (production database)
  └─ Cloudinary (media)
  └─ Upstash Redis (rate limiting, if configured)
  └─ External APIs: Razorpay, Google (OAuth/Ads/Places), Meta CAPI, JaaS, SMTP
```

## Domain canonicalization

The default `*.vercel.app` alias host **permanent-redirects (308)** to `vertexkashmirholidays.com` (`next.config.ts` → `redirects()`) — both because Vercel always keeps the `.vercel.app` alias live alongside a custom domain, and because session cookies are host-specific (`trustHost` in `auth.config.ts`) — serving auth traffic from two hosts would fragment sessions. There is also a `/campaign` → `/adventures` legacy-rename redirect with host-scoped variants.

Branch-preview random-hash `*.vercel.app` URLs are deliberately **not** redirected (that would break preview QA) — instead, `src/proxy.ts` adds `X-Robots-Tag: noindex, nofollow` to any request whose `Host` header isn't the literal production domain, so a preview URL stays reachable but is never indexed. `robots.ts` independently returns a blanket `disallow: "/"` on any non-production host, as a second layer of the same protection (§30).

## CDN & Image Delivery

- **Vercel Edge Network** serves the app and its ISR-cached pages globally.
- **Cloudflare** is used "where applicable" (per `.ai/context/tech-stack.md`) and is the vendor behind Turnstile bot protection (§21) — its exact scope as a CDN layer in front of Vercel is not independently confirmed from this repository and is marked **requires verification**.
- Image optimization runs through `next/image` (AVIF/WebP, 31-day `minimumCacheTTL`) with `remotePatterns` allowing the configured placeholder-image host, `res.cloudinary.com`, and `i.ytimg.com` (YouTube thumbnails). SVGs are allowed (`dangerouslyAllowSVG: true`) with a locked-down `contentSecurityPolicy` on the image-serving endpoint itself (`default-src 'self'; script-src 'none'; sandbox;`).

## Database Infrastructure

Neon (serverless PostgreSQL) — **two entirely separate databases**, development and production, never automatically synced. Full schema and migration detail in §08; production migration safety procedure in §31/§32.

## No IaC, no orchestration — what that means operationally

Every infrastructure change (a new environment variable, a Vercel Cron entry, a domain/DNS change) is a **manual dashboard action**, not a reviewable pull request. This is a real operational characteristic to know before an incident: there is no `terraform plan`-style diff to review before an infra change takes effect, and no version-controlled record of what the Vercel/Neon/Cloudflare dashboards currently say. See §35 for this as a named technical-debt item and §32 for how to work around it during an incident.

## Related Documents

- §19 Environments & Configuration — every environment variable, in full
- §20 CI/CD & Deployment — the exact deploy pipeline
- §31 Disaster Recovery, §32 Operational Runbooks — production safety procedures
- §36 Scalability — the serverless-model implications at higher traffic
- §35 Technical Debt — the no-IaC gap
