# Skill: Prisma Schema Migration

## When to use

Use this skill when:
- Adding, renaming, or removing a field or model in `prisma/schema.prisma`
- Adding a new enum value to `BookingStatus`, `InquiryStatus`, `ItineraryStatus`, or `Role`
- Changing a column that is used in a public page, account page, or admin page
- Adding a new model that needs to be reachable from the admin CMS (requires RBAC module registration)
- Modifying any field on `Tour` or `Campaign` that stores JSON as a `String` column

---

## Step 1 — Read these files first

| File | What to check |
|---|---|
| `prisma/schema.prisma` | Current model, field types, enum values, indexes |
| `prisma/seed.ts` | Seed shape for the affected model — must stay in sync |
| `src/lib/rbac.ts` | `MODULES` list — required if adding a new admin-visible model |
| `src/app/api/<resource>/route.ts` | Zod schema for the affected resource — must be updated |
| `src/app/api/<resource>/[id]/route.ts` | Same for the single-resource handler |

For models with string-encoded JSON columns, also read the public page that consumes them (e.g. `src/app/(public)/tours/[slug]/page.tsx`) to understand all `parseJson` call sites.

---

## Step 2 — Classify the change

Before writing any schema change, answer:

**Is a new column nullable or does it have a default?**  
All new columns on existing populated tables must be `String?` (nullable) or carry `@default(...)`. A non-nullable column with no default will fail `db:push`/`migrate` against a database with existing rows.

**Is this a string-encoded JSON column?**  
If the field will store an array or object (itinerary, gallery, faqs, highlights, etc.), declare it as `String @default("[]")` — not `Json`. All read/write code must use `JSON.parse`/`JSON.stringify` with a try/catch fallback. This is the established pattern across `Tour` and `Campaign`.

**Is this a singleton row model?**  
`SiteSettings`, `HomeContent`, `AboutContent`, `ContactContent`, `BlogContent` each have exactly one row (`id: "singleton"`). New fields on these models never need a migration to backfill rows — the existing row is updated via `upsert` in the seed.

**Does this change a status enum?**  
Adding a value to `BookingStatus`, `InquiryStatus`, or `ItineraryStatus` requires checking:
- The Zod schema in the relevant API route
- Any `ALLOWED_TRANSITIONS` maps in admin Client components
- Any `STATUS_STYLES` display maps in admin Client components
- Any `where: { status: ... }` filter in public or account page queries

**Does this add a new top-level model (not a subresource)?**  
If the model will be managed in the admin CMS, you must also add its module key to `MODULES` in `src/lib/rbac.ts` and add `RolePermission` seed rows for ADMIN/SALES/EDITOR in `prisma/seed.ts`.

---

## Step 3 — Ordered workflow

```
1. Edit prisma/schema.prisma
   - New nullable fields or @default on all non-nullable additions
   - Add @index for any field used in where/orderBy in the API routes

2. Choose the right apply command:
   yarn db:push     ← development only; no migration file created
   yarn db:migrate  ← when you need a recorded migration (production track)

3. Update the Zod schema in the API route(s)
   - POST handler createSchema: add the new field
   - PATCH handler patchSchema: add the new field as optional/nullable

4. Update Prisma select projections
   - Any findMany with select: { ... } that needs the new field

5. Update prisma/seed.ts
   - Add the new field to create/upsert data objects
   - For singleton models: add to the create block of the upsert
   - For new models: add a new upsert/createMany block; never re-create rows that may have been edited in the admin

6. Run yarn db:seed to apply seed changes

7. If new admin module:
   - Add key to MODULES in src/lib/rbac.ts
   - Add RolePermission rows for ADMIN, SALES, EDITOR in seed.ts
   - Re-run yarn db:seed

8. Update downstream consumers (see below)
```

---

## Step 4 — Check downstream consumers

After the schema change, grep for uses of the affected model/field and check each:

**Public pages** (`src/app/(public)/`):
- Ensure `published: true` filter is still in place on any query that touches `Tour`, `Blog`, or `Campaign`
- If you added a field used in a public RSC, the `revalidate` window (default 300 s) means old data will persist until ISR regeneration — confirm this is acceptable

**Account pages** (`src/app/account/`):
- All queries must remain scoped to `where: { userId: session.user.id }` — a new field must not expose other users' data

**Admin pages** (`src/app/admin/`):
- Update the `select` projection in the page RSC if the admin list or detail needs the new field
- Update the `*Client.tsx` component's TypeScript interface to include the new field

**String-encoded JSON columns** — if you added a new JSON-as-string column, add a `parseJson` call in every consumer. If you changed the shape of an existing JSON column (e.g. added a key to itinerary objects), update all `parseJson` type parameters and the admin editor's default data in `src/components/admin/itinerary/default-data.ts` if relevant.

---

## Validation

There is no test suite. Validate with:

```bash
yarn typecheck       # catches Zod/Prisma type mismatches
yarn lint            # catches obvious issues
yarn build           # full compile + Prisma generate
```

For any change to a public page, also run `yarn dev` and visually confirm the affected route renders without error and the new field is displayed correctly.

---

## Repo-specific risks

**Non-nullable column with no default on an existing table.** This will block `db:push` if the table has rows. Always use nullable or `@default` for new columns.

**Forgetting to update the Zod `patchSchema`.** A field added to the Prisma model but missing from `patchSchema` means the PATCH endpoint silently ignores it. The admin UI will appear to save but the value is never written.

**String-encoded JSON column declared as `Json` type.** The entire codebase uses `String` for JSON columns on `Tour` and `Campaign`. Using `Json` type would break the `JSON.parse`/`JSON.stringify` pattern and may cause Prisma type mismatches.

**New enum value not reflected in status display maps.** Admin Client components that render status badges or allowed-transition buttons have hardcoded maps. A new enum value renders as unstyled or is silently dropped from the transitions UI.

**Seed overwrites admin-edited content.** The seed uses `upsert` with `update: {}` (empty) for legal pages and some content singletons — intentionally never overwriting admin edits. Do not change `update: {}` to a populated update block for these rows without explicit intent.

**New model with a public-facing query missing `published: true`.** Any `findMany` on `Tour`, `Blog`, `Destination`, or `Campaign` in a public RSC or public API route must include `where: { published: true }`. Missing this exposes draft content to the public.


---

# Step 5 — Development vs Production Database Safety

## Repository Context

Vertex Kashmir Holidays uses TWO separate databases.

### Development Database

Used locally.

Allowed:

- prisma db push
- prisma migrate dev
- schema experiments

### Production Database

Used by:

- Vercel Production
- Live CRM
- Live Customers
- Bookings
- Leads
- Payments

Never:

- prisma migrate reset
- DROP SCHEMA
- destructive operations

---

## Mandatory Questions Before Editing schema.prisma

Before changing any Prisma model, answer:

1. Is this Development-only?
2. Will this change reach Production?
3. Does a migration need to be created?
4. Does Production Neon need synchronization?
5. Is Vercel deployment safe after this change?

Do not continue until all questions are answered.

---

## Production Deployment Checklist

If schema.prisma changed:

### Verify

```bash
npx prisma migrate status
```