// Adds the EXTRA_HIGHLIGHTS / EXTRA_ACTIVITIES cards (./extras.ts) to an
// already-created Gulmarg Ski Course adventure. Idempotent — cards whose
// title is already present are skipped. DRY RUN unless APPLY=1.
//   DATABASE_URL=… npx tsx scripts/adventure-creates/gulmarg-ski-course/add-cards.ts
//   DATABASE_URL=… APPLY=1 npx tsx scripts/adventure-creates/gulmarg-ski-course/add-cards.ts
import { PrismaClient } from "@prisma/client";
import { EXTRA_ACTIVITIES, EXTRA_HIGHLIGHTS } from "./extras";

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
    select: { id: true, highlights: true, activities: true },
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
  if (!newH.length && !newA.length) return console.log("Nothing to add.");
  if (process.env.APPLY !== "1") return console.log("DRY RUN — nothing written.");

  await prisma.adventure.update({
    where: { id: a.id },
    data: {
      highlights: JSON.stringify([...highlights, ...newH]),
      activities: JSON.stringify([...activities, ...newA]),
    },
  });
  console.log("Applied.");
}

main().finally(() => prisma.$disconnect());
