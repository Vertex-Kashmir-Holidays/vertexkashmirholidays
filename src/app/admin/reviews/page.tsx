import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { ReviewsClient } from "@/components/admin/reviews/ReviewsClient";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

const HERO_GROUPS: ContentGroup[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroBreadcrumb", label: "Breadcrumb", type: "text" },
      { key: "heroTitle", label: "Title", type: "text" },
      { key: "heroSubtitle", label: "Subtitle", type: "textarea" },
      { key: "heroImage", label: "Hero image (desktop)", type: "image" },
      { key: "heroImageMobile", label: "Hero image (mobile)", type: "image" },
      { key: "ogImage", label: "OG / social image", type: "image" },
    ],
  },
];

export default async function AdminReviewsPage() {
  const session = await auth();
  const role = session!.user.role;
  const isAdmin = isAdminRole(role);

  const [reviews, totalCount, pendingCount, tours, canEdit, canDelete, heroContent] = await Promise.all([
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
    prisma.reviewsContent.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageEditorHeader title="Reviews Page" publicHref="/reviews" readOnly={!canEdit} />
      <ContentForm contentKey="reviews" groups={HERO_GROUPS} initial={heroContent} canEdit={canEdit} />
      <ReviewsClient
        initialReviews={reviews}
        totalCount={totalCount}
        pendingCount={pendingCount}
        tours={tours}
        isAdmin={isAdmin}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
