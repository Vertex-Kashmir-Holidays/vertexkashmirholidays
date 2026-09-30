// Vertex logo on videos, applied by Cloudinary at DELIVERY time.
//
// Images get the logo burned in at upload (src/lib/storage.ts). Videos can't:
// they upload straight from the browser to Cloudinary (see
// uploadVideoDirect.ts — Vercel's ~4.5 MB body cap), so our server never sees
// them. Instead every Cloudinary video URL the public site plays is rewritten
// to include an overlay transformation: Cloudinary composites the logo on
// first request and caches that version. Existing videos are covered, stored
// originals stay clean, and the logo's size/position can change here anytime.
//
// The logo layer itself is uploaded once by scripts/upload-video-watermark.ts.

/** Cloudinary public id of the logo layer (environment-neutral on purpose). */
export const VIDEO_WATERMARK_PUBLIC_ID = "vertex-kashmir/brand/video-watermark";

// Same look as the image watermark: bottom-right, ~22% of the video width,
// 70% opacity, 24px from the edges.
const OVERLAY_TRANSFORMATION = [
  `l_${VIDEO_WATERMARK_PUBLIC_ID.replace(/\//g, ":")},c_scale,fl_relative,w_0.22,o_70`,
  "fl_layer_apply,g_south_east,x_24,y_24",
].join("/");

const CLOUDINARY_VIDEO_URL = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.+)$/;

/**
 * Adds the Vertex logo overlay to a Cloudinary video URL. Anything else
 * (YouTube/Vimeo, local /uploads files, already-watermarked URLs) is returned
 * unchanged.
 */
export function withVideoWatermark(url: string): string {
  const m = CLOUDINARY_VIDEO_URL.exec(url);
  if (!m || m[2].startsWith(OVERLAY_TRANSFORMATION)) return url;
  return `${m[1]}${OVERLAY_TRANSFORMATION}/${m[2]}`;
}
