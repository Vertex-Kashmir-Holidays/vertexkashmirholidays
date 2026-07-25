# 0001 — Route Handlers over Server Actions

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

Next.js offers two ways to mutate server state from the App Router: **Route
Handlers** (`src/app/api/**`, called from the client with `fetch`) and **Server
Actions** (`"use server"` functions invoked directly from components). Both are
valid; using both in one app means two mutation styles with different
validation, authorization, and error-handling ergonomics.

This codebase grew ~100 Route Handlers under `src/app/api/**` with a consistent
shape, and `"use server"` does not appear anywhere. We needed to decide whether
that convention is the standard or an accident.

## Decision

All server mutations go through **Route Handlers**, called from the client with
`fetch()` wrapped in `useTransition()`. Server Actions are **not used**.

Every Route Handler follows the same shape: validate input with Zod, authorize
with `requirePermission` (or `requireStaff`), delegate real business logic to a
`lib/<domain>` function, and return typed JSON that never leaks internal errors.

Adopting Server Actions later is possible but would be a deliberate,
project-wide decision recorded in a superseding ADR — not introduced one feature
at a time.

## Consequences

- One mutation style to learn, secure, and review. The HTTP boundary is
  explicit, so the Zod-validate + authorize sequence is always visible in the
  same place.
- Slightly more boilerplate per mutation than a Server Action (an API route
  file plus a client `fetch`), which we accept in exchange for consistency.
- New feature work must not reach for `"use server"` as a shortcut; doing so
  would fragment the app into two competing conventions.

## Alternatives considered

- **Server Actions everywhere** — less boilerplate, but they were not the
  established pattern here, and retrofitting ~100 existing routes purely for
  style is churn with no user benefit.
- **Both, per feature** — rejected outright: two mutation styles in one app is
  the worst outcome for maintainability and security review.
