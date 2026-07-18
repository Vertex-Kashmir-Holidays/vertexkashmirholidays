// Client-only image compression for PDF embedding.
//
// @react-pdf/renderer can only embed JPEG/PNG (not WebP), and we must keep the
// whole document under 1 MB. This loads any image (bundled WebP stock or an
// uploaded /uploads/* file), downscales it, and re-encodes to a JPEG data URL.

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const cache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin for /itinerary and /uploads; crossOrigin is harmless and lets
    // canvas read remote images that send permissive CORS headers.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Returns a compressed JPEG data URL for `src`. Result is memoised per
 * src+options so repeated PDF exports don't re-encode unchanged images.
 */
export async function toCompressedJpeg(src: string, opts: CompressOptions = {}): Promise<string> {
  const { maxWidth = 640, maxHeight = 480, quality = 0.72 } = opts;
  const key = `${src}|${maxWidth}x${maxHeight}@${quality}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const img = await loadImage(src);

  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  // White matte so any transparency renders cleanly on the printed page.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  cache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Compress many image srcs to a `{ [src]: jpegDataUrl }` map. Failed images are
 * skipped (omitted from the map) so a single broken path can't abort the export.
 */
export async function compressMany(
  srcs: string[],
  opts: CompressOptions = {},
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(srcs.filter(Boolean)));
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (src) => {
      try {
        out[src] = await toCompressedJpeg(src, opts);
      } catch (err) {
        // Skip unreadable image (e.g. a broken custom QR URL) rather than
        // aborting the export — but log it so a silent drop (like the QR
        // card quietly disappearing) is visible in devtools instead of
        // looking like an unexplained missing element in the PDF.
        console.warn(
          `[itinerary-pdf] Failed to embed image "${src}" — it will be omitted from the PDF.`,
          err,
        );
      }
    }),
  );
  return out;
}
