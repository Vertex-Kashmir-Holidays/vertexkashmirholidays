// Undo for create.ts: removes the tour and the 10 FAQs it created. DRY RUN unless APPLY=1.
// Refuses if the tour is published, or has bookings/leads, or if any linked FAQ is also linked elsewhere.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "gulmarg-snow-ski-tour-package-3n-4d";

async function main() {
  const t = await prisma.tour.findUnique({
    where: { slug: SLUG },
    include: {
      relatedFaqs: {
        include: {
          _count: {
            select: {
              tours: true,
              destinations: true,
              blogs: true,
              campaigns: true,
              activities: true,
              collections: true,
            },
          },
        },
      },
      _count: { select: { bookings: true, leads: true } },
    },
  });
  if (!t) return console.log("nothing to delete — tour not found");
  if (t.published) throw new Error("tour is published — unpublish it first");
  if (t._count.bookings || t._count.leads)
    throw new Error(
      `tour has ${t._count.bookings} bookings / ${t._count.leads} leads — not deleting`,
    );
  const shared = t.relatedFaqs.filter(
    (f) =>
      f._count.tours +
        f._count.destinations +
        f._count.blogs +
        f._count.campaigns +
        f._count.activities +
        f._count.collections >
      1,
  );
  if (shared.length)
    throw new Error("FAQs linked elsewhere: " + shared.map((f) => f.slug).join(", "));
  console.log(
    `Would delete tour ${t.id} (${SLUG}) and ${t.relatedFaqs.length} FAQs; cascades remove its TourDestination/ActivityTour rows and collection link.`,
  );
  if (process.env.APPLY !== "1") return console.log("DRY RUN — nothing deleted.");
  await prisma.$transaction([
    prisma.faq.deleteMany({ where: { id: { in: t.relatedFaqs.map((f) => f.id) } } }),
    prisma.tour.delete({ where: { id: t.id } }),
  ]);
  console.log("DELETED");
}
main().finally(() => prisma.$disconnect());
