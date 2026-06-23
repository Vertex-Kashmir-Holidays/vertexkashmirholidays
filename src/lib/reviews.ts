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
