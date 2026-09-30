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

// Shared with the upload route (src/app/api/admin/docs/route.ts, which picks
// the Cloudinary/local-disk file extension at upload time) and every doc
// list that renders a download link.
export const DOC_EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

// Cloudinary's uploaded URL is deliberately extension-less (its "Allow
// delivery of PDF and ZIP files" security setting blocks a public_id ending
// in .pdf/.zip — see the comment in src/lib/storage.ts), so a plain
// href/download loses the extension. This rebuilds a proper "<title>.<ext>"
// filename for the anchor's `download` attribute, client-side, without
// touching the URL.
export function docDownloadFilename(title: string, mimeType: string): string {
  const ext = DOC_EXT_BY_MIME[mimeType];
  const slug = title.trim().replace(/\s+/g, "-").toLowerCase();
  return ext ? `${slug}.${ext}` : slug;
}
