This document defines the Git workflow for Vertex Kashmir Holidays.

This is the official Git standard for all contributors.

The workflow should be simple, practical, and suitable for a small engineering team using:

- GitHub
- Vercel
- Plane
- GitHub Free
- AI-assisted development

Do not introduce enterprise processes that add unnecessary overhead.

────────────────────────────────────

# Git Workflow

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This document standardizes source control practices across the project — branch naming, commit messages, review, and deployment — so history stays traceable and production deploys stay safe with a small (1–2 developer, AI-assisted) team.

────────────────────────────────────

## Branch Strategy

**main**

- Production. Every deploy of the live site builds from this branch.

**dev**

- Integration branch. Every feature/bugfix branch merges here first; `dev` is periodically merged into `main` once its contents are verified.

**Working branches** — a single flat prefix, no `type/` folder nesting (this matches the ~90 branches already in this repository's history — don't introduce a nested scheme that contradicts it):

- `VERTE-feature-*` — new functionality
- `VERTE-bugfix-*` / `VERTE-fix-*` — a defect fix
- `VERTE-chore-*` — dependency bumps, config, non-functional maintenance
- `VERTE-docs-*` — documentation only
- `VERTE-perf-*` — a performance-focused change

Pick the type word that matches the change; don't invent a new one per branch.

────────────────────────────────────

## Branch Naming

Established pattern (real examples from this repo):

```
VERTE-feature-tour-detail-page
VERTE-bugfix-authentication
VERTE-feature-lead-security-system
```

Going forward, once a Plane issue exists for the change, include its issue number so the branch is traceable to Plane:

```
VERTE-feature-42-ci-cd-quality-gate
```

**Emergency work** may omit a Plane ID when immediate production work is required:

```
VERTE-fix-payment-webhook-timeout
```

A Plane task should be created afterward if the fix is significant enough to need a record.

────────────────────────────────────

## Commit Convention

Adopt Conventional Commits: `type(scope): message`. The scope is the same short slug used in the branch name; once a Plane issue exists, use its number as the scope.

```
feat(VERTE-42): implement CI/CD quality gate
fix(VERTE-54): resolve payment calculation
refactor(VERTE-31): split booking summary component
docs(VERTE-20): update architecture guide
chore(VERTE-12): update dependencies
perf(VERTE-40): optimize homepage images
ci(VERTE-8): add GitHub Actions quality gate
test(VERTE-65): add booking service tests
```

**Emergency examples** (no scope required):

```
fix: resolve production payment timeout
fix: restore Google Ads tracking
```

Write the message in full words, spelled correctly, with a colon and a space after the scope — small things, but they're what make `git log` searchable later.

────────────────────────────────────

## Plane Workflow

```
Plane Task
  ↓
Branch
  ↓
Implementation
  ↓
Review
  ↓
Commit
  ↓
Pull Request
  ↓
Merge
  ↓
Deployment
```

Emergency production fixes may begin immediately, without a pre-existing Plane task. A Plane task should be created afterward if appropriate.

Plane supports engineering — it must never block production recovery.

────────────────────────────────────

## Pull Requests

- One logical change per PR.
- Small PRs preferred.
- Include a summary.
- Include screenshots for UI changes.
- Link the Plane issue where available.
- Mention migrations, if any (see `coding-standards.md` → Database Standards — every schema change needs a committed migration, not just `db:push`).
- Mention environment variable changes.
- Mention manual deployment steps if required (several engineering-backlog items are flagged "Manual Action Required" — carry that flag into the PR description).

────────────────────────────────────

## Code Review

Checklist:

- Business logic unchanged unless intended.
- Coding standards followed (`coding-standards.md`).
- Architecture respected (`architecture.md`).
- No duplicated code.
- No dead code.
- Documentation updated if required.
- TypeScript passes.
- ESLint passes.
- Build passes.

With a small team, a second reviewer isn't always available — a thorough self-review against this checklist before merge is acceptable, but the checklist itself is not optional.

────────────────────────────────────

## Merge Strategy

- **Feature/bugfix branch → `dev`**: Squash and Merge. Each merged PR should represent one completed logical change in `dev`'s history.
- **`dev` → `main`**: a regular merge (not squashed), so `main`'s history shows what shipped together in each release.

Keep Git history clean going forward — this is a change from current practice (see the accompanying review).

────────────────────────────────────

## Deployments

```
GitHub
  ↓
CI (future)
  ↓
Merge
  ↓
Automatic Vercel Deployment
```

Deployment is automatic on merge to `main`. Developers should not manually deploy unless required. Vercel Cron jobs (e.g. the daily Vertex Connect retention job) run independently of the deploy pipeline and don't require any manual step.

────────────────────────────────────

## Hotfix Workflow

```
Production issue
  ↓
Create fix branch (from main)
  ↓
Implement
  ↓
Verify
  ↓
Merge to main AND dev
  ↓
Deploy
  ↓
Create Plane task afterwards if needed
```

Keep production recovery fast. A hotfix branched from `main` must also be merged back into `dev` so the fix isn't lost on the next `dev → main` merge.

────────────────────────────────────

## Rules

**Never**

- Force push to shared branches (`main`, `dev`).
- Rewrite production history.
- Commit secrets.
- Commit generated build files or `node_modules`.
- Commit debugging code.

**Always**

- Pull latest changes before starting new work.
- Keep commits focused.
- Write meaningful, correctly-spelled commit messages.
- Keep branches short-lived — delete a branch once its PR merges. Don't let a branch sit unmerged for weeks (or months); if it's not going to land soon, close it and re-cut later instead of letting it drift out of date with `dev`.

────────────────────────────────────

## AI-Assisted Development

AI coding assistants are engineering tools that help accelerate development. They do not replace engineering judgment or responsibility.

The same engineering standards, coding conventions, review process, and verification checklist apply regardless of whether code is written by a human developer or generated with AI assistance.

Every AI-generated change must:

- Follow the project architecture.
- Comply with the Coding Standards.
- Reuse existing project patterns.
- Preserve business behaviour unless explicitly requested otherwise.
- Pass TypeScript, ESLint, and production build verification.
- Include any required documentation updates.

The developer reviewing the change is ultimately responsible for its correctness, quality, security, and maintainability.

AI-generated code is never exempt from code review.

AI should assist implementation—not make architectural or business decisions without explicit approval.

An AI assistant commits locally for review; it does not push to a shared branch or open/merge a pull request unless explicitly instructed to.

────────────────────────────────────

## Related Documents

- `coding-standards.md`
- `architecture.md`
- `../context/project-overview.md`
