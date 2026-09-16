# 12 — CMS / Content Architecture

> **What this section explains:** how editable content is modeled and served — there is no separate headless CMS product (Contentful, Sanity, etc.); content lives in the same PostgreSQL database as everything else, edited through the admin panel.
>
> **Confidence:** Confirmed from `prisma/schema.prisma` research (§08) and `.ai/skills/admin-crud.md`.

---

## There is no external CMS

VK does **not** use Contentful, Sanity, Strapi, WordPress, or any headless/hosted CMS product. Every piece of editable content — tour descriptions, blog posts, the homepage hero, FAQ answers, legal page text — is a row in the same Prisma/PostgreSQL database as bookings and leads, edited through the admin CRM (`src/app/admin/**`) and read by the public site via direct Prisma queries in Server Components. This is a deliberate architectural simplicity choice consistent with ADR 0002/0006 (one database, one data-access path) — not a documented ADR of its own (see §34's note on missing ADRs), but clearly the pattern in force.

## Two shapes of content model

### 1. Repeatable entities (a normal table, many rows)

| Model | Public route | Admin route |
|---|---|---|
| `Tour` | `/tours/[slug]` | `/admin/packages` |
| `Destination` | `/destinations/[slug]` | `/admin/destinations` |
| `Activity` | `/activities/[slug]` | `/admin/activities` |
| `Blog` | `/blog/[slug]` | `/admin/blogs` |
| `Campaign` | `/adventures/[slug]` | `/admin/campaigns` |
| `Faq` | Surfaced via `FaqPlacement[]` on Home/About/Contact/FAQ/Reviews pages | `/admin/faqs` |
| `Job` | `/careers/[slug]` | `/admin/careers` |
| `Gallery` | Media library, embedded across pages | `/admin/galleries` |
| `Banner` | Strip/promo banners, `pages` JSON field controls placement | `/admin/banners` |
| `Review` | `/reviews`, tour detail pages (`approved` gate) | `/admin/reviews` |

Each follows the standard admin-CRUD build (§27): list → new → `[id]/edit`, `published` boolean gating public visibility, `slug` for the public URL.

### 2. Singleton page content (exactly one row, `id: "singleton"`)

| Model | Powers | Satellite list models |
|---|---|---|
| `HomeContent` | `/` (homepage) | `HeroSlide`, `SiteStat`, `TickerItem`, `VideoReview`, `WhyChooseItem`, `Offer`, `HomeSection` |
| `AboutContent` | `/about` | `AboutStoryFeature`, `AboutStat`, `AboutValue`, `Certification`, `TeamMember`, `JourneyMilestone`, `PressLogo` |
| `ContactContent` | `/contact` | `ContactHeroFeature`, `ContactPromiseItem`, `ContactOffice` |
| `BlogContent` | `/blog` index page | — |
| `ReviewsContent` | `/reviews` | — |
| `SiteSettings` | Sitewide (site name, WhatsApp number, phone, GST rate list, legal identity fields) | — |
| `LegalPage` | Terms/Privacy/Refund pages (keyed by `slug`, not the `"singleton"` convention — a distinct pattern for a small fixed set of legal pages) | — |

Read via `findUnique({ where: { id: "singleton" } })`, written via `upsert` — **never `create` a second row** (`.ai/instructions/coding-standards.md` → Database Standards). Some singleton `upsert` calls in `prisma/seed.ts` deliberately use an empty `update: {}` block, so re-running the seed never clobbers content staff have already edited in the CMS — this is intentional, not a seed bug (`.ai/skills/prisma-migration.md` → Common Mistakes explicitly warns against "fixing" this).

## JSON-string content fields

Long-form/structured content within `Tour` (15 fields), `Campaign` (11 fields), `Destination` (6), `Activity` (5), and `Job` (4) is stored as JSON encoded inside a `String` column rather than Prisma's native `Json` type — a deliberate, repository-wide convention (§08). This means the admin form for, say, a tour's itinerary or inclusions list is editing a JSON array that gets stringified on save and parsed (with a fallback) on every read — centralized parsing, never repeated inline per call site.

## Rich text / HTML content

Several fields store raw HTML (`Tour.meals`, `Tour.transportDetail`, `Tour.whyItineraryWorks`, `LegalPage.content`, blog post bodies, destination/activity content sections) — all sanitized through `sanitize-html` before being rendered via `dangerouslySetInnerHTML` (§21).

## The centralized FAQ system

`Faq`/`FaqCategory` is worth calling out specifically: it replaced an older per-model JSON `faqs` pattern with a real relation table. A single `Faq` row can be many-to-many linked to `tours`, `destinations`, `blogs`, `campaigns`, and `activities` simultaneously, and independently controls **where** it surfaces via a `FaqPlacement[]` enum array (`HOME`, `ABOUT`, `CONTACT`, `FAQ`, `REVIEWS`) — a single FAQ entry can appear on the homepage and the dedicated FAQ page without duplication. `status: FaqStatus` (DRAFT/PUBLISHED) gates visibility independent of placement.

## No draft-preview mechanism

There is no staging/preview state for public content beyond the `published` boolean itself — a draft `Tour` or `Blog` post is invisible on the public site with no "preview as admin" URL. Every public query filters `published: true` unconditionally (§08, §09) — this is the single most consequential convention in the CMS layer, since a missing filter on a new public query would leak draft content to anonymous visitors.

## Related Documents

- §08 Database Architecture — the full JSON-string-column list and singleton-row convention
- §27 Admin / Dashboard Architecture — the CRUD build pattern every content module follows
- §30 SEO & Web Performance — how content becomes metadata/structured data
- `.ai/skills/admin-crud.md`, `.ai/skills/prisma-migration.md` → Common Mistakes (the singleton-seed-overwrite warning)
