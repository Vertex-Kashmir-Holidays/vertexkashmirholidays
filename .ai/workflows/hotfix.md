This document defines the emergency production recovery workflow for Vertex Kashmir Holidays.

Unlike Feature or Bug Fix workflows, this workflow prioritizes restoring production safely and quickly.

Do not duplicate information already documented elsewhere.

Reference existing documents whenever possible.

────────────────────────────────────

Structure

# Hotfix Workflow

Version: 1.1.0

Last Updated: 2026-07-17

## Purpose

Explain that this workflow is only for live production incidents requiring immediate action.

Examples

- Website down
- Payment failures
- Authentication failure
- Booking failures
- Production deployment issue
- Critical security issue
- Analytics outage affecting business

This workflow must not be used for normal bugs.

────────────────────────────────────

## Step 1 — Assess Severity

Confirm

- Production affected
- Business impact
- Urgency

If the issue is not production-critical, follow `bugfix.md` instead.

────────────────────────────────────

## Step 2 — Stabilize

Prevent further impact. Restoring production quickly takes priority over immediately fixing the underlying cause.

Recommended order:

- Roll back to the previous stable Vercel deployment — preferred when the latest deployment introduced the incident.
- Disable the affected functionality, if a safe mechanism exists to do so.
- Roll back configuration, if applicable.
- Apply a temporary workaround, if required.

Do not begin refactoring.

────────────────────────────────────

## Step 3 — Investigate

Identify

- Root cause
- Scope
- Impact

Focus only on restoring production.

────────────────────────────────────

## Step 4 — Implement

Make the smallest safe change.

Do not perform unrelated cleanup.

Follow

- ../instructions/coding-standards.md
- ../instructions/architecture.md

**Database Safety** — if the hotfix requires a database migration:

- Confirm the target database environment before applying anything.
- Verify the migration is safe to run against production data.
- Ensure rollback is understood before applying the change.
- Avoid unnecessary schema changes during a production incident — a hotfix is not the moment for a broader migration.

See `../instructions/coding-standards.md` → Database Standards for the underlying Prisma/migration rules.

────────────────────────────────────

## Step 5 — Verify

Run

- yarn typecheck
- yarn lint
- yarn build

Perform targeted manual testing of the affected production flow.

────────────────────────────────────

## Step 6 — Deploy

Follow

../instructions/git-workflow.md

Hotfix branches are created from `main`.

After verification:

Hotfix branch

↓

Merge into `main`

↓

Merge back into `dev`

↓

Automatic Vercel deployment

────────────────────────────────────

## Step 7 — Post Incident

After production is stable

- Create or update the Plane task
- Document root cause
- Document corrective action
- Identify follow-up improvements
- Update documentation if required

────────────────────────────────────

## Step 8 — Delivery Summary

Prepare

- Incident summary
- Root cause
- Resolution
- Files changed
- Verification
- Manual actions
- Follow-up work
- Suggested branch
- Suggested commit

If no manual action is required, explicitly state

"No manual action required."

────────────────────────────────────

## Related Documents

- ../README.md
- bugfix.md
- ../instructions/git-workflow.md → Hotfix Workflow (rollback/branch behaviour)
- ../instructions/coding-standards.md
- ../instructions/architecture.md

────────────────────────────────────

## Requirements

Keep this workflow concise.

Prioritize recovery over perfection.

Reference existing documentation instead of repeating it.

After writing the document, review it against the repository.

Report improvements separately without modifying the document.