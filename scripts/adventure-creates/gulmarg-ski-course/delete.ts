// Undo for create.ts: removes the adventure and the FAQs it created. DRY RUN unless APPLY=1.
// Refuses if the adventure is published, or has leads, or if any linked FAQ is also linked elsewhere.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "gulmarg-ski-course";

async function main() {
  const c = await prisma.adventure.findUnique({
    where: { slug: SLUG },
    include: {
      relatedFaqs: {
        include: {
          _count: {
            select: {
              tours: true,
              destinations: true,
              blogs: true,
              adventures: true,
              activities: true,
              collections: true,
            },
          },
        },
      },
      _count: { select: { leads: true } },
    },
  });
  if (!c) return console.log("nothing to delete — adventure not found");
  if (c.published) throw new Error("adventure is published — unpublish it first");
  if (c._count.leads) throw new Error(`adventure has ${c._count.leads} leads — not deleting`);
  const shared = c.relatedFaqs.filter(
    (f) =>
      f._count.tours +
        f._count.destinations +
        f._count.blogs +
        f._count.adventures +
        f._count.activities +
        f._count.collections >
      1,
  );
  if (shared.length)
    throw new Error("FAQs linked elsewhere: " + shared.map((f) => f.slug).join(", "));
  console.log(`Would delete adventure ${c.id} (${SLUG}) and ${c.relatedFaqs.length} FAQs.`);
  if (process.env.APPLY !== "1") return console.log("DRY RUN — nothing deleted.");
  await prisma.$transaction([
    prisma.faq.deleteMany({ where: { id: { in: c.relatedFaqs.map((f) => f.id) } } }),
    prisma.adventure.delete({ where: { id: c.id } }),
  ]);
  console.log("DELETED");
}
main().finally(() => prisma.$disconnect());
