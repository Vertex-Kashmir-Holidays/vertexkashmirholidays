import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS } from "@/lib/admin/pageFields";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";
import { ListEditor } from "@/components/admin/pages/ListEditor";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "About Page — Admin" };
export const dynamic = "force-dynamic";

const GROUPS: ContentGroup[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroBreadcrumb", label: "Breadcrumb", type: "text" },
      { key: "heroTitle", label: "Title", type: "text" },
      { key: "heroSubtitle", label: "Subtitle", type: "textarea" },
      { key: "heroImage", label: "Hero image (desktop)", type: "image" },
      { key: "heroImageMobile", label: "Hero image (mobile)", type: "image" },
      { key: "ogImage", label: "OG / social image", type: "image" },
      { key: "heroCtaPrimaryLabel", label: "Primary CTA label", type: "text" },
      { key: "heroCtaPrimaryHref", label: "Primary CTA link", type: "text" },
      { key: "heroCtaSecondaryLabel", label: "Secondary CTA label", type: "text" },
      { key: "heroCtaSecondaryHref", label: "Secondary CTA link", type: "text" },
    ],
  },
  {
    title: "Story",
    fields: [
      { key: "storyKicker", label: "Kicker", type: "text" },
      { key: "storyTitle", label: "Title", type: "text" },
      { key: "storyBody", label: "Body", type: "textarea" },
      { key: "storyImage", label: "Story image", type: "image" },
      { key: "statsImage", label: "Stats image", type: "image" },
    ],
  },
  {
    title: "Values & Team & Journey",
    fields: [
      { key: "valuesKicker", label: "Values kicker", type: "text" },
      { key: "valuesTitle", label: "Values title", type: "text" },
      { key: "valuesSubtitle", label: "Values subtitle", type: "textarea" },
      { key: "teamKicker", label: "Team kicker", type: "text" },
      { key: "teamTitle", label: "Team title", type: "text" },
      { key: "teamCtaLabel", label: "Team CTA label", type: "text" },
      { key: "teamCtaHref", label: "Team CTA link", type: "text" },
      { key: "journeyKicker", label: "Journey kicker", type: "text" },
      { key: "journeyTitle", label: "Journey title", type: "text" },
      { key: "pressLabel", label: "Press label", type: "text" },
    ],
  },
  {
    title: "Closing CTA",
    fields: [
      { key: "ctaTitle", label: "Title", type: "text" },
      { key: "ctaSubtitle", label: "Subtitle", type: "textarea" },
      { key: "ctaImage", label: "Image", type: "image" },
      { key: "ctaWhatsappLabel", label: "WhatsApp label", type: "text" },
      { key: "ctaWhatsappHref", label: "WhatsApp link", type: "text" },
      { key: "ctaCallLabel", label: "Call label", type: "text" },
      { key: "ctaCallHref", label: "Call link", type: "text" },
      { key: "ctaEmailLabel", label: "Email label", type: "text" },
      { key: "ctaEmailHref", label: "Email link", type: "text" },
    ],
  },
];

export default async function AdminAboutPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "about", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "about", "create"),
    can(role, "about", "edit"),
    can(role, "about", "delete"),
  ]);
  const perms = { canCreate, canEdit, canDelete };
  const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

  const [content, storyFeatures, stats, values, team, journey, press] = await Promise.all([
    prisma.aboutContent.findUnique({ where: { id: "singleton" } }),
    prisma.aboutStoryFeature.findMany({ orderBy: order }),
    prisma.aboutStat.findMany({ orderBy: order }),
    prisma.aboutValue.findMany({ orderBy: order }),
    prisma.teamMember.findMany({ orderBy: order }),
    prisma.journeyMilestone.findMany({ orderBy: order }),
    prisma.pressLogo.findMany({ orderBy: order }),
  ]);

  return (
    <div className="space-y-6">
      <PageEditorHeader title="About Page" publicHref="/about" readOnly={!canEdit} />
      <ContentForm contentKey="about" groups={GROUPS} initial={content} canEdit={canEdit} />
      <div className="space-y-5">
        <ListEditor title="Story Features" resource="aboutStoryFeatures" fields={FIELD_DEFS.aboutStoryFeatures} items={storyFeatures} {...perms} />
        <ListEditor title="Stats" resource="aboutStats" fields={FIELD_DEFS.aboutStats} items={stats} {...perms} />
        <ListEditor title="Values" resource="aboutValues" fields={FIELD_DEFS.aboutValues} items={values} {...perms} />
        <ListEditor title="Team Members" resource="teamMembers" fields={FIELD_DEFS.teamMembers} items={team} {...perms} />
        <ListEditor title="Journey Milestones" resource="journeyMilestones" fields={FIELD_DEFS.journeyMilestones} items={journey} {...perms} />
        <ListEditor title="Press Logos" resource="pressLogos" fields={FIELD_DEFS.pressLogos} items={press} {...perms} />
      </div>
    </div>
  );
}
