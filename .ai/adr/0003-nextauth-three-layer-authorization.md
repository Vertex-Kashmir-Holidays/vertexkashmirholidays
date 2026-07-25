# 0003 — NextAuth v5 with three-layer authorization

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

The app serves three audiences from one codebase — public visitors, signed-in
customers (`/account`), and staff (`/admin`) — with role-differentiated
capabilities. It supports password login for staff and customers plus two Google
paths (OAuth redirect and One Tap) as a customer-only convenience. We needed one
auth foundation and an authorization model that no single bypass could defeat.

## Decision

Use **NextAuth v5** as the single authentication foundation, with the Prisma
adapter persisting users, sessions, and accounts. All three sign-in paths
(credentials, Google OAuth, Google One Tap) resolve to the **same session
shape** (`role`, `mustChangePassword`).

Authorization is enforced in **three independent layers**:

1. **Edge middleware** — coarse route gating.
2. **The admin layout** — a second gate for the `/admin` tree.
3. **`requirePermission(module, action)`** (or `requireStaff()`) inside each
   Route Handler — the real, per-operation enforcement, checked first and
   returned early on failure.

Roles and permissions are stored in the database (RBAC), not hard-coded. Google
sign-in is a customer-only path: the sign-in callback rejects any staff role or
disallowed email domain and never provisions a staff account.

## Consequences

- Defense in depth: middleware and the layout are early filters, but a route is
  never considered protected unless it runs its own `requirePermission` check.
  The three layers must not be collapsed into one.
- RBAC being DB-driven means roles/permissions can change without a code deploy.
- Every Route Handler carries an explicit authorization line — verbose, but the
  verbosity is the safety property.

## Alternatives considered

- **Middleware-only authorization** — rejected: a single misconfigured matcher
  would expose every route behind it. The per-route check must exist regardless.
- **Hard-coded roles in code** — rejected: changing access would require a
  deploy, and the CRM needs role management as data.
- **A separate auth service** — unjustified overhead for a 1–2 developer team;
  NextAuth in-app meets the need.
