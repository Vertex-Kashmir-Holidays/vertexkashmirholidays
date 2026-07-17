This Skill defines how database schema changes are implemented in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not a generic Prisma tutorial.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# Prisma Migration

Version: 1.0.0

Last Updated: 2026-07-17

## Typical Scope

Small
- Add field
- Add index
- Nullable column

Medium
- New model
- New relation
- Enum update

Large

- Model split
- Breaking schema change
- Data migration
- Production migration requiring coordination

## Purpose

This Skill defines the standard process for changing `prisma/schema.prisma` safely in Vertex — so a migration never silently breaks an existing populated table, never leaves production and the local schema out of sync, and never skips the RBAC/Zod/seed updates a schema change usually implies.

────────────────────────────────────

## When to Use

Use this Skill whenever a task involves:

- Adding, renaming, or removing a field or model in `prisma/schema.prisma`.
- Adding a new value to `LeadStatus`, `BookingStatus`, `ItineraryStatus`, or `Role`.
- Changing a column read by a public page, account page, or admin page.
- Adding a new model that needs to be reachable from the admin CMS (this always implies RBAC module registration — see Engineering Rules).
- Modifying any field on `Tour` or `Campaign` that stores JSON inside a `String` column.
- Adding an index needed by a `where`/`orderBy` in an existing API route.

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- Data-only updates (no schema change).
- Seed-only changes (`prisma/seed.ts`) where the schema itself is untouched.
- Query optimization that doesn't change the schema.
- Application logic changes with no Prisma model involved.

────────────────────────────────────

## Prerequisites

Before touching `schema.prisma`:

- Understand the business requirement — check `../context/business-rules.md` if the change affects booking, payment, lead, or customer behaviour.
- Read the current model definition and its existing indexes/relations in `prisma/schema.prisma`.
- Check `prisma/seed.ts` for the model's current seed shape — it must stay in sync with the new schema.
- Confirm whether the change needs to reach the production Neon database, or is a local/dev-only experiment (this repo runs two separate Neon databases — see Database Safety below).

────────────────────────────────────

## Vertex Standard Workflow

1. **Edit `prisma/schema.prisma`.** Any new column on an already-populated table must be nullable (`String?`) or carry `@default(...)` — a non-nullable column with no default fails `db:push`/`migrate` against existing rows. Add `@index` for any field used in a `where`/`orderBy` in an existing route.
2. **Choose the apply command:**
   - `yarn db:push` — development only, no migration file recorded.
   - `yarn db:migrate` — creates and applies a real migration (`prisma migrate dev`); this is the only command that produces a file under `prisma/migrations/`.
3. **Update the Zod schema(s)** in the affected API route(s) — the `createSchema` (POST) and, separately, the `patchSchema` (PATCH) if it's an editable field. These are two different schemas; a field added to one and not the other silently breaks that endpoint (see Common Mistakes).
4. **Update Prisma `select` projections** in any `findMany`/`findUnique` that needs the new field — list pages select a subset of columns deliberately (see `../instructions/coding-standards.md` → Database Standards).
5. **Update `prisma/seed.ts`** — add the field to the relevant create/upsert block. For singleton models (`SiteSettings`, `HomeContent`, `AboutContent`, `ContactContent`, `BlogContent`), add it to the `create` side of the `upsert` only — never touch the `update` side for content models that intentionally preserve admin edits (see Common Mistakes).
6. **Run `yarn db:seed`** to apply the seed change locally.
7. **If this is a new admin-visible model**, add its key to `MODULES` in `src/lib/rbac.ts` and add the corresponding `RolePermission` seed rows (ADMIN/SALES/EDITOR) in `prisma/seed.ts`, then re-run `yarn db:seed`.
8. **Check downstream consumers** — see Engineering Rules → Downstream Consumers below.
9. **Commit the migration file** produced by `yarn db:migrate` — never leave a schema change as `db:push`-only (see `../instructions/coding-standards.md` → Database Standards).

────────────────────────────────────

## Engineering Rules

- Never run `prisma migrate reset` or drop a schema against the production database.
- Always commit the generated migration file — a schema change that only exists as a local `db:push` is not considered done.
- Keep each migration focused on one logical schema change.
- Review the generated SQL before applying it, especially for a column type change or a dropped column.
- Prefer additive changes (new nullable column, new table) over destructive ones (drop column, narrow a type) — a destructive change needs explicit approval, not just a passing test suite.
- String-encoded JSON columns (`gallery`, `itinerary`, `inclusions`, `exclusions`, `faqs`, `highlights` on `Tour`; the equivalent set on `Campaign`) are declared `String`, never Prisma's `Json` type — this is a deliberate, repository-wide convention (see `../instructions/coding-standards.md` → JSON Columns), not an oversight to "fix." `Itinerary.data` is the one model that genuinely uses `Json` — don't generalize from it.

**Downstream consumers to check after any schema change:**
- **Public pages** (`src/app/(public)/`) — any `findMany`/`findFirst` on `Tour`, `Blog`, `Destination`, or `Campaign` must keep `where: { published: true }`.
- **Account pages** (`src/app/account/`) — every query stays scoped to `where: { userId: session.user.id }`; a new field must never expose another user's data.
- **Admin pages** (`src/app/admin/`) — update the RSC's `select` projection and the corresponding `*Client.tsx` component's TypeScript interface.
- **JSON-string columns** — add or update the `parseJson` call (with fallback) at every read site for a changed column shape.

────────────────────────────────────

## Database Safety

This repository uses **two separate Neon databases** — development and production. They are not automatically kept in sync; a migration applied to one does not touch the other.

- **Development database** — `yarn db:push`, `yarn db:migrate`, and schema experimentation are all fine here.
- **Production database** — reached only through a committed migration applied via the deploy pipeline, never through an ad hoc `db:push`. Never run `prisma migrate reset` or any destructive operation against it — it holds live bookings, payments, leads, and customer accounts.

Before editing `schema.prisma`, answer:

1. Does this change need to reach production, or is it a local experiment?
2. If it needs to reach production, does a real migration file already exist for it (from `yarn db:migrate`), or only a local `db:push`?
3. Is the new column nullable / defaulted, so it won't fail against production's existing rows?
4. Has `npx prisma migrate status` been checked to confirm production isn't already out of sync before adding another migration on top?

Do not proceed to a production deploy until all four have real answers.

────────────────────────────────────

## Common Mistakes

Observed failure modes in this repository's actual patterns — not generic Prisma advice:

- **Non-nullable column with no default added to a populated table** — blocks `db:push`/`migrate`. Always nullable or `@default(...)` for new columns on existing models.
- **Forgetting to update `patchSchema`** — a field added to the Prisma model but missing from the PATCH route's Zod schema means the admin UI appears to save the field, but the value is silently never written.
- **Declaring a JSON-holding column as `Json` instead of `String`** — breaks the `JSON.parse`/`JSON.stringify`-with-fallback convention every `Tour`/`Campaign` consumer expects.
- **A new enum value not reflected in an admin status-display map** — admin Client components hardcode status badge colors and allowed-transition buttons; a new `LeadStatus`/`BookingStatus`/`ItineraryStatus` value renders unstyled or silently drops out of the transition UI until those maps are updated too.
- **Overwriting admin-edited singleton content via seed** — some content singletons intentionally use an empty `update: {}` block in their `upsert` so re-running the seed never clobbers what staff have edited in the CMS. Don't "fix" this into a populated update block without deliberately deciding that's what you want.
- **A new public-facing query missing `published: true`** — the single most consequential mistake this convention exists to prevent; it leaks draft content to anonymous visitors.

────────────────────────────────────

## Verification

- `yarn typecheck` — catches Zod/Prisma type mismatches between the schema and the route.
- `yarn lint`
- `yarn build` — full compile, including `prisma generate`.
- For any change reaching a public page: `yarn dev` and visually confirm the affected route renders correctly with the new field.
- For a production-bound change: `npx prisma migrate status` confirms the migration history is clean before and after.

There is no automated test suite in this repository today — verification above is currently the full bar, not a placeholder for "also run the tests."

────────────────────────────────────

## Delivery Summary

Every completed migration should report:

- Business reason for the change.
- Models/fields changed.
- Migration name (from `yarn db:migrate`).
- Files modified (schema, affected routes, seed, RBAC if applicable).
- Manual deployment steps, if any (e.g. confirming the migration applied to production before the next deploy).
- Environment variable changes, if any.
- Verification performed.

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Related Documents

- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
- `../workflows/refactor.md`
