// Upload the collected hotel photos (docs/hotels/<city>/<slug>/main.jpg,
// room-1.jpg, room-2.jpg) to Cloudinary and save the URLs on HotelSupplier.
//
// Two steps, run separately:
//
//   1. Upload (no database access):
//        npx tsx --env-file=.env scripts/upload-hotel-photos.ts upload srinagar
//      Each photo is resized to max 1600px, converted to WebP, stamped with
//      the same Vertex watermark as every other upload (applyWatermark), then
//      uploaded to vertex-kashmir/hotels/<city>/<slug>/{main,room-1,room-2}.
//      Fixed public_ids + overwrite, so re-running replaces rather than
//      duplicates. URLs go to docs/hotels/<city>/cloudinary.json; hotels
//      already in that file are skipped (pass --force to redo them).
//
//   2. Save URLs to a database:
//        DATABASE_URL=... npx tsx scripts/upload-hotel-photos.ts apply srinagar
//      Sets coverImageUrl / roomImageUrl / roomImage2Url by hotel id from
//      cloudinary.json. Never touches showOnWebsite or any other field.
//      Uses whatever DATABASE_URL is passed — run once per environment.
import { readFile, readdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import { applyWatermark, ensureCloudinaryConfig } from "@/lib/storage";

const PHOTOS = ["main", "room-1", "room-2"] as const;
type Entry = { id: string; main: string; "room-1": string; "room-2": string };

const [mode, city] = process.argv.slice(2);
const force = process.argv.includes("--force");
const cityDir = path.join(process.cwd(), "docs/hotels", city ?? "");
const manifestPath = path.join(cityDir, "cloudinary.json");
// Slug -> HotelSupplier id, written when the folders were created.
const idsPath = path.join(process.cwd(), "docs/hotels", `.${city}-ids.csv`);

async function readManifest(): Promise<Record<string, Entry>> {
  return existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : {};
}

function uploadBuffer(buffer: Buffer, folder: string, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, public_id: publicId, resource_type: "image", overwrite: true, invalidate: true },
        (err, res) => (err || !res ? reject(err ?? new Error("no response")) : resolve(res)),
      )
      .end(buffer);
  });
}

async function upload() {
  ensureCloudinaryConfig();
  const ids = Object.fromEntries(
    (await readFile(idsPath, "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((line) => line.trim().split(",")),
  );
  const manifest = await readManifest();
  const slugs = (await readdir(cityDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let uploaded = 0;
  for (const slug of slugs) {
    const files = PHOTOS.map((p) => path.join(cityDir, slug, `${p}.jpg`));
    if (!files.every((f) => existsSync(f))) continue; // no photos yet
    if (manifest[slug] && !force) {
      console.log(`skip  ${slug} (already uploaded)`);
      continue;
    }
    if (!ids[slug]) {
      console.warn(`WARN  ${slug}: no hotel id in ${path.basename(idsPath)}, skipped`);
      continue;
    }
    const entry = { id: ids[slug] } as Entry;
    for (const [i, photo] of PHOTOS.entries()) {
      const webp = await sharp(await readFile(files[i]))
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      const stamped = await applyWatermark(webp, "webp");
      const res = await uploadBuffer(stamped, `vertex-kashmir/hotels/${city}/${slug}`, photo);
      entry[photo] = res.secure_url;
    }
    manifest[slug] = entry;
    // Save after every hotel so an interrupted run resumes where it stopped.
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    uploaded++;
    console.log(`done  ${slug}`);
  }
  console.log(`\n${uploaded} hotels uploaded; ${Object.keys(manifest).length} in ${path.basename(manifestPath)}.`);
}

async function apply() {
  const prisma = new PrismaClient();
  const manifest = await readManifest();
  let updated = 0;
  const missing: string[] = [];
  for (const [slug, e] of Object.entries(manifest)) {
    const res = await prisma.hotelSupplier.updateMany({
      where: { id: e.id },
      data: { coverImageUrl: e.main, roomImageUrl: e["room-1"], roomImage2Url: e["room-2"] },
    });
    if (res.count) updated++;
    else missing.push(slug);
  }
  await prisma.$disconnect();
  console.log(`${updated} hotels updated.`);
  if (missing.length) console.log(`Not found in this database (${missing.length}): ${missing.join(", ")}`);
}

if (!city || (mode !== "upload" && mode !== "apply")) {
  console.error("Usage: npx tsx --env-file=.env scripts/upload-hotel-photos.ts <upload|apply> <city> [--force]");
  process.exit(1);
}
(mode === "upload" ? upload() : apply()).catch((err) => {
  console.error(err);
  process.exit(1);
});
