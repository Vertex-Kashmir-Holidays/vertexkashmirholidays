// src/app/(public)/faq/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildFAQPage } from "@/components/seo/JsonLd";
import { FaqHero } from "@/components/faq/FaqHero";
import { FaqAccordionPage } from "@/components/faqs/FaqAccordionPage";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Frequently Asked Questions — Kashmir Trip Planning",
    description:
      "Answers to the most common questions about booking a Kashmir tour with Vertex Kashmir Holidays — payments, itineraries, best time to visit, cancellations and more.",
    canonical: `${SITE_URL}/faq`,
  });
}

export default async function FaqPage() {
  const categories = await prisma.faqCategory.findMany({
    where: { isActive: true, faqs: { some: { status: "PUBLISHED", placements: { has: "FAQ" } } } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      faqs: {
        where: { status: "PUBLISHED", placements: { has: "FAQ" } },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          question: true,
          answer: true,
          slug: true,
          tours: { select: { id: true, title: true, slug: true } },
          destinations: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  const allFaqs = categories.flatMap((c) => c.faqs);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "FAQ", url: `${SITE_URL}/faq` },
  ]);
  // The one page where the full answer is genuinely visible — every other
  // page's FAQ schema is built from shortAnswer instead (see FaqPreviewList).
  const faqPageJsonLd =
    allFaqs.length > 0
      ? buildFAQPage(allFaqs.map((f) => ({ question: f.question, answer: f.answer })))
      : null;

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {faqPageJsonLd && <JsonLd data={faqPageJsonLd} />}
      <FaqHero />
      <div className="mx-auto max-w-[1300px] px-4 py-12 sm:px-6 sm:py-16">
        {categories.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No FAQs published yet.</p>
        ) : (
          <FaqAccordionPage categories={categories} />
        )}
      </div>
    </div>
  );
}
