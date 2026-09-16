# 35 — Technical Debt & Known Limitations

> **What this section explains:** every confirmed gap, inconsistency, or deferred decision this documentation pass surfaced, prioritized. Every item here traces to a specific finding elsewhere in this document set or in `.ai/` — nothing here is invented.
>
> **Confidence:** Each item cites its source section. Priority levels follow the standard P0 (critical) → P3 (low) convention.

---

## P0 — Critical

None identified as P0 in this documentation pass. The one candidate — the historical payment-path transaction gap — is documented by `.ai/instructions/architecture.md` itself as **already resolved** (`recordOnlinePayment`, VERTE-16). See P2 below for the recommendation to re-verify this rather than take it purely on faith.

## P1 — High

| Item | Impact | Recommendation |
|---|---|---|
| **`.ai/context/tech-stack.md` is stale on testing tooling** — states Storybook/Vitest/Playwright are "confirmed absent"; all three are present and wired up in `package.json` (§04, §24) | A developer or AI assistant trusting `.ai/` at face value would falsely believe no test tooling exists, potentially reinventing it or skipping legitimate test-writing opportunities | Update `.ai/context/tech-stack.md`'s Future Roadmap section to reflect current reality; this is exactly the kind of drift `.ai/`'s own versioning discipline (§40) exists to prevent |
| **`.ai/context/folder-structure.md` is empty** (§05) | New developers following the stated reading order (`.ai/START.md`) hit a blank file at step 3 | Populate it — §05 of this documentation set can serve as a starting draft |
| **No test step in CI** despite test tooling being present (§20, §24) | A component-level regression can merge without any automated check beyond typecheck/lint/build | Either wire a `yarn test`-equivalent step into `ci.yml`, or explicitly document that the Storybook/Vitest tooling is not yet part of the merge gate (avoid the tooling looking load-bearing when it isn't) |
| **`.ai/context/business-rules.md`'s CRM module list predates 8 modules** now in production (Proposals, Hotel Rates, B2B Agents/Requests, Employees, Salary, Leave, Audit Log, Careers) (§02, §27) | Same risk as the tech-stack drift above — anyone trusting the module list as exhaustive undercounts the actual admin surface | Update `.ai/context/business-rules.md` §8, or at minimum add a forward pointer to §27 of this documentation set |
| **Admin audit-log coverage is not independently verified line-by-line** (§21) — the model/module/page all exist (closing `.ai/`'s previously-flagged gap), but which specific admin actions actually write an `AuditLog` row wasn't confirmed exhaustively | Someone could assume "audit logging exists" means "every sensitive action is audited," which isn't confirmed | Audit the `AuditAction` enum's 14 values against every code path that should trigger each one |

## P2 — Medium

| Item | Impact | Recommendation |
|---|---|---|
| **No dedicated CSRF-token mechanism** for general mutation routes (§21) | Relies on session-cookie/CSP/same-origin-check combination rather than an explicit token pattern | Verify NextAuth v5's own CSRF handling covers what it claims to, and explicitly decide whether the current combination is sufficient or whether a token mechanism should be added for non-auth mutation routes |
| **Video/document upload magic-byte validation missing** — images only (§15, §21) | An uploaded video/document isn't content-verified the way images are | Extend the existing image magic-byte validation pattern to these upload types |
| **No enforced Lighthouse/Core Web Vitals budget** — `.lighthouserc.js` collects but has no `assert` block (§17, §30) | A performance regression can ship unnoticed | Add an `assert` block with real thresholds once a baseline is established |
| **Payment-path transaction coverage should be re-verified**, not just trusted from the `.ai/` note (§07) | `.ai/instructions/architecture.md` states this gap is closed (VERTE-16/VERTE-35) — worth a direct spot-check before relying on it for a high-stakes decision | Confirm `recordOnlinePayment` and the Connect chat write path are genuinely wrapped in `$transaction` in current code |
| **`eslint-config-next` (15.3.3) is pinned behind `next` (16.2.9)** (§04) | Possible lint-rule drift from what Next 16 actually expects | Bump `eslint-config-next` to match, verify no new lint failures surface |
| **Several pending major version bumps** (Prisma 6→7, Tailwind 3→4, TypeScript 5→7, ESLint 9→10, React 19.1→19.2), each a real breaking-change surface — per `docs/DEPENDENCY_AUDIT_2026-07.md` | Deferred risk, not urgent, but accumulates | Each deserves its own dedicated ticket with regression testing, per the existing dependency audit's own conclusion — Tailwind 4 in particular is a full config-format rewrite |
| **PostCSS moderate CVE, accepted risk** — hard-pinned by Next.js's own build pipeline, not independently overridable without risking build breakage (`docs/DEPENDENCY_AUDIT_2026-07.md`) | Low exploitability (build-time only, no attacker-controlled CSS input in this app) | Revisit when Next.js ships a release with a bumped `postcss` — already tracked, not new |
| **`shadow-card-tours` Tailwind token defined but unused anywhere** (§06) | Dead design-system surface area | Remove, or find its first real use |
| **Three fixed bottom-bar components each hand-copy a different shadow value** rather than a shared token (§06) | Minor visual inconsistency, deliberately left unresolved pending a design decision | Not a bug to silently "fix" — flagged for whoever owns that design decision |
| **No sales-performance analytics** — no leaderboard, no per-salesperson conversion comparison, no quota/target tracking (§13, §14, §27) | Management has no built-in way to compare staff performance or set/track targets; the Dashboard's "Conversion Rate" is a scoped aggregate, not a comparison | A genuine product gap, not a bug — worth a business decision on whether it's needed before building it |
| **`User.bookingConversionPct` is a misleading field name** — reads like a tracked performance metric, is actually a manually-set commission-rate config value, never displayed as a KPI (§13, §14, §26) | Anyone skimming the schema could reasonably infer VK tracks per-salesperson conversion rates; it doesn't | Rename to something like `commissionRatePct` at the next convenient schema touch, or add a doc comment in `schema.prisma` itself |
| **"Today's Follow-ups" is a count only, not a worklist** — no click-through, no overdue filter, no sort-by-follow-up-date in `LeadsClient.tsx` (§14) | A salesperson knows *how many* follow-ups are due, not *which* leads, without opening each one | Add a follow-up filter/sort to the Leads list — a small, well-scoped feature gap |
| **Dashboard "Export Report" Quick Action is a dead link** (`href="#"`) (§27) | A visible, clickable UI element does nothing | Either wire it to a real export, or remove it until it's built |

## P2 — Medium (added 2026-09-16, caching rebuild)

| Item | Impact | Recommendation |
|---|---|---|
| **`home-content` and `corporate-offices` Data Cache tags have no mutation route wired to `revalidateTag()`** (§17) | `HomeContent`/`ContactOffice` edits rely on a 30-minute TTL rather than on-demand freshness — the save routes for these weren't in this pass's audited scope | Identify the save route(s) (likely the generic `/api/pages/content/[key]` family) and add the matching `revalidateTag()` call, following the pattern already used for `site-settings`/`faqs` |
| **About/Contact/B2B pages have no targeted invalidation** (§17) | These rely on a 6h TTL rather than immediate freshness after an edit | Lower priority than the P2 item above since these pages change less often; same fix pattern would apply |
| **Review-driven rating changes don't cross-invalidate the linked Destination page's average-rating display** (§17, §26) | A Destination page's aggregate rating (computed across its linked tours) can be stale for up to its own TTL after a review changes a linked tour's rating | Deliberate trade-off, not an oversight — chasing this would require querying every Destination linked to the affected tour on every review mutation; accepted given review-mutation frequency |

## P3 — Low

| Item | Impact | Recommendation |
|---|---|---|
| **No standalone ADR for hosting (Vercel), media storage (Cloudinary), or payment gateway (Razorpay) choice** (§34) | The reasoning behind these consequential, hard-to-reverse choices is only reconstructable from `.ai/context/tech-stack.md`, not captured as a formal decision record | Write retrospective ADRs if/when this reasoning needs to be defended again |
| **`LeadStatus.IN_PROGRESS`** exists in the schema but isn't documented in `.ai/context/business-rules.md`'s lead-status list, and appears to double as a B2B-request pending state (§08, §14) | Minor documentation gap, not a functional bug | Confirm its exact current usage in the admin UI and document it |
| **`Booking.discountType` is a plain string, not a Prisma enum**, despite the business rule being a fixed `FLAT`/`PERCENT` choice (§08) | A typo'd value wouldn't be caught by the database schema itself, only by application-level Zod validation | Consider a real enum if this field ever needs to expand beyond two values, though not urgent given Zod already validates it at the boundary |
| **A handful of campaign marketing components still use raw `<img>`** instead of `next/image` (§03, §06, §15) | Missed image-optimization benefit on those specific components | Migrate opportunistically when those components are next touched |
| **`src/hooks/` doesn't exist yet** — a hydration-mount-guard pattern is duplicated across several components (§03, §05) | Minor duplication, named as a target by the team's own architecture doc | Extract when convenient, not urgent |
| **API validation-failure status codes aren't fully standardized** (§09, §23) — most routes return `422`, but this isn't universal | Minor inconsistency for API consumers, low practical impact given there's no external API consumer today (§29) | Tracked in the team's own engineering backlog already — no new finding |
| **No `global-error.tsx`**, and only 2 total error boundaries in the entire app (§06, §23) | A root-layout-level failure has no dedicated recovery UI | Add one — low effort, meaningful resilience improvement |
| **`NewsletterSubscriber` model is entirely dormant** — zero usage in application code (§02, §08) | Dead schema surface | Either wire it up or remove it — currently neither |

## Structural / organizational (not a code defect, but worth naming)

- **No dedicated secrets manager, no Infrastructure-as-Code** (§18, §21, §31) — reasonable at current scale, a real risk if the team or traffic grows without addressing it first. See §36.
- **No APM/alerting/error-tracking** (§22) — same characterization: reasonable now, a real gap at scale.
- **No documented, tested database restore procedure** (§31) — the single highest-value recommendation in this entire technical-debt list, given it's the one item that would matter most in an actual worst-case scenario.

## Related Documents

Every item above cites its source section — this document intentionally does not restate full context, only the finding and its priority. See §36 Scalability for how several of these items become more urgent as VK's traffic and team size grow, and §40 Documentation Maintenance for how to keep this list itself from going stale the same way `.ai/context/tech-stack.md` did.
