// One-off: watermark gallery images uploaded before watermarking covered them.
//
// History (src/lib/storage.ts, git): watermarking started 2026-06-30 19:03 IST
// with some folders exempt; from 2026-07-12 22:20 IST every image upload is
// watermarked. So the candidates are Cloudinary images created
//   - before 2026-06-30 19:03 IST, or
//   - before 2026-07-12 22:20 IST in a formerly exempt folder.
//
// Each image is overwritten IN PLACE (same Cloudinary public_id), so every
// page / itinerary / proposal already using it shows the watermarked version.
// The original is saved to backups/gallery-originals/ first (git-ignored), and
// processed ids are recorded there so a re-run never stamps a second logo.
//
// Dev and live share the same Cloudinary images — this affects live either way.
//
//   Dry run (default, read-only):
//     DATABASE_URL=<url> npx tsx scripts/watermark-old-gallery-images.ts
//   Apply:
//     DATABASE_URL=<url> npx tsx scripts/watermark-old-gallery-images.ts --apply
import { mkdir, readFile, writeFile, appendFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { applyWatermark, folderSlug, isCloudinaryConfigured, overwriteCloudinaryImage } from "@/lib/storage";

const ALL_BEFORE = new Date("2026-06-30T19:03:00+05:30");
const EXEMPT_BEFORE = new Date("2026-07-12T22:20:00+05:30");
const FORMERLY_EXEMPT = new Set(["home", "tours", "destinations", "blog", "campaigns", "itinerary"]);

const BACKUP_DIR = path.join(process.cwd(), "backups/gallery-originals");
const DONE_FILE = path.join(BACKUP_DIR, "done.txt");

async function main() {
  const apply = process.argv.includes("--apply");
  if (apply && !isCloudinaryConfigured()) throw new Error("Cloudinary is not configured — cannot apply.");

  const rows = await prisma.gallery.findMany({
    where: { type: "IMAGE", publicId: { not: null }, createdAt: { lt: EXEMPT_BEFORE } },
    select: { id: true, url: true, publicId: true, category: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const candidates = rows.filter(
    (r) => r.createdAt < ALL_BEFORE || FORMERLY_EXEMPT.has(folderSlug(r.category)),
  );

  await mkdir(BACKUP_DIR, { recursive: true });
  const done = new Set(
    (await readFile(DONE_FILE, "utf8").catch(() => "")).split("\n").map((l) => l.trim()).filter(Boolean),
  );
  const todo = candidates.filter((r) => !done.has(r.publicId!));

  console.log(`${rows.length} images before ${EXEMPT_BEFORE.toISOString()}, ${candidates.length} need a watermark, ${candidates.length - todo.length} already done.`);
  for (const r of todo) console.log(`  ${r.createdAt.toISOString().slice(0, 10)}  ${r.category ?? "—"}  ${r.url}`);
  if (!apply) {
    console.log("\nDry run — nothing changed. Re-run with --apply to watermark these.");
    return;
  }

  let ok = 0;
  for (const r of todo) {
    try {
      const res = await fetch(r.url);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());
      const ext = (r.url.split("?")[0].split(".").pop() ?? "jpg").toLowerCase();
      // Back up the original before touching anything.
      await writeFile(path.join(BACKUP_DIR, `${r.publicId!.replace(/\//g, "__")}.${ext}`), original);
      const stamped = await applyWatermark(original, ext === "jpg" ? "jpeg" : ext);
      const url = await overwriteCloudinaryImage(r.publicId!, stamped);
      await prisma.gallery.update({ where: { id: r.id }, data: { url } });
      await appendFile(DONE_FILE, `${r.publicId}\n`);
      ok++;
      console.log(`done  ${r.publicId}`);
    } catch (err) {
      console.error(`FAIL  ${r.publicId}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\n${ok}/${todo.length} watermarked. Originals in backups/gallery-originals/.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
