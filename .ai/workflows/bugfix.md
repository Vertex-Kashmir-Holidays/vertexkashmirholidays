This document defines the standard workflow for fixing defects in Vertex Kashmir Holidays.

The workflow references existing engineering documents instead of duplicating them.

This workflow applies to production bugs, QA issues, customer-reported issues, and defects discovered during development.

────────────────────────────────────

# Bug Fix Workflow

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

Bug fixing prioritizes restoring correct behaviour while minimizing risk — the fix should be the smallest change that resolves the root cause, not an opportunity to improve unrelated code.


**Production Incident**
If the issue affects the live production environment and requires immediate recovery, follow `hotfix.md` instead of this workflow.
This workflow is intended for standard defect resolution where investigation, verification, and documentation can be completed before deployment.

────────────────────────────────────

## Step 1 — Understand the Bug

Identify:

- Expected behaviour
- Actual behaviour
- Reproduction steps
- Scope
- Affected modules

If the bug cannot be reproduced: **stop and gather more information** — do not guess at a fix for a bug you can't observe.

────────────────────────────────────

## Step 2 — Read Context

Read only what's relevant to the bug:

- `../context/business-rules.md` — is this actually a bug, or is the current behaviour the documented business rule?
- `../context/project-overview.md`

────────────────────────────────────

## Step 3 — Investigate

Find:

- Root cause
- Related code
- Existing implementation
- Similar fixes elsewhere in the codebase

Never fix a symptom without understanding the cause.

────────────────────────────────────

## Step 4 — Plan the Fix

The fix should:

- Be minimal.
- Preserve existing business behaviour, except for the specific defect being corrected.
- Avoid unrelated refactoring.
- Avoid introducing new architecture (`../instructions/architecture.md` defines the target state — a bug fix is not the place to move toward it wholesale).

────────────────────────────────────

## Step 5 — Implement

Follow:

- `../instructions/coding-standards.md`
- `../instructions/architecture.md`

Reuse existing utilities and patterns — do not introduce a second implementation of something that already exists elsewhere in the codebase.

────────────────────────────────────

## Step 6 — Regression Check

Verify:

- The original bug is fixed.
- Related functionality still works.
- No new regressions elsewhere in the same flow.

────────────────────────────────────

## Step 7 — Verification

Run:

- `yarn typecheck`
- `yarn lint`
- `yarn build`

Perform manual testing — typecheck/lint/build confirm the code compiles, not that the bug is actually gone.

────────────────────────────────────

## Step 8 — Documentation

If the bug revealed:

- Missing documentation
- An incorrect or outdated business rule (`../context/business-rules.md`)
- An architectural gap (`../instructions/architecture.md`)

update the relevant document as part of the same task.

────────────────────────────────────

## Step 9 — Commit

Follow `../instructions/git-workflow.md` — branch naming, commit convention, and (if AI-assisted) the AI-Assisted Development section.

────────────────────────────────────

## Step 10 — Delivery Summary

Prepare:

- Root cause
- Solution
- Files changed
- Verification performed
- Manual actions (if any)
- Known risks (if any)
- Suggested branch name
- Suggested commit message

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Related Documents

- `../README.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
