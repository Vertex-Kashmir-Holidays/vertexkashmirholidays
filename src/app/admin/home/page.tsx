import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS } from "@/lib/admin/pageFields";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";
import { ListEditor } from "@/components/admin/pages/ListEditor";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "Home Page — Admin" };
export const dynamic = "force-dynamic";

const GROUPS: ContentGroup[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroBadge", label: "Badge", type: "text" },
      { key: "heroTitle", label: "Title", type: "text" },
      { key: "heroSubtitle", label: "Subtitle", type: "textarea" },
      { key: "heroCtaPrimaryLabel", label: "Primary CTA label", type: "text" },
      { key: "heroCtaPrimaryHref", label: "Primary CTA link", type: "text" },
      { key: "heroCtaSecondaryLabel", label: "Secondary CTA label", type: "text" },
      { key: "heroCtaSecondaryHref", label: "Secondary CTA link", type: "text" },
    ],
  },
  {
    title: "Inquiry form",
    fields: [
      { key: "formKicker", label: "Kicker", type: "text" },
      { key: "formTitle", label: "Title", type: "text" },
      { key: "formSubtitle", label: "Subtitle", type: "textarea" },
      { key: "formButtonLabel", label: "Button label", type: "text" },
      { key: "formNote", label: "Note", type: "text" },
    ],
  },
  {
    title: "About section",
    fields: [
      { key: "aboutPara1", label: "Paragraph 1", type: "textarea" },
      { key: "aboutPara2", label: "Paragraph 2", type: "textarea" },
      { key: "aboutImage1", label: "Image 1", type: "image" },
      { key: "aboutImage2", label: "Image 2", type: "image" },
      { key: "aboutCardEmoji", label: "Card emoji", type: "text" },
      { key: "aboutCardTitle", label: "Card title", type: "text" },
      { key: "aboutCardSubtitle", label: "Card subtitle", type: "text" },
      { key: "aboutRatingTitle", label: "Rating title", type: "text" },
      { key: "aboutRatingSubtitle", label: "Rating subtitle", type: "text" },
    ],
  },
];

export default async function AdminHomePage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "home", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "home", "create"),
    can(role, "home", "edit"),
    can(role, "home", "delete"),
  ]);
  const perms = { canCreate, canEdit, canDelete };
  const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

  const [content, heroSlides, tickerItems, siteStats, whyChooseItems, offers, videoReviews, homeSections] =
    await Promise.all([
      prisma.homeContent.findUnique({ where: { id: "singleton" } }),
      prisma.heroSlide.findMany({ orderBy: order }),
      prisma.tickerItem.findMany({ orderBy: order }),
      prisma.siteStat.findMany({ orderBy: order }),
      prisma.whyChooseItem.findMany({ orderBy: order }),
      prisma.offer.findMany({ orderBy: order }),
      prisma.videoReview.findMany({ orderBy: order }),
      prisma.homeSection.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  return (
    <div className="space-y-6">
      <PageEditorHeader title="Home Page" publicHref="/" readOnly={!canEdit} />

      <ContentForm contentKey="home" groups={GROUPS} initial={content} canEdit={canEdit} />

      <div className="space-y-5">
        <ListEditor title="Hero Slides" resource="heroSlides" fields={FIELD_DEFS.heroSlides} items={heroSlides} {...perms} />
        <ListEditor title="Section Headings" description="Kicker/title/subtitle per home section key." resource="homeSections" fields={FIELD_DEFS.homeSections} items={homeSections} {...perms} />
        <ListEditor title="Ticker Items" resource="tickerItems" fields={FIELD_DEFS.tickerItems} items={tickerItems} {...perms} />
        <ListEditor title="Site Stats" resource="siteStats" fields={FIELD_DEFS.siteStats} items={siteStats} {...perms} />
        <ListEditor title="Why Choose Us" resource="whyChooseItems" fields={FIELD_DEFS.whyChooseItems} items={whyChooseItems} {...perms} />
        <ListEditor title="Offers" resource="offers" fields={FIELD_DEFS.offers} items={offers} {...perms} />
        <ListEditor title="Video Reviews" resource="videoReviews" fields={FIELD_DEFS.videoReviews} items={videoReviews} {...perms} />
      </div>
    </div>
  );
}
