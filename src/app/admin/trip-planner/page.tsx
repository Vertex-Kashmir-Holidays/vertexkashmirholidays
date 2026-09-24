import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "Trip Planner Page — Admin" };
export const dynamic = "force-dynamic";

// Same singleton-content editing pattern as Home/About/Contact/Reviews —
// see TripPlannerContent's own doc comment in prisma/schema.prisma. Keep the
// keyword-aligned defaults this feeds (src/app/(public)/plan-your-kashmir-trip/
// page.tsx's fallbacks) in mind when changing copy here — this is a paid
// Google Ads landing page for "Kashmir tour packages"-family search terms.
const GROUPS: ContentGroup[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroKicker", label: "Kicker", type: "text" },
      { key: "heroTitle", label: "H1", type: "text" },
      { key: "heroSubtitle", label: "Supporting copy", type: "textarea" },
    ],
  },
  {
    title: "Tour Packages Section",
    fields: [
      { key: "tourKicker", label: "Kicker", type: "text" },
      { key: "tourTitle", label: "Heading", type: "text" },
      { key: "tourSubtitle", label: "Supporting line", type: "textarea" },
    ],
  },
  {
    title: "Pricing Block",
    fields: [
      { key: "pricingTitle", label: "Heading", type: "text" },
      {
        key: "pricingBody",
        label:
          "Body — explain how pricing works, never a fixed starting price (that's pulled live from real Tour prices)",
        type: "textarea",
      },
    ],
  },
  {
    title: "SEO",
    fields: [
      { key: "metaTitle", label: "Page title", type: "text" },
      { key: "metaDescription", label: "Meta description", type: "textarea" },
    ],
  },
];

export default async function AdminTripPlannerPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "tripPlanner", "view"))) redirect("/admin/dashboard");

  const [canEdit, content] = await Promise.all([
    can(role, "tripPlanner", "edit"),
    prisma.tripPlannerContent.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageEditorHeader
        title="Trip Planner Page"
        publicHref="/plan-your-kashmir-trip"
        readOnly={!canEdit}
      />
      <ContentForm contentKey="tripPlanner" groups={GROUPS} initial={content} canEdit={canEdit} />
    </div>
  );
}
