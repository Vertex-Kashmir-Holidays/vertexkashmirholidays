import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ──────────────────────────────────────────────────────────────────────────
// Media storage abstraction.
//
// All uploaded media flows through `saveUpload`, which today writes to the
// local `public/uploads/<folder>/` tree and returns a site-relative URL. The
// folder mirrors the module the asset belongs to (see MEDIA_FOLDERS), so the
// whole media tree is organised by purpose and can be lifted to Cloudinary or
// another bucket later by swapping only the body of `saveUpload` — every caller
// already speaks in terms of a `folder` + returned `url`.
// ──────────────────────────────────────────────────────────────────────────

// Canonical module folders. Used to populate folder pickers and to validate
// incoming folder values. Free-text categories (from the Gallery page) are also
// allowed — they are slugified into a folder on disk.
export const MEDIA_FOLDERS = [
  "home",
  "tours",
  "destinations",
  "blog",
  "about",
  "contact",
  "campaigns",
  "itinerary",
  "general",
] as const;

export const DEFAULT_FOLDER = "general";

// Slugify an arbitrary folder/category label into a filesystem-safe segment.
// Falls back to DEFAULT_FOLDER when nothing usable remains.
export function folderSlug(raw: string | null | undefined): string {
  const slug = (raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || DEFAULT_FOLDER;
}

export interface SaveUploadResult {
  /** Site-relative URL, e.g. /uploads/blog/1718000000000-ab12cd.jpg */
  url: string;
  /** The folder segment the file was stored under (slugified). */
  folder: string;
}

/**
 * Persist an uploaded file's bytes and return its public URL.
 * @param buffer file contents
 * @param folder module/category the asset belongs to (slugified internally)
 * @param ext    file extension without the dot (already sanitised by caller)
 */
export async function saveUpload(
  buffer: Buffer,
  { folder, ext }: { folder: string; ext: string },
): Promise<SaveUploadResult> {
  const slug = folderSlug(folder);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${slug}/${filename}`, folder: slug };
}
