# 04 — Technology Stack

> **What this section explains:** every meaningful technology in the codebase, its exact pinned version, where it's used, and why — not a generic package inventory.
>
> **Confidence:** Confirmed from `package.json` (read in full), `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.lighthouserc.js`, `.github/workflows/ci.yml`, and `.ai/context/tech-stack.md`. Package manager: **Yarn Classic 1.22.22** (`yarn.lock` is the only lockfile; a `pnpm.onlyBuiltDependencies` block exists in `package.json` but is vestigial — no `pnpm-lock.yaml` exists).

---

## Quick Reference

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI | React | 19.1.0 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^3.4.17 |
| ORM | Prisma | 6.19.3 |
| Database | PostgreSQL (Neon) | — |
| Auth | NextAuth (Auth.js) | 5.0.0-beta.31 |
| Payments | Razorpay | ^2.9.6 |
| Media | Cloudinary + sharp | ^2.10.0 / ^0.34.5 |
| Validation | Zod | ^4.4.3 |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | ^1.38.0 / ^2.0.8 |
| Hosting | Vercel | — |

## Frontend

| Technology | Version | Purpose | Usage in VK | Why chosen / trade-off |
|---|---|---|---|---|
| **Next.js** (App Router) | 16.2.9 | Framework — routing, RSC, ISR, Route Handlers | Route groups `(public)`, `admin`, `account`, `login`. `params` is a `Promise` in v16 — must always be `await`ed. | The App Router's RSC model lets pages default to server rendering (fast, no client JS for static content) while still supporting islands of interactivity — a good fit for a marketing-heavy public site that also needs a rich, stateful admin CRM in the same codebase. Alternative considered by the architecture itself (implicitly, via ADR 0001): Server Actions for mutations, deliberately rejected in favor of explicit Route Handlers. |
| **React** | 19.1.0 | UI rendering | Server Components by default; Client Components only where hooks/events/browser APIs are required | Required by Next.js 16; React 19's improvements to Server Component ergonomics are load-bearing for the RSC-first architecture. |
| **TypeScript** | ^5 (strict) | Static typing | Project-wide, `strict: true`, path alias `@/*` → `./src/*` | Strict mode catches null/undefined bugs at compile time across a codebase with significant financial logic — a runtime type error in a pricing calculation is a worse failure mode than a build error. |
| **Tailwind CSS** | ^3.4.17 | Styling | All UI styling; token scale documented in `docs/DESIGN_SYSTEM.md` (see §06) | Utility-first CSS avoids a separate CSS-file-per-component maintenance burden; the project has NOT migrated to Tailwind 4 (a breaking config-format rewrite) — tracked as deliberate, not oversight (see §35). |
| **shadcn/ui + Radix UI + CVA + tailwind-merge + clsx** | mixed (^1–2.x per Radix package) | Accessible unstyled primitives + variant styling + class merging | 12 primitives in `src/components/ui/`: Accordion, Sheet, Button, Dialog, Input, Label, Badge, Select, Avatar, Tooltip, Tabs, DropdownMenu | Radix supplies correct ARIA/keyboard behavior "for free"; most admin UI still hand-rolls markup rather than using these (a named Design System backlog gap, not yet fully adopted). |
| **next-themes** | ^0.4.6 | Dark/light theme switching | Admin panel only — the public site has no dark mode | Scoped deliberately; public-site dark mode is an explicit future enhancement gated on product sign-off, not an oversight. |
| **Recharts** | ^3.8.1 | Charting | Admin revenue chart only, lazy-loaded (`ssr: false`) | Kept out of the initial bundle of every page that doesn't render a chart. |
| **Three.js + @react-three/fiber + @react-three/drei** | ^0.184.0 / ^9.6.1 / ^10.7.7 | 3D rendering | One of three homepage hero modes (`HeroR3F.tsx`), `NEXT_PUBLIC_HERO_MODE=r3f` | Currently **orphaned** — not imported by any route as of this documentation pass (see §03, §35). Must stay behind a `next/dynamic({ ssr: false })` boundary if reintroduced. |
| **Framer Motion** | ^12.40.0 | Animation | Scroll-reveal, hero transitions, sitewide — via a single shared `EASE_BRAND` curve and reusable variants in `src/lib/motion.ts` (see §06) | Centralized after 23+ components had hand-copied the same easing bezier independently — a real, since-fixed duplication problem. |
| **Sonner** | ^2.0.7 | Toast notifications | Every admin mutation surfaces success/failure via `toast()` | Standard pairing with `useTransition` in the mutation pattern (§07). |
| **React Hook Form + @hookform/resolvers** | ^7.77.0 / ^5.4.0 | Form state + Zod integration | Every form in the app | Keeps form validation logic declarative and shared between client-side UX and the Zod schema the API also validates against. |
| **libphonenumber-js** | ^1.13.6 | Phone validation/formatting | Contact/lead forms, auth, signup | Avoids a hand-rolled regex for a genuinely hard problem (international phone formats). |
| **@marsidev/react-turnstile** | ^1.5.3 | Cloudflare Turnstile CAPTCHA widget | Public forms prone to abuse (see §21) | — |

## Backend

| Technology | Version | Purpose | Usage in VK |
|---|---|---|---|
| **Next.js Route Handlers** | 16.2.9 | HTTP API layer | 137 route files, ~185 exported handlers under `src/app/api/**` (§09) — the only server API mechanism in active use |
| **Server Actions** | n/a | — | **Not used anywhere** — `"use server"` appears nowhere in the codebase (ADR 0001) |
| **Zod** | ^4.4.3 | Runtime validation | Every API route; forms via `@hookform/resolvers`; JSON-string `Tour`/`Campaign` columns validated as `z.string()`, not `z.array(...)` |
| **NextAuth (Auth.js)** | 5.0.0-beta.31 | Authentication | See §10 |
| **@auth/prisma-adapter** | ^2.11.2 | NextAuth ↔ Prisma bridge | Persists `User`/`Session`/`Account` rows |
| **bcryptjs** | ^3.0.3 | Password/OTP hashing | `auth.ts`, `EmailOtp`, MFA confirm, booking credential resend, account password change |
| **jose** | ^6.0.6 | JWT verify/sign | Verifies Google One Tap ID tokens against Google's JWKS; signs Jitsi/JaaS meeting-join RS256 JWTs (§28) |
| **otpauth + qrcode** | ^9.5.1 / ^1.5.4 | TOTP MFA | Staff/admin MFA enroll→verify→confirm flow (§21) |
| **sanitize-html** | ^2.17.5 | HTML sanitization | Blog body, destination/activity content, TripAdvisor widget markup — anything rendered via `dangerouslySetInnerHTML` |
| **sharp** | ^0.34.5 | Image processing | Upload pipeline (`src/lib/storage.ts`), itinerary image compression; registered under `serverExternalPackages` in `next.config.ts` |
| **@react-pdf/renderer** | ^4.5.1 | PDF generation | Itinerary export, booking invoices, and **salary slips** (`SalarySlipDocument.tsx` — a use not documented in `.ai/context/tech-stack.md`, confirming that doc predates the payroll module) |

## Database

| Technology | Version | Purpose |
|---|---|---|
| Prisma Client | 6.19.3 (exact-pinned) | ORM — single instance, `import { prisma } from "@/lib/prisma"` everywhere |
| Prisma CLI | ^6.19.3 | Schema/migration tooling |
| PostgreSQL (Neon) | — | Database — two separate databases, dev and prod |
| Prisma Migrate | — | 23 committed migration folders as of this pass (§08) |

Full schema, ER diagram, and migration history in §08.

## Security & Anti-Abuse

| Technology | Purpose | Usage |
|---|---|---|
| Cloudflare Turnstile | Bot/CAPTCHA protection | Register/forgot-password OTP, contact form, lead form, campaign lead capture, login brute-force path — degrades to "pass" when unconfigured |
| Upstash Redis + `@upstash/ratelimit` | Rate limiting | Booking creation/verification, every OTP route, login, leads, newsletter, careers apply, admin MFA verify/confirm, `/api/spotlight`, password-change branch of profile update — falls back to an in-memory per-instance limiter when unconfigured |
| otpauth + qrcode | TOTP MFA | Staff/admin second factor |
| Nonce-based CSP | Script-injection defense | Generated per-request in `src/proxy.ts` for `/admin`, `/account`, `/login`, `/api`; static CSP for public pages (ISR-cacheable) |

Full detail in §21.

## Payments

**Razorpay** (`^2.9.6`) — order creation, checkout, HMAC-verified webhook confirmation. No other payment gateway is integrated. Full flow in §26.

## Analytics — Client & Server

| Technology | Purpose | Usage |
|---|---|---|
| Google Tag Manager | Single tag-management container | The **only** analytics script this codebase injects directly (`GTMScript.tsx`), suppressed on internal/admin routes |
| GA4, Meta Pixel | Web analytics, ad pixel | Both configured **as GTM tags**, not hardcoded — no `gtag()`/`fbq()` call exists in app code |
| Google Ads Offline Conversions (Data Manager API) | Server-side conversion upload | `lib/offlineConversion/adapters/google.ts` |
| Meta Conversions API | Server-side conversion upload | `lib/offlineConversion/adapters/meta.ts`, SHA-256-hashed PII |
| `@next/third-parties` | Next.js first-party wrapper for third-party scripts | ^16.2.9 |

Full detail in §13.

## Deployment & Hosting

| Technology | Purpose |
|---|---|
| GitHub + GitHub Actions | Source control, single CI workflow (`ci.yml`: typecheck/lint/build) |
| Vercel | Hosting, build, serverless compute, Edge Middleware, one Cron job |
| Neon | Managed PostgreSQL, dev/prod split |
| Bluehost | Domain DNS |
| Cloudflare | CDN "where applicable" + Turnstile vendor |

Full detail in §18–§20.

## Code Quality & Developer Tooling

| Technology | Version | Purpose | Notes |
|---|---|---|---|
| ESLint | ^9 (flat config) | Linting | Extends `next/core-web-vitals` + `next/typescript` + `eslint-plugin-storybook`'s recommended config. A **custom local rule**, `vertex/icon-only-control-needs-label` (`eslint-rules/icon-only-control-needs-label.mjs`), is registered as a build-blocking error — jsx-a11y's `control-has-associated-label` can't catch this case because every icon here is a custom component. `jsx-a11y/alt-text` is raised to `error`. `@typescript-eslint/no-explicit-any`, `react/no-unescaped-entities`, `@next/next/no-html-link-for-pages` are `warn`. |
| `eslint-config-next` | 15.3.3 | Next.js lint ruleset | **Version mismatch** — pinned to 15.3.3 against Next.js 16.2.9. Not confirmed broken, but worth flagging as drift (§35). |
| Prettier | ^3.9.5 | Formatting | `yarn format` / `format:check` |
| TypeScript | ^5, strict | Type checking | `yarn typecheck` → `tsc --noEmit` |
| `@next/bundle-analyzer` | ^16.2.10 | Bundle size inspection | `ANALYZE=true yarn build` |
| Lighthouse CI (`@lhci/cli`) | ^0.15.1 | Performance measurement | `.lighthouserc.js` collects Lighthouse runs against 9 URLs, 3 runs each — **no `assert` budget block configured**, so it measures but does not currently enforce a performance/accessibility threshold (§30, §35) |
| GitHub Actions CI | — | PR quality gate | One workflow file, three parallel jobs — see §20 |

## Testing tooling — a documentation-vs-repository conflict worth flagging up front

`.ai/context/tech-stack.md` (last updated 2026-07-16) states under "Future Roadmap" that Storybook, Playwright, Vitest, and visual regression testing are "confirmed absent — no Storybook config, no test runner config." **This is no longer accurate.** As of this documentation pass, `package.json` and the repo root confirm all of the following are present:

| Technology | Version | Evidence |
|---|---|---|
| Storybook | ^10.5.3 | `.storybook/` config dir (`main.ts`, `preview.tsx`, `msw-handlers.ts`); `storybook`/`build-storybook` scripts; `@storybook/{addon-a11y,addon-docs,addon-mcp,addon-vitest,nextjs-vite}`, `@chromatic-com/storybook` |
| Vitest | ^4.1.10 | `vitest.config.ts` wires Storybook's `storybookTest` plugin as a `"storybook"` project, running in real headless Chromium via Playwright |
| Playwright | ^1.61.1 | Present as `@vitest/browser-playwright` — the browser *provider* for Vitest's browser mode. **No standalone `playwright.config.*`** exists — this is not (yet) a general E2E test runner |
| MSW (Mock Service Worker) | ^2.15.0 | `msw`, `msw-storybook-addon` — request mocking inside Storybook |

**What this means in practice, precisely:** the tooling to write and run component-level tests inside Storybook exists and is wired up. It is **not** the same as a general application test suite — there is no `jest.config.*`, no standalone Playwright E2E config, and (per the same research pass) `yarn test` is not a defined script. Whether any actual `*.test.ts`/`*.stories.tsx` test files exist and are exercised in CI is a separate question from whether the tooling is installed — **requires verification** against the current `src/` tree; `.github/workflows/ci.yml` runs only `typecheck`/`lint`/`build`, with no test step. See §24 for the full Testing & QA picture and §35 for this documentation-drift finding as a technical-debt/doc-maintenance item.

## Confirmed absent (checked directly, not assumed)

| Category | Status |
|---|---|
| Sentry / LogRocket / Datadog / New Relic / any APM or error-tracking SDK | **Confirmed absent** |
| Redis beyond Upstash | **Confirmed absent** — `@upstash/redis`/`@upstash/ratelimit` only |
| GraphQL / Apollo | **Confirmed absent** |
| Message queue (BullMQ, Bee-Queue, Kue, Agenda) | **Confirmed absent** |
| Jest | **Confirmed absent** |

## Future Roadmap (per `.ai/context/tech-stack.md`, adjusted per the finding above)

The following remain genuinely not implemented: a general application test suite exercising business logic (as opposed to the Storybook/Vitest component-testing scaffold now in place), a Design Token System beyond the current Tailwind-config-based approach, and visual regression testing (Chromatic is a devDependency but not confirmed wired into CI). These should only be introduced after approval, per the same document's standing rule.

## Related Documents

- `.ai/context/tech-stack.md` — the team's own living tech-stack doc (flagged stale in one section above)
- §03 Architecture — why each major technology choice was made, not just what it is
- §08 Database Architecture, §10 Auth, §11 Integrations, §21 Security, §24 Testing — deep dives per technology area
- §35 Technical Debt — the `eslint-config-next` version mismatch, Tailwind 3→4 and other pending major bumps, and the doc-drift finding above
