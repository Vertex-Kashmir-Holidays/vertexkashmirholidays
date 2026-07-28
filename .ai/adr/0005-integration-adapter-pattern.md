# 0005 — Adapter pattern for external integrations

Status: Accepted

Date: 2026-07-25

Deciders: Vertex Engineering Team

<!-- Retroactive ADR: records a decision already in force across the codebase. -->

## Context

The platform talks to several external services — Cloudinary, Razorpay,
Google/Meta ad-conversion APIs, Upstash, Turnstile — and expects to add more ad
platforms and notification providers over time. Two failure modes we want to
avoid: vendor SDK calls scattered through routes and components, and a missing
credential taking down a request path in an environment where that integration
isn't configured (notably local development).

## Decision

Each external service is reached through **one dedicated module** (e.g.
`lib/storage.ts`, `lib/ratelimit.ts`, `lib/security/turnstile.ts`) — never
instantiated ad hoc in a route or component.

Multi-provider integrations follow a shared **adapter shape**: a common
interface, an `isConfigured()` guard, and a `send()`/upload method per provider.
The offline-conversion adapters
(`lib/offlineConversion/adapters/{google,meta,microsoft}.ts`) are the reference
implementation. Every adapter **no-ops gracefully** when its env vars are
absent.

## Consequences

- Callers depend on an interface, not a vendor SDK, so adding or swapping a
  provider touches one file.
- Graceful no-op keeps local development zero-setup and prevents a missing env
  var from crashing a request; the tradeoff is that a misconfigured production
  integration fails quietly rather than loudly, so environment setup must be
  verified explicitly (this is called out for Turnstile and rate limiting).
- An interface may exist before its credentials do — the Microsoft/Bing adapter
  is a real interface with a `TODO` upload. That's an acceptable intermediate
  state, not production-ready; don't route real traffic through a scaffold.

## Alternatives considered

- **Calling vendor SDKs directly where needed** — rejected: spreads
  provider-specific code everywhere and makes swapping a provider a
  repo-wide edit.
- **A heavyweight plugin/registry framework** — unjustified for the current
  handful of providers; the plain interface + `isConfigured()` guard is enough.
