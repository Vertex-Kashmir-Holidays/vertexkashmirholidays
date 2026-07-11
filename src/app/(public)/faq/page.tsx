// src/app/(public)/faq/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildFAQPage } from "@/components/seo/JsonLd";
import { FaqHero } from "@/components/faq/FaqHero";
import { ContactFAQs } from "@/components/contact/ContactFAQs";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Frequently Asked Questions — Kashmir Trip Planning",
    description:
      "Answers to the most common questions about booking a Kashmir tour with Vertex Kashmir Holidays — payments, itineraries, best time to visit, cancellations and more.",
    canonical: `${SITE_URL}/faq`,
  });
}

export default async function FaqPage() {
  const faqs = await prisma.contactFaq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "FAQ", url: `${SITE_URL}/faq` },
  ]);
  const faqJsonLd = faqs.length > 0 ? buildFAQPage(faqs.map((f) => ({ question: f.question, answer: f.answer }))) : null;

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <FaqHero />
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
        <ContactFAQs
          heading={{ kicker: "BEFORE YOU ASK...", title: "Quick Answers" }}
          faqs={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
          ctaLabel={null}
          ctaHref={null}
        />
      </div>
    </div>
  );
}
