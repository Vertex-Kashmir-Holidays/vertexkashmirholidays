import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { ReviewsClient } from "@/components/admin/reviews/ReviewsClient";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await auth();
  const role = session!.user.role;
  const isAdmin = isAdminRole(role);

  const [reviews, totalCount, pendingCount, tours, canEdit, canDelete] = await Promise.all([
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
    can(role, "reviews", "edit"),
    can(role, "reviews", "delete"),
  ]);

  return (
    <ReviewsClient
      initialReviews={reviews}
      totalCount={totalCount}
      pendingCount={pendingCount}
      tours={tours}
      isAdmin={isAdmin}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
