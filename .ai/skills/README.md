This document explains what a Skill is in the Vertex Kashmir Holidays engineering platform, how it differs from an Instruction or a Workflow, and how to use or add one.

This is an orientation document for `.ai/skills/`, not a Skill itself — it is not read by the Planner/Implementer/Reviewer agents' "Skills" list.

────────────────────────────────────

# Skills

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

A Skill captures repository-specific implementation knowledge for one recurring category of change — how Vertex actually builds a booking-finance calculation, an admin CRUD module, a schema migration, an analytics event, an API route, or a CRM/admin ticket, given the conventions, files, and pitfalls that already exist in this codebase. A Skill exists so that the fifth engineer (or the fifth AI-assisted session) to touch a given pattern doesn't have to rediscover its shape from scratch, and so every instance of that pattern stays consistent instead of drifting one hand-rolled variant at a time.

────────────────────────────────────

## What is a Skill?

A Skill is a step-by-step, repository-aware implementation guide for one recurring pattern: when to use it, what to read first, the build order, the mistakes this specific codebase has actually made with this pattern before, and how to verify the result.

A Skill is **not**:

- **A generic framework or library tutorial.** It assumes the reader already knows Next.js, Prisma, React, and Zod — it documents Vertex's specific conventions layered on top of that knowledge (e.g. _this repo's_ JSON-string-column convention), not how Prisma or Next.js work in general.
- **A substitute for reading the actual code it references.** Every Skill points at real files (`src/lib/rbac.ts`, `prisma/schema.prisma`, a canonical existing module) — the Skill orients the reader toward those files, it doesn't replace them.
- **A static, load-once document.** A Skill must be corrected the moment it's found to describe removed or renamed code — this already happened once: `crm-ticket.md` originally referenced an `ALLOWED_TRANSITIONS` map and `/api/inquiries/*` routes that no longer exist, and was corrected against the live codebase during its 2026-07-17 port from `.claude/skills/`, rather than preserved as stale history.
- **A place for one-off or non-recurring implementation notes.** Something that will only ever happen once belongs in a PR description, a commit message, or a project memory — not a Skill. A Skill is only worth writing for a pattern that recurs.
- **A replacement for `instructions/coding-standards.md` or `instructions/architecture.md`.** Those define permanent, repository-wide rules. A Skill applies those rules to one specific recurring shape of change and adds the pattern-specific detail the general instructions don't cover.

────────────────────────────────────

## Relationship with the Engineering Platform

Skills are one of the five subdirectories under `.ai/` (`agents/`, `instructions/`, `skills/`, `workflows/`, `context/`, `templates/` — see `../README.md` → Directory Structure), and they sit downstream of the other engineering documents, not beside them as an independent source of truth:

- **Instructions** (`coding-standards.md`, `architecture.md`, `git-workflow.md`) define permanent, repository-wide rules that apply to every change, regardless of pattern. A Skill must never contradict an Instruction — where a Skill restates a rule (e.g. the three-layer RBAC model, the JSON-column convention), it is applying that rule to one pattern, not creating a competing version of it.
- **Workflows** (`feature.md`, `bugfix.md`, `hotfix.md`, `refactor.md`) sequence the overall engineering process — branch, implement, verify, document, commit — and delegate to a Skill for the implementation mechanics of a specific pattern via their "Skills Required" step. A Workflow orchestrates; a Skill implements.
- **Agents** (`agents/planner.md`, `implementer.md`, `reviewer.md`) are the roles that read Instructions, Workflows, and Skills to plan, build, and review a task. Each agent document hardcodes the current Skill list under its own "Skills" heading — **a new Skill file must be added to all three agent documents' lists to actually be discovered**; dropping a file into `.ai/skills/` alone does not make an agent aware of it.
- **Context** (`project-overview.md`, `business-rules.md`, `tech-stack.md`) explains what the project is and what already exists in it. A Skill assumes the reader has read the relevant Context, and references it rather than re-explaining it.

In short: Context explains the project, Instructions set permanent rules, Workflows sequence the process, Skills supply pattern-specific implementation knowledge, and Agents are the roles that read all four to do the work.

────────────────────────────────────

## Anatomy of a Skill

Every file in this directory follows the same shape, so a reader who knows one Skill can navigate any other:

1. A short framing paragraph (before the first divider) stating what the Skill covers and that it's repository-specific, not generic tutorial content.
2. **Purpose** — why the Skill exists.
3. **When to Use** / **When NOT to Use** — the boundary against neighboring Skills (e.g. `crm-ticket.md` explicitly defers to `admin-crud.md` for a full new module, rather than duplicating its build steps).
4. **Prerequisites** — the specific files to read before writing any code.
5. A workflow section (named `Vertex Standard Workflow`, `Implementation Order`, or similar) — the concrete build sequence.
6. **Engineering Rules** — non-negotiable constraints specific to this pattern.
7. **Common Mistakes** — failure modes actually observed in this repository, not generic advice.
8. **Verification** — the exact commands to run, plus what to manually check.
9. **Delivery Summary** — what a completed instance of this pattern should report.
10. **Related Documents** — cross-links to the Instructions, Context, and other Skills involved.

Not every Skill uses every optional section (e.g. `booking-finance.md` adds a `Financial Ownership` section; `api-route.md` adds `Authentication & Authorization`) — the ten above are the load-bearing shape, domain-specific detail is added in between.

────────────────────────────────────

## Current Skills

| Skill                 | Covers                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-crud.md`       | Building a first-class Admin CRUD module — its own sidebar entry, RBAC key, API route pair, list/create/edit pages.                                                                                               |
| `api-route.md`        | The Route Handler pattern shared by every API endpoint — public, admin, account, and webhook.                                                                                                                     |
| `analytics-event.md`  | Adding a new client- or server-side tracked event (GA4/GTM/Meta Pixel/CAPI/Google Ads offline conversions).                                                                                                       |
| `booking-finance.md`  | Booking pricing, discount, and payment calculations — the shared finance utilities that must not be recomputed inline.                                                                                            |
| `crm-ticket.md`       | Orienting a CRM/admin/business-workflow ticket — identifying the owning surface and RBAC module before deciding whether it needs `admin-crud.md`'s full build sequence or a smaller change to an existing module. |
| `prisma-migration.md` | Changing `prisma/schema.prisma` safely — nullable/defaulted columns, migration commands, downstream consumers, the dev/production Neon database split.                                                            |

────────────────────────────────────

## Adding a New Skill

Only add a Skill for a pattern that will genuinely recur — see What is a Skill? above. To add one:

1. Confirm no existing Skill already covers it (check the table above and each file's "When to Use"/"When NOT to Use").
2. Follow the shape in Anatomy of a Skill.
3. Verify every file path, function name, and code example against the current codebase — don't assume a pattern documented elsewhere in `.ai/` is still accurate; grep for it.
4. Add the new file to the Skills list in all three of `agents/planner.md`, `agents/implementer.md`, and `agents/reviewer.md` — see Relationship with the Engineering Platform above.
5. Add it to the Current Skills table in this document.

────────────────────────────────────

## Related Documents

- `../README.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../workflows/feature.md`
- `../agents/planner.md`
- `../agents/implementer.md`
- `../agents/reviewer.md`
