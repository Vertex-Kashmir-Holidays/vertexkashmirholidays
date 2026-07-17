This document defines the standard workflow for implementing any new feature in Vertex Kashmir Holidays.

It references the existing engineering platform rather than repeating it.

Where a step needs detail, follow the linked document — this file only sequences them.

────────────────────────────────────

# Feature Development Workflow

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

Every new feature follows the same implementation lifecycle, whether performed by a human developer or with AI assistance.

────────────────────────────────────

## Step 1 — Understand the Plane Task

Identify:

- Requirements
- Scope
- Acceptance criteria
- Dependencies

If requirements are unclear: **stop, do not implement.** Ask instead of guessing (see `../README.md` → AI Development Principles).

See `../instructions/git-workflow.md` → Plane Workflow for how a task becomes a branch.

────────────────────────────────────

## Step 2 — Read Project Context

Read only what's relevant to the task:

- `../context/project-overview.md`
- `../context/business-rules.md`
- `../context/tech-stack.md`

────────────────────────────────────

## Step 3 — Read Engineering Instructions

- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`

────────────────────────────────────

## Step 4 — Review Existing Implementation

Search for, in this order of preference:

- An existing shared UI primitive (`coding-standards.md` → Design System)
- A reusable service/utility in `src/lib/<domain>` (`architecture.md` → Folder Responsibility)
- A similar existing component or route in the same domain

Reuse before creating. If no shared hook exists for a pattern you need, check whether it's worth extracting one — don't assume a `src/hooks/` module already exists for it (see `architecture.md` → Section 7).

────────────────────────────────────

## Step 5 — Implementation

- Minimal changes for the stated scope.
- Production-safe — no partial/half-finished states committed.
- No duplicated logic — see `coding-standards.md` → General Principles.
- Preserve existing business behaviour unless the task explicitly changes it (`business-rules.md` is the authority on current behaviour).
- Reuse shared utilities — financial calculations, JSON-column handling, and validation schemas each have one canonical module; never recompute inline (`architecture.md` → Section 6).
- Follow `architecture.md` → Next.js Mutation Standard for any client mutation.

────────────────────────────────────

## Step 6 — Verification

- `yarn typecheck`
- `yarn lint`
- `yarn build`
- Responsive UI preserved
- Accessibility preserved (`coding-standards.md` → Accessibility)
- Existing functionality unchanged
- Manual testing in the browser for any UI-facing change (start `yarn dev`, exercise the actual flow — typecheck/lint/build verify correctness, not feature behaviour)

────────────────────────────────────

## Step 7 — Documentation

If the implementation changes something one of these documents currently states, update that document as part of the same task, not as a follow-up:

- `../instructions/architecture.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- This directory (`../workflows/`), if the process itself changed

Documentation is part of the task, not an optional extra step.

────────────────────────────────────

## Step 8 — Commit

Follow `../instructions/git-workflow.md` — branch naming, commit convention, and (if AI-assisted) the AI-Assisted Development section.

────────────────────────────────────

## Step 9 — Pull Request

Per `../instructions/git-workflow.md` → Pull Requests, include:

- Summary
- Screenshots (UI changes)
- Environment variable changes
- Migration notes
- Manual deployment steps, if any

────────────────────────────────────

## Step 10 — Merge

Merge only after verification (Step 6), review (`git-workflow.md` → Code Review), and documentation (Step 7) are all done — not before.

────────────────────────────────────

## Step 11 — Delivery Summary

Before considering the task complete, prepare a delivery summary.

The summary should include:

- Task completed
- Scope implemented
- Files modified
- Verification performed
- Database migrations (if any)
- Environment variable changes (if any)
- Manual deployment steps (if any)
- Manual third-party configuration (if any)
- Suggested branch name
- Suggested commit message
- Known limitations (if any)
- Follow-up work (if any)

If no manual action is required, explicitly state:

"No manual action required."

This summary becomes part of the implementation record and should accompany every completed engineering task.

────────────────────────────────────

## Related Documents

- `../README.md`
- `../context/project-overview.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
