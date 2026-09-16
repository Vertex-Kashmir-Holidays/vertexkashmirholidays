# 30 — SEO & Web Performance

> **What this section explains:** how metadata, structured data, sitemap/robots, and Core Web Vitals are handled — technically, not as marketing advice.
>
> **Confidence:** Confirmed from direct research of `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts` (`buildMetadata()`), `src/components/seo/JsonLd.tsx`, and `.lighthouserc.js`.

---

## Metadata

Every page's metadata goes through **one shared helper**, `buildMetadata()` (`src/lib/seo.ts`) — `.ai/instructions/coding-standards.md` states this as a hard rule: `generateMetadata` always returns `buildMetadata({...})`, never a raw `Metadata` object.

- **Title**: capped so the total (including the root layout's `" | Vertex Kashmir Holidays"` template suffix) stays under 60 characters, truncated at the last word boundary.
- **Description**: capped at 160 characters, same truncation rule.
- **Canonical**: via `alternates.canonical` when provided.
- **`noindex`**: opt-out via `robots: { index: false, follow: false }` — used for the admin/account/login route groups (also enforced at the header level, see §21).
- **OpenGraph**: title/description default to the page's own unless overridden; `siteName`, `type`, a 1200×630 image (falling back to a sitewide `DEFAULT_OG_IMAGE`).
- **Twitter**: `summary_large_image` card, same copy as OpenGraph.

## Sitemap (`src/app/sitemap.ts`)

Revalidated **hourly** (`revalidate = 3600` — deliberately changed from an earlier `force-dynamic` setup, per an in-code comment, to avoid issuing 7 database queries on every single crawler hit).

| Source | Detail |
|---|---|
| Static routes | `/`, `/tours`, `/tours/category`, `/adventures`, `/destinations`, `/blog`, `/careers`, `/reviews`, `/about`, `/contact`, `/b2b-travel-partner-program`, `/faq`, plus 3 legal pages |
| Dynamic (Prisma) | Tours, blogs, campaigns (→ `/adventures/:slug`), activities, careers/jobs — each `where: { published: true }` **except Destinations**, which has no `published` field at all, so every destination row is included (explicitly called out in a code comment) |
| Derived | Tour category pages (`groupBy` on category, only categories with `_count > 0`); origin-city landing pages (`/tours/kashmir-tour-packages-from/:city`) from a static `ORIGIN_CITIES` config, not a DB query |

No explicit exclusions beyond the `published` filters — booking success/failed, admin, and account pages are simply never added to the generated list in the first place.

## Robots (`src/app/robots.ts`)

Dynamic (`force-dynamic`), **host-aware**:

- Non-production host (Vercel preview URL, `.vercel.app` alias) → blanket `disallow: "/"` for every crawler — a second layer of protection alongside `src/proxy.ts`'s `X-Robots-Tag` header (§18, §21).
- Production host → `allow: "/"` with `disallow: ["/admin/", "/api/", "/account/", "/login", "/booking/success", "/booking/failed"]`.
- Points to `${SITE_URL}/sitemap.xml`.

## Structured Data (JSON-LD)

Full inventory in §06 — repeated here for SEO-specific framing. Coverage is deliberate and graph-based, anchored on a shared `@id: ${siteUrl}/#organization` node so every page's structured data references the same canonical Organization entity rather than declaring a fresh, disconnected one:

- **Sitewide**: `TravelAgency` (Organization/LocalBusiness subtype).
- **Homepage only**: `WebSite` — a real, historical fix: previously injected sitewide, corrected to homepage-only per Google's own guidance (visible as an explicit code comment).
- **Per content type**: `TouristTrip`/`Product` (tours), `TouristDestination` (destinations), `TouristAttraction` (activities), `BlogPosting` (blog), `Product`+`Event` (campaign tiers/batches), `FAQPage`, `CollectionPage`+`ItemList` (listing hubs), `BreadcrumbList`, `ImageObject`.
- **Page-specific Organization augmentations**: reviews (`aggregateRating`/`review`), contact (`geo`/`openingHoursSpecification`), about (`founder`/`employee`).

**Not covered**: careers/job pages, the booking/checkout flow, the b2b-travel-partner-program page — no structured-data builder targets these today.

## Core Web Vitals & Lighthouse CI

`.lighthouserc.js` collects Lighthouse runs against **9 URLs** (`/`, `/tours`, a tour detail page, `/destinations`, a destination detail page, `/blog`, a blog post, `/contact`, `/about`), **3 runs each**, server started via `yarn start`. Results upload to the local filesystem (`./.lighthouseci`), not a hosted dashboard.

**No `assert` block is configured** — confirmed directly. This means Lighthouse CI **measures and stores** results but does **not** fail a build or block a PR on a performance/accessibility regression today. This is a real, current gap worth stating plainly rather than implying an enforced performance budget exists (§17, §35).

## Performance techniques actually in place

- **SSR/SSG/ISR**: RSC by default; ISR (`revalidate=300`) on published public content (§17).
- **Image optimization**: `next/image` + `sharp`, AVIF/WebP, 31-day cache TTL (§15).
- **Code splitting**: `next/dynamic({ssr:false})` for the admin chart and PDF export; `optimizePackageImports` for `framer-motion`/`lucide-react`/`recharts` (§17).
- **Bundle analysis**: `@next/bundle-analyzer`, run on demand (`ANALYZE=true yarn build`).

## No invented benchmarks

This documentation does not state a Lighthouse score, a specific LCP/CLS/INP number, or any other performance metric as fact, because none was independently measured as part of this documentation pass and no enforced-budget CI output exists to cite. If a specific score is needed, run `yarn lhci` and read `.lighthouseci` directly — treat any number not sourced that way as **requires verification**.

## Related Documents

- §06 Frontend Architecture — the JSON-LD builder catalog in full
- §17 Caching & Performance — ISR mechanics, bundle splitting detail
- §21 Security — the `X-Robots-Tag` header mechanism complementing `robots.ts`
- §35 Technical Debt — the unenforced Lighthouse budget as a named gap
