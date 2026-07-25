# 0002 — Prisma + PostgreSQL (Neon) with separate dev/prod databases

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

The platform needs a relational store for leads, bookings, customers, payments,
and content, with strong typing across a TypeScript codebase and a deployment
target (Vercel) that has a read-only filesystem and serverless connection
constraints.

## Decision

Use **Prisma** as the ORM over **PostgreSQL hosted on Neon**. A single Prisma
client, imported as `import { prisma } from "@/lib/prisma"`, is the only way
application code touches the database — `new PrismaClient()` is never called
elsewhere. Two separate Neon databases exist: one for development, one for
production.

Every schema change ships as a committed Prisma migration (`yarn db:migrate`),
never `db:push` alone. Prisma Migrate is treated as **forward-only** — there are
no down-migrations; a change is undone by writing a new forward migration.

Raw SQL (`$queryRaw` / `$executeRaw`) is avoided unless a query genuinely cannot
be expressed through the Prisma client API.

## Consequences

- End-to-end type safety from schema to query result; the generated client is
  the source of truth for row shapes.
- One connection seam to pool and manage, which matters on serverless.
- A committed, auditable migration history — but rollbacks require a deliberate
  forward migration, and applying migrations to production is a separate, manual
  step (not run automatically on deploy). See
  `../instructions/git-workflow.md` → Rollback.
- The dev/prod split means an engineer must always confirm which database a
  migration targets before applying it.

## Alternatives considered

- **A different ORM (Drizzle, Kysely) or raw SQL** — Prisma's schema-first
  typing and migration tooling fit the team and were already adopted; switching
  is churn without benefit.
- **A single shared database** — rejected: it puts experiments and destructive
  migrations one mistake away from production data.
