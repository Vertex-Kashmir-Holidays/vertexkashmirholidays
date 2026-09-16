# 05 — Repository Structure

> **What this section explains:** a folder-by-folder map of the codebase — what lives where, and why.
>
> **Confidence:** Confirmed from direct repository inspection and `.ai/instructions/architecture.md` §7 (Folder Responsibility). Note: `.ai/context/folder-structure.md` exists but is **empty** — a documentation gap in the team's own `.ai/` set (see §35, §40) — this section fills that gap from direct inspection.

---

## Top-level layout

```
vertexkashmirholidays/
├── .ai/                  Tool-agnostic engineering platform (context/instructions/adr/skills/workflows)
├── .github/workflows/    CI (ci.yml only)
├── .storybook/           Storybook config (main.ts, preview.tsx, msw-handlers.ts)
├── docs/                 Human-written docs: this set (engineering/), DESIGN_SYSTEM.md, analytics.md, dependency audit
├── eslint-rules/         One custom local ESLint rule (icon-only-control-needs-label.mjs)
├── prisma/               schema.prisma, migrations/, migrations_archive/, seed.ts
├── public/                Static assets, brand kit, uploaded-file fallback storage (public/uploads/ — dev only)
├── scripts/               Standalone tsx scripts (Google Ads token refresh, conversion-action creation)
├── src/                   Application code — see below
├── next.config.ts, tsconfig.json, tailwind.config.ts, eslint.config.mjs, vitest.config.ts
├── vercel.json             Vercel Cron declaration
├── .env.example             Template for every environment variable
├── CLAUDE.md, AGENTS.md      Point to .ai/ as the source of truth
└── CONTRIBUTING.md, README.md
```

## `src/app/` — routes, layouts, Route Handlers

Thin orchestrators only — fetch data, pass props, no business logic (`.ai/instructions/coding-standards.md` → Next.js Standards).

```
src/app/
├── (public)/          Route group — public marketing/booking site (no URL segment)
│   ├── tours/, destinations/, activities/, adventures/ (campaigns), blog/, careers/
│   ├── booking/(checkout)/, booking/success/, booking/failed/
│   ├── contact/, about/, faq/, reviews/, b2b-travel-partner-program/
│   ├── [slug]/         Catch-all — legal/static pages (terms, privacy, refund policy)
│   ├── layout.tsx      Fetches SiteSettings/HomeContent once, wires providers, injects sitewide JSON-LD
│   ├── sitemap.ts, robots.ts
├── admin/              Staff CRM — 37 module folders, 66 page.tsx files (§27)
│   ├── layout.tsx      Session check, RBAC resolution, AccessDenied gate
│   └── <module>/       page.tsx (list) + new/ + [id]/edit/ per the admin-crud.md pattern, varying by module
├── account/            Customer self-service portal — bookings/, payments/, requests/ (B2B), profile/, reviews/, change-password/
├── login/               Sign-in page
├── api/                 137 Route Handler files, ~185 handlers (§09) — grouped by domain folder
├── layout.tsx           Root layout — GTM script injection point
├── error.tsx, not-found.tsx   The only two special files of their kind in the repo (no per-route overrides, no global-error.tsx — see §23)
└── globals.css          Design-system CSS custom properties (§06)
```

## `src/components/` — presentation, organized by domain

```
src/components/
├── ui/                  Shared primitives (12 Radix-based: Button, Dialog, Select, Tabs, …) + molecules (ListSkeleton, FormSkeleton, HeroSkeleton, CardGridSkeleton, Skeleton atom, admin-search-input)
├── providers/            ThemeProvider, SiteSettingsProvider, SiteAnalytics, AttributionCapture — the small, deliberate set of Context providers (§03, §06)
├── admin/                 Per-module admin UI: bookings/, leads/, connect/, salary/, docs/, itinerary/, …
├── bookings/, leads/, tours/, contact/, account/, analytics/, seo/    Public/account-facing, domain-organized
└── layout/               Navbar, Footer, PublicChrome
```

## `src/lib/` — the combined application + domain + infrastructure layer

Cross-cutting utilities alongside per-domain subfolders:

```
src/lib/
├── prisma.ts             The one PrismaClient instance
├── auth.ts (server-only) / auth.config.ts (edge-safe)
├── rbac.ts (edge-safe constants) / permissions.ts (server-only, DB-backed)
├── ratelimit.ts, storage.ts, mail.ts, motion.ts, seo.ts, sanitize.ts, whatsapp.ts, analytics.ts
├── bookings/              finance.ts, commission.ts, commissionSync.ts, scope.ts, customer.ts, itineraryToServices.ts, cleanup.ts, invoice-pdf.tsx, …
├── payments/              gst.ts
├── leads/                 schema.ts
├── salary/                month.ts, compute.ts, prepare.ts, salary-slip-pdf.tsx
├── leave/                 entitlement.ts
├── security/              turnstile.ts, mfaTotp.ts, mfaCrypto.ts
├── offlineConversion/     service.ts, adapters/{google,meta,microsoft}.ts
├── admin/                 campaignSchema.ts, moduleGuard.ts, cache helpers
├── docs/                  linkSchema.ts
├── connect/                (Vertex Connect domain logic, if present as a folder — see §28)
└── pdf/                    InvoiceDocuments.tsx, SalarySlipDocument.tsx
```

## `src/types/` — shared TypeScript types

One file per domain (`tours.ts`, `campaign.ts`, `analytics.ts`, …) plus ambient module augmentation (`next-auth.d.ts`).

## Folders that deliberately do NOT exist

Per `.ai/instructions/architecture.md` §7, these are named, deliberate absences — not oversights:

| Folder | Status | Why |
|---|---|---|
| `src/hooks/` | Not yet real | Target for extracting the currently-duplicated hydration-mount-guard pattern; not built yet (§03, §35) |
| `src/schemas/` | Intentionally never created | A Zod schema lives beside the domain it validates (`lib/leads/schema.ts`) or inline in the route — a top-level `schemas/` folder would fight the domain-oriented organization of `lib/` |
| `src/actions/` | Not planned | Server Actions are not adopted (ADR 0001) — this folder would only exist if that architecture decision changed |

## `prisma/`

```
prisma/
├── schema.prisma          2,068 lines, 69 models, 32 enums (§08)
├── seed.ts                 3,158 lines — full local dev dataset
├── migrations/              23 folders, baseline + incremental (§08, §20)
└── migrations_archive/       Pre-baseline history, archived for reference only — not read by Prisma
```

## `docs/` (human-authored, outside `.ai/`)

```
docs/
├── engineering/            This documentation set
├── analytics.md            GTM/GA4 event reference (source for §13)
├── DESIGN_SYSTEM.md        Brand/color/type/spacing/motion tokens (source for §06)
└── DEPENDENCY_AUDIT_2026-07.md   Security audit baseline (source for §35)
```

## Related Documents

- `.ai/instructions/architecture.md` §7 — the folder-responsibility rules this map follows
- §06 Frontend Architecture, §07 Backend Architecture — how these folders are actually used at runtime
- §08 Database Architecture — `prisma/` in full detail
- §09 API Architecture — `src/app/api/**` in full detail
- §40 Documentation Maintenance — the empty `.ai/context/folder-structure.md` gap this section fills
