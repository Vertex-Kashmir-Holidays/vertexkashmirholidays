# 00 — Documentation Guide

> Vertex Kashmir Holidays — Engineering Documentation
> Version: 1.0.0 · Last updated: 2026-09-15

## What this is

This is the authoritative internal engineering reference for the Vertex Kashmir Holidays (VK) platform: one Next.js 16 application serving a public marketing/booking site, an internal CRM/admin panel, and a signed-in customer portal, backed by PostgreSQL (Neon) via Prisma.

It is written for:

- **A new engineer** who needs to go from "just joined" to "shipping a production change."
- **A senior engineer** who needs a precise technical reference — schema, routes, business rules, trade-offs.
- **DevOps/infra** who needs to understand hosting, deployment, and environments.
- **QA** who needs to understand what exists to test and what doesn't exist yet.
- **Product/business stakeholders** who need to understand system capabilities without code.
- **Anyone on call** who needs a runbook during an incident.
- **The primary maintainer**, to rehearse explaining this system's architecture, trade-offs, and decisions in a senior engineering interview (§38).

## Relationship to `.ai/`

This documentation set does **not** replace `.ai/` — the tool-agnostic engineering platform living at the repository root (`.ai/README.md` → `context/`, `instructions/`, `adr/`, `skills/`, `workflows/`). `.ai/` is written for a developer (human or AI) actively implementing a change and is the **source of truth** for coding standards, architectural principles, and business rules going forward. This `docs/engineering/` set is written for someone trying to *understand the system as a whole* — onboarding, interview prep, incident response, stakeholder communication — and is allowed to be longer, more explanatory, and more exhaustively cross-referenced than `.ai/` intentionally is.

Where the two overlap, this documentation cites `.ai/` rather than restating it, and defers to it as authoritative on *current engineering rules*. Where `.ai/instructions/*.md` describes a **target/aspirational** state (it says so explicitly — see `.ai/instructions/architecture.md` line 1–8 and `.ai/instructions/coding-standards.md` line 13–21), this documentation instead describes **what the repository actually does today**, flagging the gap where one exists.

## How this documentation is organized

One markdown file per numbered section, `docs/engineering/NN-slug.md`, mirroring the structure below. Every file begins with a **"What this section explains"** callout and a **Confidence** line stating how the content was verified (code, configuration, infrastructure, inference, or unconfirmed).

| # | Section | Covers |
|---|---|---|
| [00](00-documentation-guide.md) | Documentation Guide | This file |
| [01](01-system-overview.md) | System Overview | What VK is, in plain and technical language |
| [02](02-product-and-business-context.md) | Product & Business Context | Business model, users, objectives |
| [03](03-architecture.md) | Architecture | System-wide architecture, the ADR-backed decisions |
| [04](04-technology-stack.md) | Technology Stack | Every technology, version, and why it's used |
| [05](05-repository-structure.md) | Repository Structure | Folder-by-folder map of the codebase |
| [06](06-frontend-architecture.md) | Frontend Architecture | Routing, rendering, components, design system |
| [07](07-backend-architecture.md) | Backend Architecture | Request lifecycle, layering, domain logic |
| [08](08-database-architecture.md) | Database Architecture | Full schema, ER diagram, migrations |
| [09](09-api-architecture.md) | API Architecture | Full Route Handler inventory and conventions |
| [10](10-authentication-and-authorization.md) | Authentication & Authorization | NextAuth, RBAC, three-layer model |
| [11](11-third-party-integrations.md) | Third-Party Services & Integrations | Master integration inventory |
| [12](12-cms-and-content-architecture.md) | CMS / Content Architecture | How editable content is modeled and served |
| [13](13-analytics-and-tracking.md) | Analytics & Tracking | GTM/GA4/Meta/Google Ads, client + server |
| [14](14-crm-and-lead-management.md) | CRM & Lead Management | Lead pipeline, staff workflow |
| [15](15-media-storage-and-cdn.md) | Media / Storage / CDN | Cloudinary, image pipeline |
| [16](16-search.md) | Search | What search capability exists (and doesn't) |
| [17](17-caching-and-performance.md) | Caching & Performance | ISR, ratelimiting cache, bundle strategy |
| [18](18-infrastructure-and-hosting.md) | Infrastructure & Hosting | Vercel, Neon, DNS, CDN |
| [19](19-environments-and-configuration.md) | Environments & Configuration | Every environment, every env var |
| [20](20-cicd-and-deployment.md) | CI/CD & Deployment | GitHub Actions, deploy pipeline, rollback |
| [21](21-security.md) | Security | Auth, secrets, headers, CSP, abuse controls |
| [22](22-observability-and-monitoring.md) | Observability & Monitoring | What exists, what doesn't |
| [23](23-error-handling.md) | Error Handling | Frontend/backend error conventions |
| [24](24-testing-and-qa.md) | Testing & QA | Current test tooling and coverage reality |
| [25](25-data-flows.md) | Data Flows | End-to-end flow diagrams |
| [26](26-core-business-flows.md) | Core Business Flows | Lead→booking→payment, sequence diagrams |
| [27](27-admin-and-dashboard-architecture.md) | Admin / Dashboard Architecture | Every admin module, RBAC wiring |
| [28](28-background-jobs-cron-webhooks.md) | Background Jobs / Cron / Webhooks | Every scheduled/async process |
| [29](29-external-apis.md) | External APIs | Inbound/outbound third-party API contracts |
| [30](30-seo-and-web-performance.md) | SEO & Web Performance | Metadata, sitemap, Core Web Vitals |
| [31](31-disaster-recovery-and-backup.md) | Disaster Recovery & Backup | What backup/recovery exists today |
| [32](32-operational-runbooks.md) | Operational Runbooks | Step-by-step incident playbooks |
| [33](33-troubleshooting.md) | Troubleshooting | Symptom → cause → fix matrix |
| [34](34-architecture-decision-records.md) | Architecture Decisions / ADRs | The `.ai/adr/` log, explained |
| [35](35-technical-debt.md) | Technical Debt & Known Limitations | Prioritized, with source |
| [36](36-scalability.md) | Scalability & Future Architecture | Growth curve, first bottlenecks |
| [37](37-developer-onboarding.md) | Developer Onboarding | Zero to first production PR |
| [38](38-interview-preparation.md) | Interview-Level System Understanding | How to explain VK in a senior interview |
| [39](39-glossary.md) | Glossary | Every technical and business term used |
| [40](40-documentation-maintenance.md) | Documentation Maintenance | How this set stays accurate |

## How to read this if you only have five minutes

Read §01 (System Overview) and the "VK at a Glance" quick-reference table inside it, then jump to whichever numbered section matches your actual question.

## Confidence levels used throughout

Every major claim in this documentation set is implicitly or explicitly tagged with one of:

- **Confirmed from code** — read directly from source in this repository.
- **Confirmed from configuration** — read from `.env.example`, `vercel.json`, `next.config.ts`, CI workflows, etc.
- **Confirmed from `.ai/`** — stated in the team's own curated engineering docs (`.ai/context/`, `.ai/adr/`, `.ai/instructions/`).
- **Inferred** — a reasonable conclusion from the above, explicitly labeled as an inference, not a directly-observed fact.
- **Requires verification** — cannot be confirmed by reading this repository alone (e.g. a Vercel-dashboard-only setting, a third-party console configuration).
- **Not implemented** — explicitly confirmed absent, stated so nothing is assumed to exist that doesn't.

Nothing in this documentation set is invented. Where the actual repository state conflicts with what `.ai/` states (this happened at least once — see §24 and §35), this documentation follows the repository, and the conflict is called out explicitly rather than silently resolved.

## Documentation Confidence & Source of Truth

Per-area summary of how each major part of this documentation set was verified. This is the single consolidated view; each section's own header line states the same thing in local detail.

| Area | Basis |
|---|---|
| Business rules, product context (§02) | Confirmed from `.ai/context/business-rules.md`, `.ai/context/project-overview.md` |
| Architecture, ADRs (§03, §34) | Confirmed from `.ai/adr/*.md` (read in full) and `.ai/context/architecture-overview.md` |
| Technology stack (§04) | Confirmed from `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` (read directly) |
| Repository structure (§05) | Confirmed from direct inspection — fills a gap left by an empty `.ai/context/folder-structure.md` |
| Frontend, backend architecture (§06, §07) | Confirmed from `.ai/instructions/architecture.md`/`coding-standards.md` plus direct route/component research |
| Database schema (§08) | Confirmed from `prisma/schema.prisma` (2,068 lines, read in full) and `prisma/migrations/` |
| API inventory (§09, §29) | Confirmed from direct inspection of all 137 route files under `src/app/api/**` |
| Auth & RBAC (§10, §21, §27) | Confirmed from `src/lib/rbac.ts`, `permissions.ts`, `src/proxy.ts`, `src/app/admin/layout.tsx` (read in full) |
| Third-party integrations (§11, §13, §15) | Confirmed from `.ai/adr/0005`, `.ai/context/tech-stack.md`, and direct adapter/route code inspection |
| CMS/content (§12) | Confirmed from schema model inspection — no external CMS product exists |
| CRM/lead management (§14, §26) | Confirmed from `.ai/context/business-rules.md` and direct route/schema research |
| Search (§16) | **Confirmed absent** by direct grep/dependency check |
| Caching, infra, environments, CI/CD (§17–§20) | Confirmed from `next.config.ts`, `vercel.json`, `.env.example`, `.github/workflows/ci.yml` |
| Observability (§22) | Mostly **confirmed absent**; Vercel/Neon dashboard-level facts marked **requires verification** |
| Testing (§24) | Confirmed from `package.json`/`.storybook/`/`vitest.config.ts` — corrects a stale `.ai/` claim |
| Background jobs (§28) | Confirmed from `vercel.json` and all three `src/app/api/cron/**` route files, including their own explanatory code comments |
| SEO (§30) | Confirmed from `sitemap.ts`, `robots.ts`, `src/lib/seo.ts`, `src/components/seo/JsonLd.tsx` |
| Disaster recovery (§31) | Mostly **requires verification** — Neon/Vercel dashboard settings not inspectable from this repository |
| Runbooks, troubleshooting (§32, §33) | **Synthesized** from confirmed mechanics elsewhere in this set, not separately sourced |
| Technical debt (§35) | Every item traces to a specific citation elsewhere in this set — nothing freestanding |
| Scalability (§36) | Explicitly **inferred** — reasons forward from confirmed architecture, does not report measured load-test results |
| Onboarding, interview prep, glossary (§37–§39) | **Synthesized** from the rest of this documentation set |

## Related documents

- `.ai/README.md` — the engineering platform this documentation set complements.
- `.ai/START.md` — required reading before implementing any change.
- §40 Documentation Maintenance — how this set is kept in sync with the repository.
