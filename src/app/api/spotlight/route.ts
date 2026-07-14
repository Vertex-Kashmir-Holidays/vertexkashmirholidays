import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public, unguarded — returns one random published tour package and one
// random published blog post. Used by small "spotlight" widgets (e.g. the
// /tours/category sidebar) that want content to differ per visit without
// making the page itself dynamic. Random pick is done via count + a random
// skip rather than fetching every row, so the query cost stays a single
// indexed count plus a single-row select regardless of table size.
export async function GET() {
  const [tourCount, blogCount] = await Promise.all([
    prisma.tour.count({ where: { published: true } }),
    prisma.blog.count({ where: { published: true } }),
  ]);

  const [tour, blog] = await Promise.all([
    tourCount > 0
      ? prisma.tour.findFirst({
          where: { published: true },
          orderBy: { id: "asc" },
          skip: Math.floor(Math.random() * tourCount),
          select: {
            id: true,
            slug: true,
            title: true,
            badge: true,
            badgeColor: true,
            duration: true,
            coverImage: true,
            rating: true,
            reviewCount: true,
            priceFrom: true,
            priceWas: true,
            destinations: { select: { destination: { select: { name: true } } } },
          },
        })
      : null,
    blogCount > 0
      ? prisma.blog.findFirst({
          where: { published: true },
          orderBy: { id: "asc" },
          skip: Math.floor(Math.random() * blogCount),
          select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, readTime: true },
        })
      : null,
  ]);

  return NextResponse.json(
    { tour, blog },
    { headers: { "Cache-Control": "no-store" } },
  );
}
