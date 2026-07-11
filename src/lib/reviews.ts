import { prisma } from "@/lib/prisma";

// A customer may only review a tour they actually travelled on. These are the
// booking statuses that count as a completed/eligible purchase.
export const REVIEWABLE_BOOKING_STATUSES = ["CONFIRMED", "PAID"] as const;

/**
 * Recompute and persist a tour's denormalised `rating` (1-decimal average) and
 * `reviewCount` from its currently-approved reviews. Call after any change that
 * affects the approved review set (approve/reject, edit, delete, create).
 */
export async function recomputeTourRating(tourId: string): Promise<void> {
  const approved = await prisma.review.findMany({
    where: { tourId, approved: true },
    select: { rating: true },
  });
  const count = approved.length;
  const avg = count > 0 ? approved.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.tour.update({
    where: { id: tourId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: count },
  });
}

// Canonical shape for a customer review rendered as social proof. The admin
// Review module (and customer self-service reviews) is the single source of
// truth for testimonials across the whole site — home, contact and campaign
// pages all read from here. Avatar resolves per-review → reviewer's profile
// picture → null; location surfaces the reviewed tour's title.
export type ReviewDisplay = {
  id: string;
  name: string;
  location: string | null;
  avatar: string | null;
  quote: string;
  rating: number;
};

export async function getDisplayReviews(limit = 12): Promise<ReviewDisplay[]> {
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      avatar: true,
      rating: true,
      body: true,
      tour: { select: { title: true } },
      user: { select: { image: true } },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.tour?.title ?? null,
    avatar: r.avatar ?? r.user?.image ?? null,
    quote: r.body,
    rating: r.rating,
  }));
}

// ── Dedicated /reviews page ──────────────────────────────────────────────────
// Same Review model + `approved` filter as getDisplayReviews above — this is a
// directly-rendered public RSC page (like /tours, /blog), not a public API
// endpoint, so simple offset pagination via a `?page=` query param is the
// right fit rather than the cursor pattern used for public API routes.

export type ReviewListItem = {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  body: string;
  createdAt: Date;
  tourTitle: string | null;
  tourSlug: string | null;
};

export async function getApprovedReviewsPage(opts: {
  page: number;
  perPage: number;
  rating?: number;
}): Promise<{ items: ReviewListItem[]; total: number }> {
  const where = {
    approved: true,
    ...(opts.rating ? { rating: opts.rating } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.perPage,
      take: opts.perPage,
      select: {
        id: true,
        name: true,
        avatar: true,
        rating: true,
        body: true,
        createdAt: true,
        tour: { select: { title: true, slug: true } },
        user: { select: { image: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar ?? r.user?.image ?? null,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      tourTitle: r.tour?.title ?? null,
      tourSlug: r.tour?.slug ?? null,
    })),
    total,
  };
}

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

/** Average rating, total count, and the 1–5 star breakdown — one groupBy query. */
export async function getReviewStats(): Promise<ReviewStats> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { approved: true },
    _count: true,
  });

  const distribution: ReviewStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const g of grouped) {
    const rating = g.rating as 1 | 2 | 3 | 4 | 5;
    distribution[rating] = g._count;
    total += g._count;
    sum += rating * g._count;
  }

  return { average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0, total, distribution };
}
