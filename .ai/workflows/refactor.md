
This document defines the standard workflow for refactoring existing code in Vertex Kashmir Holidays.

Unlike Feature Development, refactoring must improve engineering quality WITHOUT changing business behaviour.

Unlike Bug Fixes, refactoring is not intended to correct defects.

The goal is to gradually improve the codebase while keeping production stable.

Do not duplicate information already documented elsewhere.

Reference existing engineering documents whenever possible.

────────────────────────────────────

Structure

# Refactor Workflow

Version: 1.1.0

Last Updated: 2026-07-17

## Purpose

Explain that refactoring improves code quality, maintainability, readability, and architecture without changing existing functionality.

Examples

- Split large components
- Extract reusable utilities
- Reduce duplicated code
- Improve folder structure
- Improve naming
- Separate business logic from UI
- Improve TypeScript types
- Improve performance without changing behaviour

State clearly:

Refactoring must never introduce new features or intentionally modify business behaviour.

────────────────────────────────────

## Step 1 — Understand the Scope

Identify

- Current implementation
- Why refactoring is required
- Expected outcome
- Boundaries

If the work changes business behaviour, it is not a refactor.

Follow Feature Development instead.

────────────────────────────────────

## Step 2 — Read Context

Read only documents relevant to the refactoring.

Normally

- ../instructions/coding-standards.md
- ../instructions/architecture.md

If business logic may be affected, also review

- ../context/business-rules.md

────────────────────────────────────

## Step 3 — Review Existing Implementation

Understand

- Current responsibilities
- Existing abstractions
- Shared utilities
- Similar implementations

Do not duplicate existing patterns.

────────────────────────────────────

## Step 4 — Plan the Refactor

The plan should

- Keep business behaviour unchanged.
- Reduce complexity.
- Improve readability.
- Improve maintainability.
- Improve consistency.
- Avoid unnecessary rewrites.

Direction comes from `../instructions/architecture.md` → Technical Debt: refactoring should gradually move the repository toward the target architecture, not attempt to reach it in one large rewrite.

Large refactors should be broken into multiple Plane tasks.

────────────────────────────────────

## Step 5 — Implement

Follow

- ../instructions/coding-standards.md
- ../instructions/architecture.md

Prefer

- Small commits
- Incremental improvements
- Reusable components
- Better separation of concerns

Do not mix unrelated improvements.

**Database Safety** — if the refactor touches the database schema:

- Create a proper Prisma migration — never rely on `db:push` alone.
- Verify migration safety before applying it.
- Keep schema refactoring independent from any business-behaviour change.

See `../instructions/coding-standards.md` → Database Standards for the underlying Prisma/migration rules.

────────────────────────────────────

## Step 6 — Behaviour Verification

Confirm

- Business behaviour is unchanged.
- Existing UI is unchanged unless explicitly intended.
- Existing APIs continue to work.
- Existing integrations continue to work.

If behaviour changes, stop and reassess whether the work is actually a feature.

────────────────────────────────────

## Step 7 — Verification

Run

- yarn typecheck
- yarn lint
- yarn build

Perform manual regression testing for the affected flows.

────────────────────────────────────

## Step 8 — Documentation

If the refactor changes

- Architecture
- Coding Standards
- Folder responsibilities
- Engineering guidance

Update the relevant documentation as part of the same task.

────────────────────────────────────

## Step 9 — Commit

Follow

../instructions/git-workflow.md

────────────────────────────────────

## Step 10 — Delivery Summary

Prepare

- Refactor objective
- Scope
- Files modified
- Behaviour verification
- Verification performed
- Manual actions
- Follow-up work
- Suggested branch
- Suggested commit

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Refactoring Principles

Workflow-specific principles only — for the underlying engineering standards (reduce duplication, improve readability, never change business behaviour), see `../instructions/coding-standards.md` → Refactoring.

- Improve one concern at a time.
- Keep refactors incremental.
- Break large refactors into multiple Plane tasks.
- Preserve public interfaces where practical.
- Separate refactoring from feature development.

────────────────────────────────────

## Related Documents

- ../README.md
- feature.md
- bugfix.md
- hotfix.md
- ../instructions/coding-standards.md
- ../instructions/architecture.md
- ../instructions/git-workflow.md
- ../context/tech-stack.md

────────────────────────────────────

Requirements

Keep the workflow practical.

Reference existing documentation instead of repeating it.

This workflow should support the long-term engineering improvement roadmap identified during the Engineering Audit.

After writing the document, review it against the repository.

Report

1. Existing refactoring opportunities.
2. Repository-specific improvements.
3. Any conflicts with the current architecture.

Do not automatically modify the document after the review.