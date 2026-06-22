import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEWABLE_BOOKING_STATUSES } from "@/lib/reviews";
import { AccountReviews } from "@/components/account/AccountReviews";

export const metadata: Metadata = { title: "My Reviews — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [reviews, bookings] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        body: true,
        approved: true,
        createdAt: true,
        tour: { select: { id: true, title: true, slug: true } },
      },
    }),
    // Tours the customer has actually travelled on (completed bookings).
    prisma.booking.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: [...REVIEWABLE_BOOKING_STATUSES] },
        tourId: { not: null },
      },
      select: { tour: { select: { id: true, title: true, slug: true, published: true } } },
    }),
  ]);

  // Distinct, published tours that don't already have a review from this user.
  const reviewedTourIds = new Set(reviews.map((r) => r.tour.id));
  const seen = new Set<string>();
  const reviewableTours = bookings
    .map((b) => b.tour)
    .filter((t): t is NonNullable<typeof t> => !!t && t.published)
    .filter((t) => {
      if (seen.has(t.id) || reviewedTourIds.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .map((t) => ({ id: t.id, title: t.title }));

  return (
    <AccountReviews
      reviews={reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        approved: r.approved,
        createdAt: r.createdAt.toISOString(),
        tourTitle: r.tour.title,
      }))}
      reviewableTours={reviewableTours}
    />
  );
}
