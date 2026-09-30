// One-off setup: upload the Vertex logo to Cloudinary as the overlay layer
// used to watermark videos at DELIVERY time (see src/lib/videoWatermark.ts).
// Images are watermarked at upload (src/lib/storage.ts); videos upload
// straight from the browser to Cloudinary, so instead Cloudinary composites
// this logo onto the video when it's served — existing videos included, and
// the stored originals stay clean.
//
// Uses the same logo file as the image watermark. Stored at a fixed,
// environment-neutral public id (local and prod share one Cloudinary cloud),
// so this only needs running once per Cloudinary account. Idempotent:
// re-running just overwrites the same asset (e.g. after a logo change).
//
// Usage: npx tsx --env-file=.env scripts/upload-video-watermark.ts

import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { VIDEO_WATERMARK_PUBLIC_ID } from "../src/lib/videoWatermark";

const LOGO_PATH = path.join(
  process.cwd(),
  "public/brand/png/horizontal/vertex-horizontal-dark-1600w.png",
);

async function main() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true }); // SDK reads CLOUDINARY_URL itself
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  if (!cloudinary.config().cloud_name) throw new Error("Cloudinary is not configured.");

  const res = await cloudinary.uploader.upload(LOGO_PATH, {
    public_id: VIDEO_WATERMARK_PUBLIC_ID,
    resource_type: "image",
    overwrite: true,
    invalidate: true,
  });
  console.log(`Uploaded video watermark → ${res.public_id} (${res.width}x${res.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
