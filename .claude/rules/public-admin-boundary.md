---
description: Separation between public site, account area, and admin CMS
globs: ["src/app/(public)/**", "src/app/admin/**", "src/app/account/**"]
---

# Public / account / admin boundary

## Three distinct areas — do not mix concerns

| Area | Path prefix | Auth | Data access |
|---|---|---|---|
| Public site | `src/app/(public)/` | None | Published records only, ISR |
| Customer account | `src/app/account/` | Any authenticated user | Own records (filtered by `userId`) |
| Admin CMS | `src/app/admin/` | Staff roles only | All records, no `published` filter |

## Public pages only see published content

Public page RSCs always filter by `published: true` (tours, blogs, campaigns). They never render draft content, admin metadata, or staff-only fields. There is no mechanism to preview drafts on the public site.

```ts
// ✅ public tour page
const tour = await prisma.tour.findFirst({ where: { slug, published: true } });

// ✅ public tours list API
const where = { published: true, ... };
```

## Account pages scope all queries to the authenticated user's ID

```ts
// ✅ src/app/account/page.tsx
const session = await auth();
const userId = session!.user.id;
const bookings = await prisma.booking.findMany({ where: { userId } });
```

Account pages never query another user's data. They do not use `requirePermission` (that's staff-only); they call `auth()` and use the session `userId` directly.

## Admin pages never import from (public) components

Components in `src/components/admin/` are for the CMS only. Components in `src/components/tours/`, `src/components/blog/`, etc. are for the public site. Do not cross-import between these trees to keep the concerns separate.

## The middleware enforces the hard boundary

`src/proxy.ts` (the NextAuth edge middleware) redirects:
- Unauthenticated users hitting `/admin/*` or `/account/*` → `/login`
- Authenticated customers hitting `/admin/*` → `/account`

These redirects are in `auth.config.ts → callbacks.authorized`. Do not replicate this logic in individual page files — rely on the middleware as the enforcement point.

## No admin-only API routes called from public pages

Public pages fetch data directly via Prisma in server components (RSC), or call public API routes (`/api/tours`, `/api/destinations`, etc.) that enforce `published: true`. They do not call `/api/admin/**` or any route guarded by `requirePermission`.

## Booking flow sits outside both admin and account

`src/app/(public)/booking/` is part of the public site. Bookings can be made by guests (no account required). The booking page calls `/api/bookings/create-order` and `/api/bookings/verify-payment`, which are public-callable but internally associate the booking with `userId` when a session is present.

Account pages (`/account/bookings`) then display bookings scoped to the authenticated user — they do not re-use the booking form or payment flow components.
