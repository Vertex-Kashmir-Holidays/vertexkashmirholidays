// Brings an already-created Gulmarg Ski Course adventure up to date with
// ./extras.ts: adds the extra highlight/activity cards and corrects the meta
// description's starting price. Idempotent — anything already applied is
// skipped. DRY RUN unless APPLY=1.
//   DATABASE_URL=… npx tsx scripts/adventure-creates/gulmarg-ski-course/apply-updates.ts
//   DATABASE_URL=… APPLY=1 npx tsx scripts/adventure-creates/gulmarg-ski-course/apply-updates.ts
import { PrismaClient } from "@prisma/client";
import { EXTRA_ACTIVITIES, EXTRA_HIGHLIGHTS, NEW_META_PRICE, OLD_META_PRICE } from "./extras";

const prisma = new PrismaClient();
const SLUG = "gulmarg-ski-course";

// Same demo images as create.ts, cycled on from the existing cards.
const CLD = "https://res.cloudinary.com/dgvyci9jk/image/upload";
const DEMO = [
  `${CLD}/v1787429946/vertex-kashmir/prod/gulmarg/1787429946827-z3e0yx.webp`,
  "/hero/gulmarg-winter-lg.webp",
  `${CLD}/v1787429943/vertex-kashmir/prod/gulmarg/1787429943804-3wtaav.webp`,
];

type Card = { title: string; image?: string; [k: string]: unknown };
const parse = (raw: string): Card[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

async function main() {
  const db = process.env.DATABASE_URL?.replace(/.*\/([^/?]+).*/, "$1");
  const a = await prisma.adventure.findUnique({
    where: { slug: SLUG },
    select: { id: true, highlights: true, activities: true, metaDesc: true },
  });
  if (!a) throw new Error(`No adventure "${SLUG}" in ${db}`);

  const highlights = parse(a.highlights);
  const activities = parse(a.activities);
  const hTitles = new Set(highlights.map((h) => h.title));
  const aTitles = new Set(activities.map((x) => x.title));

  const newH = EXTRA_HIGHLIGHTS.filter((h) => !hTitles.has(h.title)).map((h, i) => ({
    image: DEMO[(highlights.length + i) % DEMO.length],
    ...h,
  }));
  const newA = EXTRA_ACTIVITIES.filter((t) => !aTitles.has(t)).map((title, i) => ({
    image: DEMO[(activities.length + i + 1) % DEMO.length],
    title,
  }));

  console.log(`DB ${db} — "${SLUG}"`);
  console.log(`  highlights: ${highlights.length} → ${highlights.length + newH.length}`, newH.map((h) => h.title));
  console.log(`  activities: ${activities.length} → ${activities.length + newA.length}`, newA.map((x) => x.title));
  const fixMeta = !!a.metaDesc?.includes(OLD_META_PRICE);
  const metaDesc = fixMeta ? a.metaDesc!.replace(OLD_META_PRICE, NEW_META_PRICE) : a.metaDesc;
  console.log(`  meta description: ${fixMeta ? `→ "${metaDesc}"` : "already up to date"}`);
  if (!newH.length && !newA.length && !fixMeta) return console.log("Nothing to change.");
  if (process.env.APPLY !== "1") return console.log("DRY RUN — nothing written.");

  await prisma.adventure.update({
    where: { id: a.id },
    data: {
      highlights: JSON.stringify([...highlights, ...newH]),
      activities: JSON.stringify([...activities, ...newA]),
      ...(fixMeta ? { metaDesc } : {}),
    },
  });
  console.log("Applied.");
}

main().finally(() => prisma.$disconnect());
