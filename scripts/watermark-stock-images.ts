// One-off: stamp the Vertex watermark onto the built-in stock images in
// public/itinerary/ (the "Stock images" tab of the itinerary / proposal image
// picker), using the same logo and placement as every upload.
//
// Files already done are listed in public/itinerary/.watermarked, so running
// this again never stamps a second logo. No database or Cloudinary access.
//
//   npx tsx scripts/watermark-stock-images.ts
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { applyWatermark } from "@/lib/storage";

const DIR = path.join(process.cwd(), "public/itinerary");
const MARKER = path.join(DIR, ".watermarked");

async function main() {
  const done = new Set(
    (await readFile(MARKER, "utf8").catch(() => ""))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  const files = (await readdir(DIR)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();

  let stamped = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`skip  ${file} (already watermarked)`);
      continue;
    }
    const full = path.join(DIR, file);
    const ext = path.extname(file).slice(1).toLowerCase().replace("jpg", "jpeg");
    const out = await applyWatermark(await readFile(full), ext);
    await writeFile(full, out);
    done.add(file);
    stamped++;
    console.log(`done  ${file}`);
  }

  await writeFile(MARKER, [...done].sort().join("\n") + "\n");
  console.log(`\n${stamped} watermarked, ${files.length - stamped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
