# Vertex AI Engineering Platform

Version: 1.0.0

Last Updated: 2026-07-17

If you are assisting with development in this repository:

## Read in this order

1. README.md
2. context/project-overview.md
3. context/business-rules.md
4. context/tech-stack.md
5. instructions/coding-standards.md
6. instructions/architecture.md
7. instructions/git-workflow.md

---

## Before implementing anything

Identify whether the task is:

- Feature
- Bug Fix
- Hotfix
- Refactor

Then follow the matching workflow in:

workflows/

---

## Identify the relevant Skill

Skills are a distinct, later-consulted step — not something to check alongside reusable components (see `skills/README.md` → Relationship with the Engineering Platform for the full Context → Instructions → Workflow → Skill → Implementation chain).

Once the Workflow is selected, check `skills/README.md`'s Current Skills table for one that matches the task's shape (admin CRUD module, API route, schema migration, analytics event, booking finance, CRM/admin ticket). If one applies, read it before writing any code. If none applies, say so explicitly rather than silently skipping the step.

---

## Reuse before creating

Always check:

- Existing components
- Existing utilities
- Existing services

Do not duplicate implementation.

---

## Deliverables

Every completed task should include:

- Summary
- Files changed
- Verification
- Manual actions
- Suggested commit

---

The `.ai` directory is the single source of engineering knowledge for this repository.