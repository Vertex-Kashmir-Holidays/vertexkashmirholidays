import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS } from "@/lib/admin/pageFields";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";
import { ListEditor } from "@/components/admin/pages/ListEditor";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "Contact Page — Admin" };
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
    ],
  },
  {
    title: "Reach / Promise headings",
    fields: [
      { key: "reachKicker", label: "Reach kicker", type: "text" },
      { key: "reachTitle", label: "Reach title", type: "text" },
      { key: "promiseKicker", label: "Promise kicker", type: "text" },
      { key: "promiseTitle", label: "Promise title", type: "text" },
    ],
  },
  {
    title: "Primary office & map",
    fields: [
      { key: "officeKicker", label: "Office kicker", type: "text" },
      { key: "officeTitle", label: "Office title", type: "text" },
      { key: "officeSubtitle", label: "Office subtitle", type: "textarea" },
      { key: "officeName", label: "Office name", type: "text" },
      { key: "officeAddress", label: "Office address", type: "textarea" },
      { key: "officeHours", label: "Office hours", type: "text" },
      { key: "officeMapLabel", label: "Map label", type: "text" },
      { key: "officeMapSubLabel", label: "Map sub-label", type: "text" },
      { key: "directionsUrl", label: "Directions URL", type: "text" },
    ],
  },
  {
    title: "FAQs / Testimonials / Social",
    fields: [
      { key: "faqsKicker", label: "FAQs kicker", type: "text" },
      { key: "faqsTitle", label: "FAQs title", type: "text" },
      { key: "faqsCtaLabel", label: "FAQs CTA label", type: "text" },
      { key: "faqsCtaHref", label: "FAQs CTA link", type: "text" },
      { key: "testimonialsKicker", label: "Testimonials kicker", type: "text" },
      { key: "testimonialsTitle", label: "Testimonials title", type: "text" },
      { key: "socialKicker", label: "Social kicker", type: "text" },
      { key: "socialTitle", label: "Social title", type: "text" },
      { key: "socialText", label: "Social text", type: "textarea" },
      { key: "socialCtaLabel", label: "Social CTA label", type: "text" },
      { key: "socialCtaHref", label: "Social CTA link", type: "text" },
    ],
  },
  {
    title: "Form & floating button",
    fields: [
      { key: "formKicker", label: "Form kicker", type: "text" },
      { key: "formTitle", label: "Form title", type: "text" },
      { key: "formNote", label: "Form note", type: "text" },
      { key: "whatsappFloatText", label: "WhatsApp float text", type: "text" },
    ],
  },
];

export default async function AdminContactPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "contact", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "contact", "create"),
    can(role, "contact", "edit"),
    can(role, "contact", "delete"),
  ]);
  const perms = { canCreate, canEdit, canDelete };
  const order = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

  const [content, heroFeatures, promiseItems, faqs, offices] = await Promise.all([
    prisma.contactContent.findUnique({ where: { id: "singleton" } }),
    prisma.contactHeroFeature.findMany({ orderBy: order }),
    prisma.contactPromiseItem.findMany({ orderBy: order }),
    prisma.contactFaq.findMany({ orderBy: order }),
    prisma.contactOffice.findMany({ orderBy: order }),
  ]);

  return (
    <div className="space-y-6">
      <PageEditorHeader title="Contact Page" publicHref="/contact" readOnly={!canEdit} />
      <ContentForm contentKey="contact" groups={GROUPS} initial={content} canEdit={canEdit} />
      <div className="space-y-5">
        <ListEditor title="Hero Features" resource="contactHeroFeatures" fields={FIELD_DEFS.contactHeroFeatures} items={heroFeatures} {...perms} />
        <ListEditor title="Promise Items" resource="contactPromiseItems" fields={FIELD_DEFS.contactPromiseItems} items={promiseItems} {...perms} />
        <ListEditor title="FAQs" resource="contactFaqs" fields={FIELD_DEFS.contactFaqs} items={faqs} {...perms} />
        <ListEditor title="Offices" resource="contactOffices" fields={FIELD_DEFS.contactOffices} items={offices} {...perms} />
      </div>
    </div>
  );
}
