# 0006 — Business logic in `lib/<domain>`, finance single-sourced

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

Business rules — pricing, GST, discounts, lead deduplication, customer
resolution — are needed in more than one place: the Route Handler that writes a
value and the UI that displays a derived one. Computed inline and duplicated,
these drift, and two copies of a money calculation eventually disagree.

## Decision

Business logic lives in **`src/lib/<domain>/`** (e.g. `lib/bookings/finance.ts`,
`lib/payments/gst.ts`, `lib/leads/schema.ts`) — never inside a component, and
never inlined twice.

**Financial calculations have a single source of truth**: the shared utilities
`computeBookingFinance`, `computeDiscountAmount`, and `resolveGst`. No component
or route computes a discount, GST amount, or balance independently.

A Route Handler delegates any real business logic (pricing, dedup, customer
matching) to a named `lib/<domain>` function; simple single-table CRUD may stay
inline in the handler.

## Consequences

- A value written by the API and the same value shown in the UI are computed by
  the same function, so they always agree.
- Business rules are testable and changeable in one place.
- Not yet universal — some Route Handlers still call `prisma.<model>.create/update`
  directly for logic that should be a named domain function. That gap is tracked
  (see `../instructions/architecture.md` → Data Flow); the target is that any
  operation with real business logic goes through `lib/<domain>`.

## Alternatives considered

- **Logic in components / inline in routes** — the drift problem above; rejected.
- **A single monolithic services layer** — rejected in favour of
  domain-oriented folders, which keep related logic together and match how the
  rest of `lib/` is organised.
