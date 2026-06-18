# Skill: Add a New Admin / CRM Module

## When to use

Use this skill when adding a new first-class module to the admin panel — one that gets its own sidebar entry, its own RBAC module key, its own API route pair, and its own list/create/edit pages. Examples: a new `Voucher` model, a `Newsletter` subscriber list, a `Partner` CRM entity.

Do not use this skill for:
- Adding a field to an existing model (use `prisma-migration` skill)
- Adding a list resource to an existing page-content section like Home/About/Contact (those go through the generic `src/app/api/pages/[resource]` system)
- Standalone campaign or CMS-style pages that don't need CRUD

---

## Step 1 — Read these files first

| File | What to extract |
|---|---|
| `src/lib/rbac.ts` | The `MODULES` array — confirm the key you'll add doesn't already exist |
| `prisma/schema.prisma` | The model you'll be managing, its fields, its enums |
| `prisma/seed.ts` | The `PERMISSION_DEFAULTS` block — you'll add rows here |
| `src/app/admin/destinations/page.tsx` | Canonical list page RSC pattern |
| `src/app/admin/destinations/new/page.tsx` | Canonical create page pattern |
| `src/app/admin/destinations/[id]/edit/page.tsx` | Canonical edit page pattern |
| `src/components/admin/destinations/DestinationsClient.tsx` | Canonical list client pattern |
| `src/components/admin/destinations/DestinationForm.tsx` | Canonical form client pattern |
| `src/app/api/destinations/route.ts` | Canonical collection route pattern |
| `src/app/api/destinations/[id]/route.ts` | Canonical item route pattern |

---

## Step 2 — Decide the module's surfaces

Answer each question before writing any code.

**Does it need an admin list + create + edit?**
Yes for any entity staff manage directly (tours, destinations, blogs, bookings). No for derived/read-only views that are computed from other data.

**Does it need a public page?**
Only if visitors browse or view this entity. Tours → yes. Destinations → yes. Inquiries → no. Bookings → no (customer account only). If yes, the public page always filters `published: true` and uses `revalidate = 300`.

**Does it need a customer account page?**
Only if logged-in customers own records of this type (bookings, itineraries). If yes, all queries must be scoped to `where: { userId: session.user.id }`.

**Does the entity have a `published` boolean?**
If staff controls visibility, add `published Boolean @default(false)` to the schema and filter it on every public query.

**Does the entity have a status enum?**
If yes, plan for: Zod `z.enum` in both route schemas, `STATUS_STYLES` display map in the client, `ALLOWED_TRANSITIONS` map if staff can change status, and matching display in any account page that shows this data.

---

## Step 3 — Task map (produce this before coding)

```
Module key: <key>         ← must be added to MODULES in rbac.ts
Prisma model: <Model>
Has published field: yes | no
Has status enum: <EnumName> | no

Files to create:
  prisma/schema.prisma                          ← model definition
  src/app/api/<resource>/route.ts               ← GET (list) + POST (create)
  src/app/api/<resource>/[id]/route.ts          ← GET + PATCH + DELETE
  src/app/admin/<module>/page.tsx               ← list RSC
  src/app/admin/<module>/new/page.tsx           ← create page (no DB access)
  src/app/admin/<module>/[id]/edit/page.tsx     ← edit RSC
  src/components/admin/<module>/<Name>Client.tsx   ← list client
  src/components/admin/<module>/<Name>Form.tsx     ← create/edit form client

Files to update:
  src/lib/rbac.ts          ← add { key, label, href } to MODULES
  prisma/seed.ts           ← add RolePermission rows for ADMIN, SALES, EDITOR

Public page: yes → src/app/(public)/<module>/page.tsx + [slug]/page.tsx
Account page: yes → src/app/account/<module>/page.tsx

Seed rows needed:
  ADMIN:  <key>: ALL
  SALES:  <key>: <tuple>
  EDITOR: <key>: <tuple>
```

---

## Step 4 — Build order

Follow this exact order. Each step must compile before moving to the next.

### 1. Schema

Add the model to `prisma/schema.prisma`. Rules:
- New columns on tables with existing rows must be nullable (`String?`) or have `@default`
- JSON-as-data arrays (itinerary, gallery, faqs, etc.) use `String @default("[]")` — not Prisma `Json` type
- Add `@index` for every field used in `where` or `orderBy` in the API routes
- Add `published Boolean @default(false)` if staff controls visibility
- Add a slug field (`String @unique`) if the entity has public URLs

```bash
yarn db:push     # dev; no migration file
# or
yarn db:migrate  # when the change needs a recorded migration
```

### 2. Register the module key

In `src/lib/rbac.ts`, add to the `MODULES` array:

```ts
{ key: "vouchers", label: "Vouchers", href: "/admin/vouchers" },
```

### 3. Seed RolePermission rows

In `prisma/seed.ts`, add the new key to `PERMISSION_DEFAULTS` for ADMIN, SALES, and EDITOR. Use the existing tuple constants:

```ts
// tuple order: [canView, canCreate, canEdit, canDelete]
const ALL:       [boolean, boolean, boolean, boolean] = [true,  true,  true,  true ];
const VIEW:      [boolean, boolean, boolean, boolean] = [true,  false, false, false];
const VIEW_EDIT: [boolean, boolean, boolean, boolean] = [true,  false, true,  false];
const NONE:      [boolean, boolean, boolean, boolean] = [false, false, false, false];

ADMIN:  { vouchers: ALL, ... }
SALES:  { vouchers: VIEW_EDIT, ... }
EDITOR: { vouchers: NONE, ... }
```

```bash
yarn db:seed
```

### 4. API routes — collection (`src/app/api/<resource>/route.ts`)

```ts
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// GET — decide: public (no guard) or admin-only (requirePermission)
// Tours/Destinations list is public. Bookings/Inquiries/Vouchers list is admin-only.
export async function GET() { ... }

// POST — always guarded
export async function POST(request: Request) {
  const guard = await requirePermission("vouchers", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const item = await prisma.voucher.create({ data: parsed.data });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
```

`createSchema` — all required fields as non-optional.  
`patchSchema` — same fields but every one `.optional()` or `.optional().nullable()`.

### 5. API routes — item (`src/app/api/<resource>/[id]/route.ts`)

```ts
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("vouchers", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;   // ← always await in Next.js 16
  const item = await prisma.voucher.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

// PATCH and DELETE follow the same guard → fetch existing → parse → write pattern
```

All four verbs (GET, POST, PATCH, DELETE) need their own `requirePermission` call with the matching action.

### 6. Admin list page (`src/app/admin/<module>/page.tsx`)

```ts
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { VouchersClient } from "@/components/admin/vouchers/VouchersClient";

export const metadata: Metadata = { title: "Vouchers — Admin" };
export const dynamic = "force-dynamic";   // ← required on every admin list page

export default async function AdminVouchersPage() {
  const items = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, createdAt: true }, // ← project only what the list needs
  });
  return <VouchersClient initialItems={items} />;
}
```

No auth check here — that's the layout's job (`src/app/admin/layout.tsx`).

### 7. Admin create page (`src/app/admin/<module>/new/page.tsx`)

No Prisma access, no `force-dynamic` needed:

```ts
export const metadata: Metadata = { title: "New Voucher — Admin" };

export default function NewVoucherPage() {
  return <VoucherForm />;
}
```

### 8. Admin edit page (`src/app/admin/<module>/[id]/edit/page.tsx`)

```ts
type Props = { params: Promise<{ id: string }> };

export default async function EditVoucherPage({ params }: Props) {
  const { id } = await params;   // ← always await
  const item = await prisma.voucher.findUnique({ where: { id } });
  if (!item) notFound();         // ← always guard missing records

  return <VoucherForm defaults={{ id: item.id, code: item.code, ... }} />;
}
```

### 9. List client (`src/components/admin/<module>/<Name>Client.tsx`)

```ts
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VouchersClient({ initialItems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete."); return; }
      toast.success("Deleted.");
      router.refresh();   // ← re-fetches RSC data without navigation
    });
  }
  // ...
}
```

If the entity has a status enum, add `STATUS_STYLES` and `ALLOWED_TRANSITIONS` maps here.

### 10. Form client (`src/components/admin/<module>/<Name>Form.tsx`)

```ts
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VoucherForm({ defaults }: { defaults?: Partial<FormData> & { id?: string } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!defaults?.id;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const url = isEdit ? `/api/vouchers/${defaults!.id}` : "/api/vouchers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { toast.error("Save failed."); return; }
      toast.success(isEdit ? "Updated!" : "Created!");
      router.push("/admin/vouchers");
      router.refresh();
    });
  }
  // ...
}
```

The same `*Form` component handles both create and edit via the `defaults` prop.

---

## Step 5 — Public site exposure (if applicable)

If the module has public pages, add them under `src/app/(public)/<module>/`:

```ts
// List page
export const revalidate = 300;   // ← ISR, not force-dynamic

export default async function PublicVouchersPage() {
  const items = await prisma.voucher.findMany({
    where: { published: true },   // ← always required on public queries
    orderBy: { createdAt: "desc" },
    select: { ... },
  });
  // ...
}

// Detail page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // ...
  return buildMetadata({ title, description, canonical: `${SITE_URL}/vouchers/${slug}`, ogImage });
}
```

---

## Validation

```bash
yarn typecheck   # TypeScript — catches guard/Zod/Prisma type mismatches
yarn lint        # ESLint
yarn build       # confirms full compile with prisma generate
```

Run in that order. Fix every error before calling the task done.

---

## Repo-specific pitfalls

**Forgetting MODULES registration.** Without the key in `src/lib/rbac.ts`, `requirePermission` silently resolves against a missing entry and the sidebar link never renders.

**Forgetting seed rows for new module.** SUPERADMIN always has full access (bypasses the table), so the module will appear to work when tested as superadmin. ADMIN/SALES/EDITOR will be completely locked out until `yarn db:seed` runs with the new rows.

**Adding `force-dynamic` to the `new` page.** The create page has no DB queries and no session dependency — it renders a static form. `force-dynamic` is unnecessary there and only needed on pages that query the DB or read session state.

**Making the collection GET guarded when it should be public.** The public destinations list (`GET /api/destinations`) has no guard — it's consumed by the public destinations page. Only add `requirePermission` to the GET handler when the resource should never be visible to anonymous visitors (e.g. inquiries, bookings, users).

**JSON columns as Prisma `Json` type.** Every array field in this repo is `String @default("[]")`, not `Json`. Declaring it as `Json` breaks the `JSON.parse`/`JSON.stringify` pattern used everywhere. Keep all array-valued columns as `String`.

**`patchSchema` fields not all `.optional().nullable()`.** The PATCH endpoint must accept partial updates — every field should be `.optional()` or `.optional().nullable()` so the client can send only changed fields. A required field in `patchSchema` forces the form to always send it, which breaks partial saves.

**Not calling `notFound()` on the edit page when the record is missing.** Without it, the page renders with `null` data passed to the form, causing runtime errors inside the component.

**Not awaiting `params` in Next.js 16.** `params` is a `Promise` — always `const { id } = await params` before use, both in the page RSC and in `generateMetadata`.

**Using `router.push` instead of `router.refresh()` after in-place mutations.** For delete and status-change actions in the list client, use `router.refresh()` to re-fetch the RSC data in place. Use `router.push("/admin/<module>")` + `router.refresh()` only after a create or edit that should navigate back to the list.
