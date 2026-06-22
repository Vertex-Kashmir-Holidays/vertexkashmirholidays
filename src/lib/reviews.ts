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
