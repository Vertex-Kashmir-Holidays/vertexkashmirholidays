// Fixed set of categories the Docs page organizes uploads into. A plain
// string on AdminDocument.category (not a Prisma enum — same convention as
// Gallery.category), so adding a category here is a code change, not a
// migration.
export const DOC_CATEGORIES = ["Company Profile", "B2B", "General"] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export function isDocCategory(value: unknown): value is DocCategory {
  return typeof value === "string" && (DOC_CATEGORIES as readonly string[]).includes(value);
}

// Categories surfaced on a B2B agent's account profile — only docs uploaded
// under "B2B" (rates, policies, itinerary samples). "Company Profile" and
// "General" are staff/partner reference material managed elsewhere and are
// deliberately excluded.
export const B2B_VISIBLE_DOC_CATEGORIES: readonly DocCategory[] = ["B2B"];
