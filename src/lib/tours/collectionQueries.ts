import { prisma } from "@/lib/prisma";
import { tourCardOptions } from "@/lib/tours/cards";

/**
 * Published Tour Collections that currently list at least one published tour
 * — the only collections that resolve to a live page (an empty one 404s), so
 * the only ones safe to link to (/tours row, sitemap, static params).
 */
export async function getLiveTourCollections() {
  const rows = await prisma.tourCollection.findMany({
    where: { published: true, tours: { some: { published: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      name: true,
      slug: true,
      updatedAt: true,
      tours: { where: { published: true }, select: { packageOptions: true } },
    },
  });
  return rows.map((c) => ({
    name: c.name,
    slug: c.slug,
    updatedAt: c.updatedAt,
    // Number of cards the collection page shows — a tour with package
    // options counts once per published option (see tourCardOptions).
    packageCount: c.tours.reduce((n, t) => n + tourCardOptions(t.packageOptions).length, 0),
  }));
}
