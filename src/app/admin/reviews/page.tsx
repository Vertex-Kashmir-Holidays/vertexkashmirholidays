import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReviewsClient } from "@/components/admin/reviews/ReviewsClient";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, totalCount, pendingCount, tours] = await Promise.all([
    prisma.review.findMany({
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
      include: {
        tour: { select: { title: true, slug: true } },
        user: { select: { image: true } },
      },
    }),
    prisma.review.count(),
    prisma.review.count({ where: { approved: false } }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <ReviewsClient
      initialReviews={reviews}
      totalCount={totalCount}
      pendingCount={pendingCount}
      tours={tours}
    />
  );
}
