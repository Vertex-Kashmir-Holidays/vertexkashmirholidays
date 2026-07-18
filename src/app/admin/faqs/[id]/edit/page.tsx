import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FaqForm } from "@/components/admin/faqs/FaqForm";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = { title: "Edit FAQ — Admin" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const PLACEMENT_LABELS: Record<string, { label: string; href: string }> = {
  HOME: { label: "Homepage", href: "/" },
  ABOUT: { label: "About", href: "/about" },
  CONTACT: { label: "Contact", href: "/contact" },
  FAQ: { label: "FAQ Index", href: "/faq" },
  REVIEWS: { label: "Reviews", href: "/reviews" },
};

export default async function EditFaqPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "faqs", "edit"))) redirect("/admin/faqs");

  const [faq, categories, tours, destinations, blogs, campaigns, activities] = await Promise.all([
    prisma.faq.findUnique({
      where: { id },
      include: {
        tours: { select: { id: true, title: true, slug: true } },
        destinations: { select: { id: true, name: true, slug: true } },
        blogs: { select: { id: true, title: true, slug: true } },
        campaigns: { select: { id: true, name: true, slug: true } },
        activities: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.blog.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.activity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!faq) notFound();

  const usedOn = [
    ...faq.placements.map((p) => ({
      label: PLACEMENT_LABELS[p]?.label ?? p,
      // FAQ index links straight to this question via the anchor FaqAccordionPage opens.
      href:
        p === "FAQ"
          ? `${SITE_URL}/faq#${faq.slug}`
          : `${SITE_URL}${PLACEMENT_LABELS[p]?.href ?? "/"}`,
    })),
    ...faq.tours.map((t) => ({ label: `Tour: ${t.title}`, href: `${SITE_URL}/tours/${t.slug}` })),
    ...faq.destinations.map((d) => ({
      label: `Destination: ${d.name}`,
      href: `${SITE_URL}/destinations/${d.slug}`,
    })),
    ...faq.blogs.map((b) => ({ label: `Blog: ${b.title}`, href: `${SITE_URL}/blog/${b.slug}` })),
    ...faq.campaigns.map((c) => ({
      label: `Campaign: ${c.name}`,
      href: `${SITE_URL}/adventures/${c.slug}`,
    })),
    ...faq.activities.map((a) => ({
      label: `Activity: ${a.name}`,
      href: `${SITE_URL}/activities/${a.slug}`,
    })),
  ];

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/faqs" className="hover:text-primary transition-colors">
              FAQs
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[240px]">{faq.question}</li>
        </ol>
      </nav>

      <FaqForm
        defaults={{
          id: faq.id,
          question: faq.question,
          shortAnswer: faq.shortAnswer,
          answer: faq.answer,
          categoryId: faq.categoryId,
          status: faq.status,
          featured: faq.featured,
          placements: faq.placements,
          sortOrder: faq.sortOrder,
          lastReviewedAt: faq.lastReviewedAt?.toISOString() ?? null,
          slug: faq.slug,
          tourIds: faq.tours.map((t) => t.id),
          destinationIds: faq.destinations.map((d) => d.id),
          blogIds: faq.blogs.map((b) => b.id),
          campaignIds: faq.campaigns.map((c) => c.id),
          activityIds: faq.activities.map((a) => a.id),
          usedOn,
        }}
        categoryOptions={categories.map((c) => ({ id: c.id, label: c.name }))}
        tourOptions={tours.map((t) => ({ id: t.id, label: t.title }))}
        destinationOptions={destinations.map((d) => ({ id: d.id, label: d.name }))}
        blogOptions={blogs.map((b) => ({ id: b.id, label: b.title }))}
        campaignOptions={campaigns.map((c) => ({ id: c.id, label: c.name }))}
        activityOptions={activities.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}
