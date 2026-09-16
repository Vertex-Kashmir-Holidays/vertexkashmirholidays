# 17 — Caching & Performance

> **What this section explains:** every caching layer in VK — ISR with on-demand invalidation, the Data Cache (`unstable_cache`), the RBAC permissions cache, and CDN/image caching — plus the general performance posture (lazy loading, bundle splitting).
>
> **Confidence:** Confirmed from direct implementation and verification (`yarn typecheck`/`yarn lint`/`yarn build`, all clean) as of 2026-09-16, when the caching architecture below was audited and rebuilt. Supersedes an earlier version of this section that described a flat 5-minute-TTL-only model — see §40 for how that earlier description was corrected.

---

## Quick Reference — caching by route type

| Context | Setting |
|---|---|
| Public CMS content pages (Tours, Destinations, Activities, Adventures, Careers, Blog, FAQ) | Long ISR TTL (6h–24h, tiered by content type) **+ targeted on-demand invalidation** on every mutation |
| Pages with no on-demand invalidation wired (About, Contact, B2B, RSS) | Moderate ISR TTL (6h), TTL-driven only |
| Legal pages | 72h ISR TTL — content changes only for compliance reasons |
| Admin list/detail/edit pages, account pages, booking/payment pages | `export const dynamic = "force-dynamic"` — never cached |
| Admin create/new pages (no DB access) | No directive needed |
| `sitemap.ts` | 24h ISR TTL + invalidated by every content mutation |

The architecture, end to end:

```
Database (Neon) → Prisma → Next.js Data Cache (unstable_cache) / Full Route Cache (ISR) → Vercel CDN → Users
```

**On-demand invalidation is the freshness mechanism; the TTL is a safety net** for a revalidation call that didn't fire (a bug, a race) — not the primary way content edits become visible. This is a deliberate architectural shift from the previous flat 5-minute-TTL model (§40).

## ISR + targeted on-demand invalidation

`src/lib/cache.ts` centralizes "what does editing X affect" as one `invalidate<Type>()` function per content type, computed from the real join/aggregate relationships in the schema — not a blind full-site flush:

| Content type | Mutation call site | What it invalidates |
|---|---|---|
| **Tour** | `POST /api/tours`, `PATCH`/`DELETE /api/tours/[id]` | Its own page (+ previous slug if renamed), `/tours`, its category page (+ previous category if changed), every origin-city page (they all show the same sitewide top-6), the homepage, `/sitemap.xml`, and every Destination/Activity page it's currently linked to |
| **Destination** | `POST /api/destinations`, `PATCH`/`DELETE /api/destinations/[id]` | Its own page, `/destinations`, homepage only if `isFeatured`, `/sitemap.xml`, and every linked Tour/Activity page |
| **Activity** | `POST /api/activities`, `PATCH`/`DELETE /api/activities/[id]` | Its own page, `/activities`, homepage, `/sitemap.xml`, and every linked Tour/Destination page |
| **Campaign/Adventure** | `POST /api/campaigns`, `PATCH`/`DELETE /api/campaigns/[id]` | Its own page, `/adventures`, `/sitemap.xml` — confirmed no Tour/Destination relation and no homepage presence, so nothing else |
| **Blog** | `POST /api/blogs`, `PATCH`/`DELETE /api/blogs/[id]` | Its own page, `/blog`, homepage, `/sitemap.xml` |
| **Career/Job** | `POST /api/careers`, `PATCH`/`DELETE /api/careers/[id]` | Its own page, `/careers`, `/sitemap.xml` — confirmed no homepage presence |
| **Review** (approval/edit/delete) | Centralized in `recomputeTourRating()` (`src/lib/reviews.ts`), called from all 5 review-mutation routes | The affected Tour's own page, `/tours`, its category page, every origin-city page, homepage — via the same `invalidateTour()` |
| **FAQ** | `src/app/api/faqs/**` | The `faqs` Data Cache tag (already existing — covers Home/About/Contact/Reviews via `getPublicFaqIndex`) **plus** an explicit `/faq` path bust, added in this pass since `/faq` queries `FaqCategory` directly and was not actually covered by the tag alone |
| **Site Settings** | `PATCH /api/settings` | The `site-settings` Data Cache tag — pre-existing, unchanged |

**Deliberately not chased** (documented trade-offs, not oversights): a Blog post's curated `relatedTours` JSON field pointing at a Tour that later changes; entity-linked FAQs (`Faq.relatedTours`-style m2m to a specific Tour/Destination/Activity/Blog/Campaign) beyond the placement-based `faqs` tag; "nearby activities"/"related blogs" shown on a *different* activity that merely shares a destination; `/blog/author/[slug]` (would need the same author-name slugify logic the route itself uses). Each of these relies on its page's own TTL as the safety net rather than a chased reverse-relation invalidation — the cost/complexity of tracking them was judged not to justify the benefit at VK's current content-edit frequency.

## The Data Cache (`unstable_cache`) — reducing redundant Prisma queries

Beyond invalidation precision, `unstable_cache` also **deduplicates queries that were previously re-executed on every distinct page's ISR regeneration** — the public `(public)/layout.tsx` wraps every page, but Next's Full Route Cache is keyed per leaf page, so a raw query inside the layout re-runs once per page-type's own regeneration, not once site-wide.

| Cached function | File | TTL | Tag | Why this TTL |
|---|---|---|---|---|
| `getSiteSettings` | `src/lib/siteSettings.ts` | 60s | `site-settings` | Pre-existing |
| `getPublicFaqIndex` | `src/lib/faqs.ts` | 300s | `faqs` | Pre-existing |
| `getVerifiedPropertiesCount(ForDestination)` | `src/lib/hotelSuppliers/stats.ts` | 1800s | `hotel-supplier-counts` | Pre-existing |
| `getActiveStrip` / `getActivePromoBanners` | `src/lib/banners.ts` | 300s | `banners` | **New.** Kept short deliberately — a banner's active window (`startsAt`/`endsAt`) is time-based, not just edit-based, so a long TTL would show an expired banner too long |
| `getPublishedTourCategories` | `(public)/layout.tsx` | 3600s | `tour-categories` | **New.** Invalidated by every Tour mutation via `invalidateTour()` |
| `getHomeContent` | `src/lib/homeContent.ts` | 1800s | `home-content` | **New.** Previously queried twice per relevant request (once in the layout for `formAvatars`, again in full in the homepage) — now one shared cached read. No mutation route wired to this tag yet (see below) |
| `getActiveCorporateOffices` | `src/lib/companyOffice.ts` | 1800s | `corporate-offices` | **New.** Was three separate raw round-trips per relevant request (layout + `/contact` + `/adventures/[slug]`) — now one |

**Known remaining gap**: `home-content` and `corporate-offices` are cached but not yet wired to a `revalidateTag()` call on their save routes (those routes weren't part of this pass's audited scope) — they rely on their TTL rather than on-demand freshness. Flagged in §35, not silently left undocumented.

A separate, lower-risk fix applied in the same pass: four public listing pages (`/tours`, `/destinations`, `/activities`, `/blog`) were independently querying the same `HomeSection`/`BlogContent` row twice per request — once in `generateMetadata()`, again in the page body — because, unlike every detail page, they weren't wrapped in React's `cache()`. Now they are, matching the existing convention (`getTour`, `getDestination`, `getCampaign`, etc.) — a pure per-request dedup, not persisted across requests, zero invalidation concern.

## `generateStaticParams` coverage

Every detail route now pre-renders at build time from the published-record set — `/tours/[slug]`, `/destinations/[slug]`, `/activities/[slug]`, `/blog/[slug]`, `/blog/author/[slug]`, `/careers/[slug]`, `/tours/category/[category]`, `/tours/kashmir-tour-packages-from/[city]`, and, as of this pass, `/adventures/[slug]` (previously missing — confirmed via build output that it now prerenders every published Campaign).

## The manual full-site flush — unchanged, now clearly an emergency-only tool

`POST /api/admin/cache/flush` (Settings → "Flush Cache") still calls `flushPublicCache()` → `revalidatePath("/", "layout")` plus every known `revalidateTag`. It remains the deliberate escape hatch for something the targeted invalidation above didn't catch — not something any mutation route calls automatically, and not needed for normal content edits anymore.

## The RBAC permissions cache

`getRolePermissions(role)` (`src/lib/permissions.ts`) — unchanged by this pass. `unstable_cache` (`revalidate: 300`, tag `role-permissions`), invalidated immediately via `revalidateTag` when a SUPERADMIN edits the roles matrix, and also wrapped in React's `cache()` so one request only queries `RolePermission` once.

## Why authenticated routes skip auth's session machinery for ISR's sake

`src/proxy.ts` deliberately routes only `/admin`, `/account`, `/login`, `/api` through NextAuth's `auth()` wrapper — every other (public) route skips it entirely, because `auth()`'s `Set-Cookie` behavior would force every public page into dynamic SSR, defeating ISR sitewide (§10, §18).

## Rate-limiter "cache" (a distinct concept, covered fully in §21)

Upstash Redis (durable, cross-instance) with an in-memory per-serverless-instance fallback — a rate-limiting mechanism, not a content cache, sharing the "falls back gracefully when unconfigured" shape common to this codebase's integrations (ADR 0005).

## CDN / image caching

`next/image`'s `minimumCacheTTL: 2678400` (31 days) on the Vercel Edge Network — optimized image variants are cached long-term since a new upload gets a new Cloudinary URL, not an overwrite (§15, §18).

## Bundle / code splitting

- `next/dynamic({ ssr: false })` for the admin revenue chart and client-side itinerary PDF export. The Three.js hero mode (`HeroR3F`) remains orphaned — must go behind this same boundary if ever reintroduced.
- `experimental.optimizePackageImports: ["framer-motion", "lucide-react", "recharts"]` in `next.config.ts`.
- `@next/bundle-analyzer`, run via `ANALYZE=true yarn build`.

## No Redis, no external cache — deliberately

This entire architecture runs on Next.js's own ISR + Data Cache + Vercel's CDN — no Upstash/Redis involvement (Upstash in this codebase is exclusively the rate-limiter's backing store, §21, unrelated to content caching). The audit behind this section's rebuild explicitly concluded the existing Next.js/Vercel primitives were sufficient once used correctly (long TTL + targeted invalidation), and that introducing an external cache would have added infrastructure the evidence didn't justify — consistent with `.ai/instructions/coding-standards.md`'s stated bias against premature complexity.

## Related Documents

- `.ai/instructions/coding-standards.md` → Next.js Standards
- §10 Authentication & Authorization — why public routes skip `auth()` for ISR's sake
- §21 Security — the rate-limiter's caching/fallback behavior in full
- §30 SEO & Web Performance — Lighthouse CI, Core Web Vitals posture, sitemap detail
- §35 Technical Debt — the `home-content`/`corporate-offices` invalidation gap, and other known limitations from this pass
- §36 Scalability — where this caching strategy would need to evolve under higher load
- §40 Documentation Maintenance — how this section's previous, less accurate version was identified and corrected
