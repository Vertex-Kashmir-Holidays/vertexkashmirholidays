# 0004 — Server-computed pricing

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

Bookings are paid for online through Razorpay. Any amount that originates in the
browser can be tampered with before it reaches the server. A payment system that
trusts a client-supplied price can be made to charge the wrong amount.

## Decision

**Prices are always computed on the server** from stored data (e.g.
`tour.priceFrom` and the shared finance utilities). The client sends *what* is
being paid for, never *how much*.

The Razorpay flow is server-verified end to end:

```
create-order   (server computes the price)
  → client completes Razorpay checkout
  → verify-payment  (HMAC signature check)
  → webhook  (async confirmation)
```

## Consequences

- A tampered client request can change *what* a user attempts to buy, but never
  the price charged for it.
- All financial values run through the shared finance utilities (see
  [ADR 0006](0006-domain-logic-in-lib.md)), so the amount charged and the amount
  displayed are computed the same way.
- New payment surfaces (additional gateways, if added) must follow the same
  rule — the server prices, the client pays. A gateway integration that accepts
  a client-sent amount is a defect, not a shortcut.

## Alternatives considered

- **Trusting a client-sent amount with server-side validation** — rejected:
  re-deriving the correct price to validate against is the same work as just
  computing it, with an extra attack surface for no benefit.
