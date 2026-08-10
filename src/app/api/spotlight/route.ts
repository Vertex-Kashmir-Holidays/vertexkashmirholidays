import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Public, unguarded — returns one random published tour package and one
// random published blog post. Used by small "spotlight" widgets (e.g. the
// /tours/category sidebar) that want content to differ per visit without
// making the page itself dynamic. Random pick is done via count + a random
// skip rather than fetching every row, so the query cost stays a single
// indexed count plus a single-row select regardless of table size.
export async function GET(req: NextRequest) {
  // The randomness requires `no-store`, so every hit reaches the database (4
  // queries) with no CDN in front of it — the one public read endpoint where a
  // flood costs real database time. A widget renders once per page view, so 60
  // per minute is far above any real browsing pattern.
  const limit = await rateLimit(`spotlight:ip:${clientIp(req)}`, 60, "1 m");
  if (!limit.success) {
    return tooManyRequests(limit);
  }

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
            minPersons: true,
            destinations: { select: { destination: { select: { name: true } } } },
          },
        })
      : null,
    blogCount > 0
      ? prisma.blog.findFirst({
          where: { published: true },
          orderBy: { id: "asc" },
          skip: Math.floor(Math.random() * blogCount),
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverImage: true,
            readTime: true,
          },
        })
      : null,
  ]);

  return NextResponse.json({ tour, blog }, { headers: { "Cache-Control": "no-store" } });
}
