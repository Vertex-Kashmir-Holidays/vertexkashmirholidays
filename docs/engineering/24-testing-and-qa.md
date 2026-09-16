# 24 — Testing & QA

> **What this section explains:** what testing tooling exists, what it's actually used for today, and what the realistic bar for "verified" is in this codebase right now — including a real documentation-vs-repository conflict this pass uncovered.
>
> **Confidence:** Confirmed from `package.json`, `.storybook/`, `vitest.config.ts`, `.github/workflows/ci.yml`, and `.ai/instructions/coding-standards.md` → Testing.

---

## The documentation-vs-repository conflict, stated plainly

`.ai/context/tech-stack.md` (last updated 2026-07-16) lists Storybook, Playwright, and Vitest under "Future Roadmap," explicitly stating they are "confirmed absent — no Storybook config, no test runner config." **This is no longer true.** All three are present in `package.json` and wired up:

| Tool | Version | Evidence |
|---|---|---|
| Storybook | ^10.5.3 | `.storybook/main.ts`, `preview.tsx`, `msw-handlers.ts`; `storybook`/`build-storybook` scripts |
| Vitest | ^4.1.10 | `vitest.config.ts` — wires Storybook's `storybookTest` plugin as a `"storybook"` project |
| Playwright | ^1.61.1 | Present as the **browser provider** for Vitest's browser mode (`@vitest/browser-playwright`) |

This documentation set follows the live repository, not the stale `.ai/` claim — see §04, §35, §40 for how this gap is tracked and should be corrected at the source.

## What this tooling actually is — and isn't

**What it is**: a component-level testing/documentation scaffold. Storybook stories can be written per UI component, rendered and visually reviewed in isolation, and (via the Vitest+Playwright wiring) exercised in real headless Chromium as part of a `storybook` Vitest project. MSW (`msw`, `msw-storybook-addon`) supports mocking network requests inside that environment.

**What it is not**: a general-purpose application test suite. Specifically confirmed:

- **No `jest.config.*`** anywhere — Jest is not used.
- **No standalone `playwright.config.*`** — Playwright exists only as Vitest's browser-mode provider, not as an independent E2E test runner with its own test files/config.
- **No `yarn test` script** is defined in `package.json`.
- **`.github/workflows/ci.yml` runs no test step** — only `typecheck`, `lint`, and `build`.

**Whether any actual `*.test.ts` or `*.stories.tsx` files exist in `src/` and are being exercised locally** is a distinct question from "is the tooling installed" — this documentation pass confirmed the tooling and CI wiring, not the current file-level test coverage. **Requires verification** if this becomes load-bearing (e.g. before claiming "VK has component tests" in an interview context — see §38).

## The actual current verification bar

Per `.ai/instructions/coding-standards.md` → Testing, the **minimum verification for every change**, today:

```bash
yarn typecheck   # tsc --noEmit
yarn lint        # eslint .
yarn build       # prisma generate && next build
```

This is explicitly stated as the **full bar today, not a placeholder** — `.ai/skills/prisma-migration.md` says outright: "There is no automated test suite in this repository today — verification above is currently the full bar." Every one of the seven `.ai/skills/*.md` files ends its own Verification section with exactly these three commands plus a manual browser check of the happy path, permission boundaries, and (for money-related changes) that the server-computed amount matches expectations regardless of client input.

## CI enforcement

`.github/workflows/ci.yml` runs `typecheck` and `lint` as pure-schema-parsing jobs (no live DB needed), and `build` against a real ephemeral `postgres:16` container with `prisma migrate deploy` applied first — because `next build` calls `generateStaticParams` on several public pages that query Prisma directly during the build. This is the actual quality gate on every PR — full detail in §20.

## What QA should know, concretely

- **There is no regression test suite to run before a release** — "did I break anything" is answered today by TypeScript/ESLint/build passing plus manual verification of the specific feature touched and its immediate neighbors (the Code Review Checklist in `.ai/instructions/git-workflow.md`).
- **Lighthouse CI** measures Core Web Vitals against 9 URLs but has **no enforced budget** (`.lighthouserc.js` has no `assert` block) — a performance regression is visible if someone looks at the `.lighthouseci` output, not automatically caught (§17, §30).
- **No visual regression testing** is wired into CI — Chromatic is a devDependency (paired with Storybook) but not confirmed to be running against every PR.
- Manual QA on a PR happens against its **Vercel Preview Deployment** URL (§20).

## What a QA engineer should actually test, per skill document

`.ai/skills/*.md` each specify what "done" looks like for their pattern — summarized:

| Change type | Manual verification beyond the 3 commands |
|---|---|
| API route | Happy path, a validation failure, an unauthorized request (wrong role / logged out), and — for money — server-computed amount regardless of client input |
| Booking finance | A `FLAT` discount and a `PERCENT` discount compute the same `effectivePayable` in both admin UI and a fresh API call; non-cash GST persists correctly; cash never carries GST; balance reaches exactly `0` after full payment |
| Admin CRUD module | CRUD operations, permission boundaries tested as a **non-SUPERADMIN role** (SUPERADMIN bypasses the permission table and will falsely appear to work even if seed rows are missing), search/filter/pagination, mutation toasts and loading states |
| CRM/admin ticket | The workflow end-to-end, permission boundaries as non-SUPERADMIN, and — if a status transition was touched — that the server-side guard actually rejects the disallowed case |
| Analytics event | The event logs to console in dev, fires exactly once, doesn't fire on an internal/admin route; for a server-side conversion, the `OfflineConversion` row reaches `SENT` |
| Prisma migration | For a production-bound change, `npx prisma migrate status` confirms clean history before and after |

## Related Documents

- §04 Technology Stack — the full tooling inventory and the doc-drift finding in context
- §20 CI/CD & Deployment — exactly what CI does and doesn't run
- `.ai/skills/*.md` (all seven) — the per-pattern verification checklists this section summarizes
- §35 Technical Debt — this section's doc-drift finding as a tracked item, plus "no test step in CI" as a named gap
- §40 Documentation Maintenance — how `.ai/context/tech-stack.md` should be corrected
