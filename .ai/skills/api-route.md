This Skill defines the standard pattern for implementing API Routes in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not a generic Next.js Route Handler tutorial.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# API Route Pattern

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This Skill defines how a Route Handler is implemented in Vertex, so validation, authorization, error handling, and response shape stay consistent whether the route serves the public site, the admin panel, a customer account, or an external webhook.

────────────────────────────────────

## When to Use

Use this Skill whenever creating or modifying a Route Handler under `src/app/api/**` — a public endpoint, an admin endpoint, a customer/account endpoint, a webhook, or an internal callback (e.g. a Vercel Cron target).

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- Server Components or Client Components (no route involved).
- Utility/service functions in `src/lib/**` that don't handle an HTTP request directly.
- Middleware (`src/proxy.ts`) — that's edge-only and covered separately.
- A schema change with no new or modified route (`prisma-migration.md` covers that).
- A new first-class admin module's route pair (`admin-crud.md` covers the full module, including its two routes).

────────────────────────────────────

## Prerequisites

Before writing a route, identify which of the four categories it falls into — each has a different auth shape:

- **Public** (e.g. `GET /api/tours`, `GET /api/destinations`) — no guard, but any query on `Tour`/`Blog`/`Destination`/`Campaign` must filter `where: { published: true }`.
- **Admin/staff** (e.g. anything under a module like leads, bookings, users) — guarded with `requirePermission(module, action)` or `requireStaff()` for a non-module route.
- **Customer/account** (e.g. `/api/account/**`) — guarded with `auth()`, scoped to `where: { userId: session.user.id }`; does **not** use `requirePermission` (that's staff-only).
- **Webhook/callback** (e.g. the Razorpay webhook, the Connect retention cron target) — no session at all; verified instead by a signature (HMAC) or a shared secret, not by `requirePermission`.

Also check: is there already a similar route in this domain to match the shape of? Is a Prisma schema change required (→ `prisma-migration.md`)? Does `../context/business-rules.md` define behaviour this route must respect (pricing, GST, lead dedup, etc.)?

────────────────────────────────────

## Typical Effort

Small

- Add one endpoint
- Add validation
- Add one query parameter

Medium

- Create CRUD route pair
- Add authentication
- Add authorization
- Add webhook

Large

- Payment flow
- Multi-step transaction
- External integrations
- Multi-route feature

────────────────────────────────────

## Vertex Standard Workflow

1. Parse the body — `try { body = await request.json() } catch { return 400 "Invalid JSON" }`.
2. Validate with a Zod schema — `createSchema` for POST (required fields as appropriate), `patchSchema` for PATCH (the same fields, all `.optional()`/`.optional().nullable()`, so a partial update never has to resend the whole record).
3. Authorize — `requirePermission(module, action)` / `requireStaff()` / `auth()` depending on the category above. Check `instanceof NextResponse` immediately and return early; don't call `auth()` again separately if `requirePermission` already ran.
4. Execute business logic through the shared domain function where one exists (`computeBookingFinance`, `resolveGst`, `resolveLeadCustomer`, etc.) — never recompute money or re-derive a customer match inline in the route.
5. Access Prisma — `select` only the columns the response needs; wrap multi-step writes in `prisma.$transaction`.
6. Return a consistent JSON response — the created/updated record on success, `{ error: string }` (or `parsed.error.flatten()` for a validation failure) on failure. Never return a raw Prisma error message or a stack trace.
7. Verify (see below).

────────────────────────────────────

## Engineering Rules

- Route Handlers only — see `../instructions/coding-standards.md` → Next.js Mutation Standard.
- Never access Prisma from a Client Component.
- Validate every request with Zod before touching anything else — never trust client input, especially a client-sent amount. Price, GST, and chargeable amount are always computed server-side (`src/lib/bookings/finance.ts`, `src/lib/payments/gst.ts`).
- `params` is a `Promise` in Next.js 16 — always `await` it before destructuring.
- Wrap a multi-step write in `prisma.$transaction`. This is followed for lead conversion, lead unlock, and itinerary updates — the payment-verification path (`verify-payment`/`webhook`/`reconcile`) is the one confirmed exception, tracked as a backlog item, not a pattern to copy.
- Rate-limit endpoints that are abuse-prone or public-facing (login, OTP request/verify, booking creation, lead submission) via `src/lib/ratelimit.ts`; verify Cloudflare Turnstile on public forms via `src/lib/security/turnstile.ts` where the endpoint already does.
- Catch a Prisma unique-constraint violation by checking the error message for `"P2002"` and return `409` with a human-readable message — the established pattern for slug/email conflicts.
- Keep Route Handlers focused on request orchestration. Business logic belongs in shared domain utilities under `src/lib/**`, not inside the Route Handler itself.

────────────────────────────────────

## Authentication & Authorization

- **Public routes** — no guard; rely on the `published: true` filter instead.
- **Admin/staff routes** — `requirePermission(module, action)` (module keys come from `MODULES` in `src/lib/rbac.ts`), or `requireStaff()` for a route not tied to a specific module (e.g. uploads). `SUPERADMIN` bypasses the permission table inside these helpers already — never add a separate `if role === "SUPERADMIN"` branch.
- **Customer/account routes** — `auth()` directly, then scope every query to the session's `userId`. Never call `requirePermission` here; that's a staff-only concept.
- **Webhooks** — verified by signature/secret (e.g. Razorpay's HMAC check on the webhook payload), not by session.
- The middleware (`src/proxy.ts`) only confirms staff-vs-non-staff at the edge — it is not a substitute for the route-level check above; see `../instructions/coding-standards.md` → Security for the full three-layer model.

────────────────────────────────────

## Validation

- Zod schemas: a `createSchema` per POST, a `patchSchema` per PATCH (same shape, made partial). Share a schema between the form and the route rather than re-declaring it in both places wherever one already exists for the domain (e.g. `src/lib/leads/schema.ts`, `src/lib/admin/campaignSchema.ts`).
- `Tour`/`Campaign` JSON-string columns are validated as `z.string()` — the raw JSON string — not `z.array(...)`; see `../instructions/coding-standards.md` → JSON Columns.
- Query-string and route-param values should be validated too, not just the body, where they drive a database query.

────────────────────────────────────

## Error Handling

Observed repository convention, not fully unified yet:

- Invalid JSON body → `400`.
- Validation failure → most routes return `422` (e.g. the leads route), but this isn't fully standardized across every route yet — a known, tracked gap ("Standardize API Response & Status Codes" in the engineering backlog), not something to treat as already-settled. Match whatever the sibling routes in the same domain already do.
- Auth/permission failure → the `NextResponse` returned directly by `requirePermission`/`requireStaff`/`auth()` (401/403) — return it as-is, don't wrap it further.
- Not found → `404` with a short message.
- Unexpected error → a generic message with a non-2xx status; never the raw error object. Log server-side; see `../instructions/coding-standards.md` → Logging for the current state of that (console-based today, structured logging is a tracked future item).

────────────────────────────────────

## Common Mistakes

- Missing validation on a query param or route param, only validating the body.
- Adding a permission check to only one of GET/POST/PATCH/DELETE and assuming it covers the others.
- Recomputing a price/GST/discount inline instead of calling the shared finance utility — creates the exact drift those utilities exist to prevent.
- Trusting a client-sent amount anywhere in a payment-adjacent route.
- Forgetting `await params`.
- A multi-step write left unwrapped by `$transaction`.
- Returning a different error shape than the rest of the domain's routes (breaks a client that expects `{ error }` uniformly).
- Exposing a raw Prisma/gateway error message in the response.

────────────────────────────────────

## Verification

```bash
yarn typecheck
yarn lint
yarn build
```

Then manually verify: the happy path, a validation failure, an unauthorized request (as the wrong role or logged out), and — for anything touching money — that the server-computed amount matches what's expected regardless of what the client sent.

────────────────────────────────────

## Delivery Summary

Every completed API route change should report:

- Route(s) added or changed.
- Business purpose.
- Validation added.
- Authentication/authorization category (public/admin/account/webhook).
- Database changes, if any (see `prisma-migration.md`).
- Files modified.
- Verification performed.
- Manual deployment steps, if any.
- Suggested branch name and commit message.

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Real Repository Examples

Examples of this pattern can be found in:

- src/app/api/leads/
- src/app/api/bookings/
- src/app/api/tours/
- src/app/api/auth/
- src/app/api/payments/

────────────────────────────────────

## Related Documents

- `prisma-migration.md`
- `admin-crud.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
- `../workflows/bugfix.md`
