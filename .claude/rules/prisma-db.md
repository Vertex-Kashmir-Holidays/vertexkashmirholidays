---
description: Prisma and database conventions
globs: ["prisma/**", "src/lib/prisma.ts", "src/app/api/**/*.ts", "src/lib/**/*.ts"]
---

# Prisma and database conventions

## Single client instance

All database access goes through the singleton in `src/lib/prisma.ts`. Never call `new PrismaClient()` elsewhere. Import as:

```ts
import { prisma } from "@/lib/prisma";
```

## String-encoded JSON columns — parse with a fallback

Several `Tour` and `Campaign` fields are declared as `String` (not Prisma `Json`) but hold JSON arrays. Always parse them with a try/catch fallback:

```ts
function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

const gallery = parseJson<string[]>(tour.gallery, []);
const faqs    = parseJson<{ question: string; answer: string }[]>(tour.faqs, []);
```

When writing these fields, always `JSON.stringify` the value. Zod schemas for these routes accept them as `z.string()` (the raw JSON string), not as `z.array(...)`.

**Affected columns on `Tour`:** `gallery`, `itinerary`, `inclusions`, `exclusions`, `faqs`, `highlights`  
**Affected columns on `Campaign`:** `facts`, `strip`, `stats`, `highlights`, `activities`, `itinerary`, `tiers`, `batches`, `inclusions`, `exclusions`, `gallery`, `testimonials`, `faqs`

## Select only needed fields in list queries

Avoid loading entire rows when listing. Use `select` to project only the columns the UI needs. This is the established pattern in every list page (e.g. `AdminPackagesPage` selects `id, title, slug, category, ...`).

## Singleton rows

`SiteSettings`, `HomeContent`, `AboutContent`, `ContactContent`, `BlogContent` each have exactly one row with `id: "singleton"`. Use `findUnique({ where: { id: "singleton" } })` to read and `upsert` to write. Never `create` a second row.

## Cursor-based pagination for public list endpoints

Public API endpoints (e.g. `GET /api/tours`) use cursor pagination: fetch `take + 1` rows, check `hasMore`, return `nextCursor`. Do not add offset/skip-based pagination to list endpoints that already use this pattern.

Admin list endpoints use offset (`skip`/`take` with page numbers) — do not mix the two patterns.

Any Prisma query on `Tour`, `Blog`, `Destination`, or `Campaign` in a public route or public RSC must include `where: { published: true }`. Draft content must never reach anonymous visitors. (Full boundary rules in `.claude/rules/public-admin-boundary.md`.)

## P2002 = unique constraint violation

Catch Prisma errors and check the message for `"P2002"` to detect duplicate slug/email conflicts. Return a `409` with a human-readable message. This is the existing pattern in tour and blog route handlers:

```ts
if (msg.includes("P2002")) {
  return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
}
```

## Schema changes follow the migration workflow

```bash
# Development: push schema without a migration file
yarn db:push

# When ready to record a migration
yarn db:migrate   # prisma migrate dev
```

Never run `prisma migrate deploy` in development. Never edit a migration file that has already been applied. All queries use the Prisma client API — avoid `$queryRaw`/`$executeRaw`.
