import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// ──────────────────────────────────────────────────────────────────────────
// Media storage abstraction.
//
// All uploaded media flows through `saveUpload`. In production (Vercel) the
// filesystem is read-only, so we upload to Cloudinary whenever it is
// configured (CLOUDINARY_URL or the discrete CLOUDINARY_* vars). When it is
// NOT configured we fall back to writing the local `public/uploads/<folder>/`
// tree — this keeps local development working with zero setup.
//
// Every caller speaks only in terms of a `folder` + returned `url`, so the
// storage backend is fully swappable here without touching any caller.
// ──────────────────────────────────────────────────────────────────────────

// Canonical module folders. Used to populate folder pickers and to validate
// incoming folder values. Free-text categories (from the Gallery page) are also
// allowed — they are slugified into a folder.
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

// Root Cloudinary folder. Set CLOUDINARY_FOLDER in env to separate environments
// (e.g. "vertex-kashmir/dev" vs "vertex-kashmir/prod"). Falls back to the legacy
// root so existing uploads aren't orphaned if the var is missing.
function getCloudinaryRoot(): string {
  return process.env.CLOUDINARY_FOLDER?.trim() || "vertexkashmir";
}

/**
 * True when Cloudinary credentials are present. Supports either the single
 * CLOUDINARY_URL (cloudinary://key:secret@cloud) or the three discrete vars.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET),
  );
}

let cloudinaryReady = false;
function ensureCloudinaryConfig() {
  if (cloudinaryReady) return;
  // CLOUDINARY_URL is picked up automatically by the SDK; only configure the
  // discrete vars explicitly when the URL form is absent.
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } else {
    cloudinary.config({ secure: true });
  }
  cloudinaryReady = true;
}

// Slugify an arbitrary folder/category label into a safe segment.
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
  /** Public URL (Cloudinary secure_url or site-relative /uploads/... path). */
  url: string;
  /** The folder segment the file was stored under (slugified). */
  folder: string;
  /** Cloudinary public_id — required for retention cleanup. null on local disk. */
  publicId: string | null;
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

  if (isCloudinaryConfigured()) {
    return saveToCloudinary(buffer, slug);
  }

  return saveToLocalDisk(buffer, slug, ext);
}

async function saveToCloudinary(
  buffer: Buffer,
  slug: string,
): Promise<SaveUploadResult> {
  ensureCloudinaryConfig();

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${getCloudinaryRoot()}/${slug}`,
        // Let Cloudinary detect image vs video from the bytes.
        resource_type: "auto",
        // Unique public id; Cloudinary appends the correct extension itself.
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploaded as { secure_url: string; public_id: string });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, folder: slug, publicId: result.public_id };
}

/**
 * Delete a batch of assets from Cloudinary by public_id.
 * Silently skips if Cloudinary is not configured (local dev).
 * Returns the number of assets successfully deleted.
 */
export async function deleteFromCloudinary(publicIds: string[]): Promise<number> {
  if (!publicIds.length || !isCloudinaryConfigured()) return 0;
  ensureCloudinaryConfig();

  // Cloudinary bulk delete accepts up to 100 ids per call.
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < publicIds.length; i += BATCH) {
    const batch = publicIds.slice(i, i + BATCH);
    try {
      // resource_type "image" covers images; raw covers PDFs/docs. Try both.
      await Promise.allSettled([
        cloudinary.api.delete_resources(batch, { resource_type: "image" }),
        cloudinary.api.delete_resources(batch, { resource_type: "raw" }),
        cloudinary.api.delete_resources(batch, { resource_type: "video" }),
      ]);
      deleted += batch.length;
    } catch {
      // best-effort — log but don't abort the retention job
    }
  }
  return deleted;
}

async function saveToLocalDisk(
  buffer: Buffer,
  slug: string,
  ext: string,
): Promise<SaveUploadResult> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${slug}/${filename}`, folder: slug, publicId: null };
}
