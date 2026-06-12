import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReviewsClient } from "@/components/admin/reviews/ReviewsClient";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, totalCount, pendingCount] = await Promise.all([
    prisma.review.findMany({
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
      include: {
        tour: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count(),
    prisma.review.count({ where: { approved: false } }),
  ]);

  return (
    <ReviewsClient
      initialReviews={reviews}
      totalCount={totalCount}
      pendingCount={pendingCount}
    />
  );
}
