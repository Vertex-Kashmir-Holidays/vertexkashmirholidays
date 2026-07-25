# Architecture Decision Records (ADRs)

Version: 1.0.0

Last Updated: 2026-07-25

## What an ADR is

An ADR is a short, dated record of one significant architectural decision: the
context that forced the choice, the decision itself, and the consequences we
accepted. It captures the *why* that would otherwise live only in a commit
message, an inline comment, or one person's head.

ADRs are **append-only history**. You never edit the substance of an accepted
ADR to reflect a later change of mind — you write a new ADR that supersedes it.
This is the difference between an ADR and the principles doc: the ADR records
what we decided *at a point in time*; `../instructions/architecture.md` records
what the rule *is now*.

For the curated map of the decisions that shape the system today, read
`../context/architecture-overview.md` first — it links out to each ADR here.

────────────────────────────────────

## When to write one

Write an ADR when a decision is **hard to reverse or expensive to get wrong**,
and a future engineer would reasonably ask "why is it done this way?". For
example:

- Choosing (or rejecting) a framework, library, or external service.
- Adopting or forbidding a cross-cutting pattern (e.g. Server Actions,
  a state-management approach, a new folder role).
- A security or data-integrity decision (auth model, where money is computed,
  transaction boundaries).
- Anything you find yourself defending more than once in review.

**Don't** write an ADR for reversible, local choices — a variable name, a
component split, a business rule (those live in `business-rules.md`), or a bug
fix. Keep the log small enough that reading all of it stays feasible. If in
doubt, it probably isn't an ADR.

────────────────────────────────────

## The lightweight process

1. **Copy the template** — `../templates/adr.md`.
2. **Name the file** — `NNNN-kebab-case-title.md`, where `NNNN` is the next
   free four-digit number in this directory (e.g. `0007-adopt-server-actions.md`).
   Numbers are never reused, even if an ADR is later rejected or superseded.
3. **Fill it in** — keep it to a page. Context, Decision, Consequences, and the
   Alternatives you rejected (the rejected options are often the most valuable
   part).
4. **Set the status to `Proposed`** and open it as part of the PR that makes (or
   proposes) the change. Discussion happens in the PR — no separate meeting or
   tool.
5. **On merge, set the status to `Accepted`** (or leave it `Proposed` if the PR
   is deliberately opening the question without committing yet).
6. **Add a row to the index below**, and if the decision belongs on the map,
   link it from `../context/architecture-overview.md`.

This process is intentionally small — it must never become the reason a
decision doesn't get written down. A rough ADR merged is worth more than a
perfect one that never gets written.

### Status lifecycle

```
Proposed  →  Accepted  →  Deprecated
                      →  Superseded by NNNN
```

- **Proposed** — under discussion, not yet in force.
- **Accepted** — the current decision; code should follow it.
- **Deprecated** — no longer recommended, but not replaced by a specific ADR.
- **Superseded by NNNN** — replaced; the new ADR names this one it replaces, and
  this one links forward to it. Never delete a superseded ADR — the history is
  the point.

────────────────────────────────────

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-route-handlers-over-server-actions.md) | Route Handlers over Server Actions | Accepted |
| [0002](0002-prisma-neon-postgres.md) | Prisma + PostgreSQL (Neon) with separate dev/prod databases | Accepted |
| [0003](0003-nextauth-three-layer-authorization.md) | NextAuth v5 with three-layer authorization | Accepted |
| [0004](0004-server-computed-pricing.md) | Server-computed pricing | Accepted |
| [0005](0005-integration-adapter-pattern.md) | Adapter pattern for external integrations | Accepted |
| [0006](0006-domain-logic-in-lib.md) | Business logic in `lib/<domain>`, finance single-sourced | Accepted |

New ADRs are added to the bottom of this table.

────────────────────────────────────

## Related Documents

- `../context/architecture-overview.md`
- `../instructions/architecture.md`
- `../templates/adr.md`
