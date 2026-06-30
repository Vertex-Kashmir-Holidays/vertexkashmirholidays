import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse, type UploadApiOptions } from "cloudinary";

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
  url: string;
  folder: string;
  publicId: string | null;
}

const WATERMARK_PATH = path.join(
  process.cwd(),
  "public/brand/png/horizontal/vertex-horizontal-light-1600w.png",
);
const WATERMARK_WIDTH_RATIO = 0.22;
const WATERMARK_OPACITY = 0.7;
const WATERMARK_MARGIN = 24;

async function applyWatermark(buffer: Buffer, ext: string): Promise<Buffer> {
  const logoRaw = await readFile(WATERMARK_PATH);
  const image = sharp(buffer);
  const { width: imgW = 0, height: imgH = 0 } = await image.metadata();

  if (imgW < 300 || imgH < 200) return buffer;

  const logoW = Math.max(80, Math.min(400, Math.round(imgW * WATERMARK_WIDTH_RATIO)));

  const { data: logoData, info: logoInfo } = await sharp(logoRaw)
    .resize(logoW)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 3; i < logoData.length; i += 4) {
    logoData[i] = Math.round(logoData[i] * WATERMARK_OPACITY);
  }

  const logoBuffer = await sharp(logoData, {
    raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 },
  })
    .png()
    .toBuffer();

  const left = Math.max(0, imgW - logoInfo.width - WATERMARK_MARGIN);
  const top = Math.max(0, imgH - logoInfo.height - WATERMARK_MARGIN);

  const outputFormat = ext === "png" ? "png" : ext === "webp" ? "webp" : "jpeg";

  return image
    .composite([{ input: logoBuffer, left, top, blend: "over" }])
    [outputFormat]({ quality: 88 })
    .toBuffer();
}

export async function saveUpload(
  buffer: Buffer,
  { folder, ext, isImage }: { folder: string; ext: string; isImage?: boolean },
): Promise<SaveUploadResult> {
  const slug = folderSlug(folder);
  const processedBuffer = isImage
    ? await applyWatermark(buffer, ext).catch(() => buffer)
    : buffer;

  if (isCloudinaryConfigured()) {
    return saveToCloudinary(processedBuffer, slug);
  }

  return saveToLocalDisk(processedBuffer, slug, ext);
}

async function saveToCloudinary(
  buffer: Buffer,
  slug: string,
): Promise<SaveUploadResult> {
  ensureCloudinaryConfig();

  const uploadOptions: UploadApiOptions = {
    folder: `${getCloudinaryRoot()}/${slug}`,
    resource_type: "auto",
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    type CloudinaryCallback = (error: UploadApiErrorResponse | undefined, uploaded: UploadApiResponse | undefined) => void;
    const cb: CloudinaryCallback = (error, uploaded) => {
      if (error || !uploaded) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }
      resolve(uploaded);
    };
    const stream = (cloudinary.uploader.upload_stream as unknown as (
      cb: CloudinaryCallback,
      opts: UploadApiOptions
    ) => ReturnType<typeof cloudinary.uploader.upload_stream>)(cb, uploadOptions);
    stream.end(buffer);
  });

  return { url: result.secure_url, folder: slug, publicId: result.public_id ?? null };
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
