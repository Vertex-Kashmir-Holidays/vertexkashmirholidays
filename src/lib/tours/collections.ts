import { z } from "zod";
import { LEGAL_SLUGS } from "@/lib/legal/content";

// Tour Collections are served at the top level (/kashmir-tour-packages) by the
// shared (public)/[slug] route, alongside the legal pages. A slug must never
// shadow — or be shadowed by — any other top-level path, so the admin API
// rejects these. Static route folders win over [slug] in Next.js anyway; this
// list just turns that silent "unreachable collection" into a validation error.
const RESERVED_TOP_LEVEL_SLUGS = new Set<string>([
  ...LEGAL_SLUGS,
  // src/app and src/app/(public) route folders + root files
  "about",
  "account",
  "activities",
  "admin",
  "adventures",
  "api",
  "auth",
  "b2b-travel-partner-program",
  "blog",
  "booking",
  "careers",
  "contact",
  "destinations",
  "faq",
  "login",
  "plan-your-kashmir-trip",
  "reviews",
  "tours",
  "manifest",
  "robots",
  "rss",
  "sitemap",
  // public/ asset folders
  "brand",
  "docs",
  "gateway",
  "hero",
  "itinerary",
  "uploads",
]);

export const COLLECTION_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Null when valid, otherwise a human-readable reason. */
export function collectionSlugError(slug: string): string | null {
  if (!COLLECTION_SLUG_RE.test(slug)) return "Slug: lowercase letters, numbers, hyphens only";
  if (RESERVED_TOP_LEVEL_SLUGS.has(slug)) return `"${slug}" is already used by another page`;
  return null;
}

/** Zod field for the admin API (create + patch). */
export const collectionSlugField = z
  .string()
  .trim()
  .min(3)
  .superRefine((slug, ctx) => {
    const err = collectionSlugError(slug);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });

/**
 * A tour's primary collection (breadcrumb parent) — the published collection
 * with the lowest sortOrder, name as a stable tie-break. Null when the tour is
 * in no published collection.
 */
export function pickPrimaryCollection<
  T extends { name: string; slug: string; sortOrder: number; published: boolean },
>(collections: T[]): T | null {
  const published = collections.filter((c) => c.published);
  published.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return published[0] ?? null;
}
