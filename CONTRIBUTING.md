# Contributing to Vertex Kashmir Holidays

This is the quick-reference version of this project's Git workflow. The full, canonical version — including the hotfix workflow and rollback procedure — lives in [`.ai/instructions/git-workflow.md`](.ai/instructions/git-workflow.md). If the two ever disagree, that file is the source of truth, not this one.

Before writing any code, see [`.ai/START.md`](.ai/START.md) for the full reading order (architecture, coding standards, and the relevant Skill for your change).

## Branches

- **`main`** — production. Every deploy of the live site builds from this branch.
- **`dev`** — integration branch. Every working branch merges here first.

Working branches use a single flat prefix (no `type/` nesting):

| Prefix | Use for |
|---|---|
| `VERTE-feature-*` | New functionality |
| `VERTE-bugfix-*` / `VERTE-fix-*` | A defect fix |
| `VERTE-chore-*` | Dependency bumps, config, non-functional maintenance |
| `VERTE-docs-*` | Documentation only |
| `VERTE-perf-*` | A performance-focused change |

Include the Plane issue number once one exists: `VERTE-feature-42-ci-cd-quality-gate`. Emergency production fixes may omit it (`VERTE-fix-payment-webhook-timeout`) — file a Plane task afterward if the fix is significant.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), scoped with the same slug/issue number as the branch:

```
feat(VERTE-42): implement CI/CD quality gate
fix(VERTE-54): resolve payment calculation
refactor(VERTE-31): split booking summary component
docs(VERTE-20): update architecture guide
chore(VERTE-12): update dependencies
```

Write the message in full words, spelled correctly, with a colon and a space after the scope.

## Before opening a PR

Run and fix everything, in this order:

```bash
yarn typecheck
yarn lint
yarn build
```

There's no automated test suite yet — this is the full verification bar. For any UI-facing change, also exercise it manually in the browser (`yarn dev`).

## Pull requests

- One logical change per PR — small PRs preferred.
- Include a summary of what changed and why.
- Include screenshots for UI changes.
- Link the Plane issue.
- Call out any database migration, environment variable change, or manual deployment/configuration step required — don't let a reviewer discover these by reading the diff.

## Code review checklist

- Business logic unchanged unless the PR's purpose is to change it.
- Follows `.ai/instructions/coding-standards.md` and `.ai/instructions/architecture.md`.
- No duplicated code, no dead code left behind.
- TypeScript, ESLint, and the build all pass.
- Documentation updated if the change affects it (including `.ai/` itself, if the change alters an established pattern).

With a small team, a second reviewer isn't always available — a thorough self-review against this checklist before merge is expected, not optional.

## Merging

- **Working branch → `dev`**: Squash and Merge.
- **`dev` → `main`**: a regular merge (not squashed), so `main`'s history shows what shipped together in each release.

Delete your branch once its PR merges — don't let one sit stale for weeks.

## AI-assisted contributions

AI coding assistants are expected to follow the same standards as a human contributor — see `.ai/instructions/git-workflow.md` → AI-Assisted Development. The person merging the change is responsible for its correctness regardless of how it was written.
