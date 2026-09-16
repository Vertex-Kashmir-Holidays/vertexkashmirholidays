# 37 — Developer Onboarding

> **What this section explains:** a complete path from "just joined" to "ready to make a production change" — prerequisites, local setup, and where to go next.
>
> **Confidence:** Confirmed from `.ai/START.md`, `.ai/README.md`, `package.json` scripts, and `.env.example`.

---

## Step 0 — Read in this order (per `.ai/START.md`)

1. `.ai/README.md`
2. `.ai/context/project-overview.md`, `business-rules.md`, `tech-stack.md`, `architecture-overview.md` (§02, §03, §04 of this documentation set are a parallel, more exhaustive read)
3. `.ai/instructions/coding-standards.md`, `architecture.md`, `git-workflow.md`
4. The relevant `.ai/workflows/*.md` entry for your task type (feature/bugfix/hotfix/refactor)
5. The relevant `.ai/skills/*.md` entry if one matches your task's shape (admin CRUD, API route, migration, analytics event, booking finance, CRM ticket)

This documentation set (`docs/engineering/`) is meant to run **alongside** `.ai/`, not replace it — see §00's explanation of the relationship. Use `.ai/` for "how do I build this," use this set for "how does the whole system fit together."

## Step 1 — Prerequisites

- Node.js (the CI workflow uses Node 24 — match it locally)
- Yarn Classic (`1.22.22` — confirmed the only lockfile in the repo; do not introduce npm/pnpm lockfiles)
- A PostgreSQL instance — either local Postgres or a personal Neon dev-branch connection string (**never** the shared production database, §08)
- Git, a GitHub account with repo access

## Step 2 — Repository setup

```bash
git clone <repo>
cd vertexkashmirholidays
yarn install
```

## Step 3 — Environment variables

```bash
cp .env.example .env.local
```

Fill in **only the sections relevant to the feature you're touching** — `.env.example`'s inline comments say exactly where to obtain each credential (§19). The only two hard requirements to boot the app at all: `DATABASE_URL` and `AUTH_SECRET` (generate the latter with `npx auth secret`). Every other integration degrades gracefully when unset (ADR 0005) — you do not need Razorpay, Cloudinary, or any other third-party credential just to run the app locally and see most of it work.

## Step 4 — Local database

```bash
yarn db:push      # or yarn db:migrate if you want a recorded migration
yarn db:seed       # tsx prisma/seed.ts — full local dev dataset (§08)
```

The seed creates SUPERADMIN accounts and a realistic content/booking/lead dataset — enough to explore every admin module without manually creating records.

## Step 5 — Run it

```bash
yarn dev
```

- Public site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (sign in with a seeded SUPERADMIN account)
- Account portal: `http://localhost:3000/account`

## Step 6 — What you'll notice missing locally, and why that's expected

- **No Cloudinary configured**: uploads fall back to `public/uploads/` — fine for local dev, but remember this path does **not** work in any deployed environment (§15) — don't be surprised when a feature that "works locally" needs real Cloudinary credentials to work on a Preview deployment.
- **No Turnstile**: bot-check verification is skipped (passes everyone) — this is deliberate, not a bug (§21).
- **No Upstash**: rate limiting falls back to an in-memory, per-process limiter — fine locally, not representative of production behavior under real concurrent load (§21).
- **No SMTP**: `sendMail()` throws — caught and logged everywhere it's called, so this never blocks the feature you're testing, but you won't actually receive emails locally unless you configure SMTP (§19 documents where to get Gmail SMTP credentials, per `.env.example`'s comments).

## Step 7 — Verification before considering any change done

```bash
yarn typecheck
yarn lint
yarn build
```

This is the **actual, current, full verification bar** (§24) — there is no broader automated test suite to also run. Beyond these three commands: manually verify the happy path, a validation failure, and — if you touched an admin route — the permission boundary tested as a **non-SUPERADMIN role** (SUPERADMIN bypasses the permission table and will falsely appear to work even when a real bug locks out every other role, §10/§27's single most common admin-module mistake).

## Common early mistakes (per the `.ai/skills/*.md` Common Mistakes sections, consolidated)

- Forgetting to register a new admin module in `MODULES` (`src/lib/rbac.ts`) **and** seed its `RolePermission` rows — the module will silently work for you (SUPERADMIN) and be invisible/locked for every other role until `yarn db:seed` runs (§10, §27).
- Recomputing a price/discount/GST value inline instead of importing `computeBookingFinance`/`resolveGst` — the exact drift those functions exist to prevent (§07, §26).
- Adding a new public query without `where: { published: true }` — the single most consequential CMS mistake (§08, §12).
- Forgetting `await params` — it's a `Promise` in Next.js 16, in both the page component and `generateMetadata` (§06, §09).
- Reaching for a Server Action — this codebase doesn't use them anywhere (ADR 0001); follow the `fetch()` + `useTransition()` pattern instead (§06).
- Declaring a JSON-holding Tour/Campaign column as Prisma's `Json` type instead of `String` — breaks the parse/stringify convention every consumer expects (§08).

## Deployment process (once your change is ready)

Branch naming: `VERTE-<type>-<slug>` (feature/bugfix/chore/docs/perf). Commit convention: `type(VERTE-N): message`. PR into `dev`, squash-merged. `dev → main` is a regular merge, periodically, once verified. Full detail in §20.

## Code conventions, in one paragraph

Server Components by default, Client Components only for a genuine interactive/browser-API reason (§03, §06). Route Handlers only, never Server Actions (ADR 0001). Business logic lives in `src/lib/<domain>`, never inline in a component (ADR 0006). Every mutating API verb calls `requirePermission`/`auth()` individually — a passing check on one verb never implies another is guarded (§09, §10). Tailwind with the existing design-token scale, never an arbitrary one-off value where an existing token fits (§06, `docs/DESIGN_SYSTEM.md`).

## Related Documents

- `.ai/START.md`, `.ai/README.md` — the canonical onboarding entry point this section complements
- §00 Documentation Guide — how this documentation set relates to `.ai/`
- §19 Environments & Configuration — the full env-var reference
- §20 CI/CD & Deployment, §24 Testing & QA — the verification and deploy process in full
- §27 Admin / Dashboard Architecture — the RBAC seeding gotcha, explained fully
