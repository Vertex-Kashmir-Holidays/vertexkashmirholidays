---
description: Next.js App Router conventions for src/app/**
globs: ["src/app/**"]
---

# Next.js App Router conventions

## Page files are thin orchestrators

Page and layout files fetch data and pass props — they do not contain business logic, form handling, or multi-step state. Compare the canonical pattern:

```ts
// ✅ src/app/admin/packages/page.tsx
export default async function AdminPackagesPage() {
  const tours = await prisma.tour.findMany({ select: { ... } });
  return <PackagesClient initialTours={tours} />;
}
```

All interactivity, state, and mutations belong in the corresponding `*Client.tsx` component under `src/components/`.

## params is a Promise in Next.js 16

Always await params before destructuring:

```ts
type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
```

The same applies to `generateMetadata`.

## ISR vs force-dynamic

| Context | Setting |
|---|---|
| Public content pages | `export const revalidate = 300` |
| Admin list, detail, and edit pages (Prisma or session reads) | `export const dynamic = "force-dynamic"` |
| Admin create/new pages (no DB access) | no directive needed |
| Account pages | `export const dynamic = "force-dynamic"` |
| Booking/payment pages | `export const dynamic = "force-dynamic"` |

Public pages that depend on `published: true` data use ISR. Any page touching session, real-time booking state, or admin-editable content that must be immediately fresh uses `force-dynamic`.

## generateMetadata always uses buildMetadata()

```ts
import { buildMetadata, SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // ...
  return buildMetadata({ title, description, canonical, ogImage });
}
```

Never construct a raw `Metadata` object inline — `buildMetadata` applies defaults, canonical URLs, and OG tags consistently.

## Layouts fetch shared data once, not per-page data

`src/app/(public)/layout.tsx` fetches the `SiteSettings` singleton once for the entire public subtree and passes it via `SiteSettingsProvider`. Client components access it via `useSiteSettings()` — they do not query the DB directly. Do not add per-page data fetching to layout files.
