// Fixed set of categories the Docs page organizes uploads into. A plain
// string on AdminDocument.category (not a Prisma enum — same convention as
// Gallery.category), so adding a category here is a code change, not a
// migration.
export const DOC_CATEGORIES = [
  "Company Profile",
  "B2B Payment Policy",
  "B2B Itinerary Sample",
  "General",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export function isDocCategory(value: unknown): value is DocCategory {
  return typeof value === "string" && (DOC_CATEGORIES as readonly string[]).includes(value);
}
