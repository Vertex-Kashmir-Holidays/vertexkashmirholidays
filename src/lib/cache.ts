import { revalidatePath, revalidateTag } from "next/cache";
import type { TourCategory } from "@prisma/client";
import { ORIGIN_CITIES } from "@/lib/originCities";
import { TOUR_CATEGORY_META } from "@/lib/tours/categories";

// ──────────────────────────────────────────────────────────────────────────
// On-demand cache invalidation.
//
// Public pages use ISR, with long TTLs (hours, sometimes a day) now that
// every content mutation below calls the matching `invalidate*()` helper —
// the TTL is a safety net for a revalidation call that didn't fire (a bug, a
// race), not the primary freshness mechanism. Each helper only touches the
// specific routes that actually render that content, computed from the real
// join/aggregate relationships in the schema — see the comment on each one.
//
// `flushPublicCache` remains the manual, all-or-nothing emergency escape
// hatch (Settings → "Flush Cache") — it should not be called automatically
// from any mutation route; use the targeted helpers below instead.
// ──────────────────────────────────────────────────────────────────────────

export function flushPublicCache() {
  // The "layout" type invalidates the whole subtree under the root layout,
  // i.e. every public page in one call. Full public-site flush — reserved
  // for the manual admin escape hatch, never called from a mutation route.
  revalidatePath("/", "layout");
  // unstable_cache() entries are keyed by tag, not path — revalidatePath
  // alone doesn't guarantee busting them, so the full-flush action explicitly
  // clears every known tag too. The second "max" argument is Next's own
  // recommended replacement for the deprecated single-arg revalidateTag() call.
  revalidateTag("site-settings", "max");
  revalidateTag("role-permissions", "max");
  revalidateTag("faqs", "max");
  revalidateTag("hotel-supplier-counts", "max");
  revalidateTag("hotel-supplier-public", "max");
  revalidateTag("banners", "max");
  revalidateTag("tour-categories", "max");
  revalidateTag("home-content", "max");
  revalidateTag("trip-planner-content", "max");
  revalidateTag("public-hero-stats", "max");
  revalidateTag("corporate-offices", "max");
}

// The /tours/kashmir-tour-packages-from/[city] pages all show the same
// sitewide top-6 published tours (there's no per-city filter in the schema —
// see that page's own header comment) — so any Tour mutation that could shift
// that top-6 (published, bestseller, rating, reviewCount, priceFrom all
// factor into its ordering) must bust every city page, not one.
function revalidateOriginCityPages() {
  for (const city of ORIGIN_CITIES) {
    revalidatePath(`/tours/kashmir-tour-packages-from/${city.slug}`);
  }
}

// ── Tour ─────────────────────────────────────────────────────────────────
// Affects: its own detail page (+ previous slug, if renamed), /tours,
// /tours/category/[slug] (current + previous category, if changed), every
// origin-city page (see above), the homepage ("Featured Tours" + the Kashmir
// tour count stat), sitemap.xml, and any Destination/Activity page it's
// currently linked to (their own pages render live Tour fields via the
// TourDestination/ActivityTour joins). Deliberately NOT chased: a Blog post
// that curated this tour into its `relatedTours` JSON field — there's no
// index for that reverse lookup, and the blog page's own TTL is the safety net.
export function invalidateTour(input: {
  slug: string;
  previousSlug?: string | null;
  category: TourCategory;
  previousCategory?: TourCategory | null;
  destinationSlugs?: string[];
  activitySlugs?: string[];
}) {
  revalidatePath(`/tours/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/tours/${input.previousSlug}`);
  }
  revalidatePath("/tours");
  // The layout's published-category nav strip (src/app/(public)/layout.tsx)
  // is a tagged unstable_cache read, not tied to any one page path.
  revalidateTag("tour-categories", "max");
  revalidatePath(`/tours/category/${TOUR_CATEGORY_META[input.category].slug}`);
  if (input.previousCategory && input.previousCategory !== input.category) {
    revalidatePath(`/tours/category/${TOUR_CATEGORY_META[input.previousCategory].slug}`);
  }
  revalidateOriginCityPages();
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  for (const slug of input.destinationSlugs ?? []) revalidatePath(`/destinations/${slug}`);
  for (const slug of input.activitySlugs ?? []) revalidatePath(`/activities/${slug}`);
}

// ── Destination ──────────────────────────────────────────────────────────
// Affects: its own detail page (+ previous slug), /destinations, every Tour
// and Activity page linked to it (both render this destination's name/fields
// via their own joins), sitemap.xml, and the homepage ONLY if this record is
// (or was) one of the `isFeatured` destinations shown there — checked from
// data already in hand at the call site, no extra query needed.
export function invalidateDestination(input: {
  slug: string;
  previousSlug?: string | null;
  isFeatured: boolean;
  wasFeatured?: boolean;
  tourSlugs?: string[];
  activitySlugs?: string[];
}) {
  revalidatePath(`/destinations/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/destinations/${input.previousSlug}`);
  }
  revalidatePath("/destinations");
  if (input.isFeatured || input.wasFeatured) {
    revalidatePath("/");
  }
  revalidatePath("/sitemap.xml");
  for (const slug of input.tourSlugs ?? []) revalidatePath(`/tours/${slug}`);
  for (const slug of input.activitySlugs ?? []) revalidatePath(`/activities/${slug}`);
}

// ── Activity ─────────────────────────────────────────────────────────────
// Affects: its own detail page (+ previous slug), /activities, every Tour and
// Destination page linked to it, sitemap.xml, and the homepage (its "Popular
// Things to Do" carousel shows 4 published activities by sortOrder — any
// activity's publish state or ordering can shift that set, so this one always
// busts the homepage rather than trying to cheaply detect top-4 membership).
// Deliberately NOT chased: "nearby activities"/"related blogs" shown on OTHER
// activities that merely share a destination — a second-order, low-value
// dependency; that page's own TTL is the safety net.
export function invalidateActivity(input: {
  slug: string;
  previousSlug?: string | null;
  tourSlugs?: string[];
  destinationSlugs?: string[];
}) {
  revalidatePath(`/activities/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/activities/${input.previousSlug}`);
  }
  revalidatePath("/activities");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  for (const slug of input.tourSlugs ?? []) revalidatePath(`/tours/${slug}`);
  for (const slug of input.destinationSlugs ?? []) revalidatePath(`/destinations/${slug}`);
}

// ── Campaign / Adventure ─────────────────────────────────────────────────
// Affects only its own detail page, /adventures, and sitemap.xml — confirmed
// Campaign has no Tour/Destination relation in the schema, and the homepage
// renders no Campaign data at all (verified directly against its query list).
export function invalidateCampaign(input: { slug: string; previousSlug?: string | null }) {
  revalidatePath(`/adventures/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/adventures/${input.previousSlug}`);
  }
  revalidatePath("/adventures");
  revalidatePath("/sitemap.xml");
}

// ── Blog ─────────────────────────────────────────────────────────────────
// Affects: its own detail page (+ previous slug), /blog, the homepage
// ("Latest Blog" shows the 3 most recent published posts — always busted
// rather than cheaply detecting membership in that top-3), and sitemap.xml.
// Deliberately NOT chased: /blog/author/[slug] (would need the same slugify
// logic the archive page uses to turn a free-text author name into a route
// segment) — that page's own TTL is the safety net for this one, secondary
// path.
export function invalidateBlog(input: { slug: string; previousSlug?: string | null }) {
  revalidatePath(`/blog/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/blog/${input.previousSlug}`);
  }
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

// ── Career / Job ─────────────────────────────────────────────────────────
// Affects only its own detail page, /careers, and sitemap.xml — careers don't
// appear anywhere on the homepage or any other content type's page.
export function invalidateCareer(input: { slug: string; previousSlug?: string | null }) {
  revalidatePath(`/careers/${input.slug}`);
  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(`/careers/${input.previousSlug}`);
  }
  revalidatePath("/careers");
  revalidatePath("/sitemap.xml");
}
