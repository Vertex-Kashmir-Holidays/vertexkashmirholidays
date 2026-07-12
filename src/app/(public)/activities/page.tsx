import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { ActivitiesPageClient } from "@/components/activities/ActivitiesPageClient";
import Link from "next/link";

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const section = await prisma.homeSection.findUnique({ where: { key: "activitiesHero" } });
  return buildMetadata({
    title: "Things to Do in Kashmir — Activities & Experiences",
    description:
      "Discover the best things to do in Kashmir — shikara rides, Gulmarg gondola, trekking, skiing, river rafting and more. Handpicked activities by Vertex Kashmir Holidays.",
    canonical: `${SITE_URL}/activities`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function ActivitiesPage() {
  const [section, activities] = await Promise.all([
    prisma.homeSection.findUnique({ where: { key: "activitiesHero" } }),
    prisma.activity.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        location: true,
        duration: true,
        price: true,
        coverImage: true,
      },
    }),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Activities", url: `${SITE_URL}/activities` },
  ]);

  const listJsonLd = buildItemList(
    activities.map((a) => ({ name: a.name, url: `${SITE_URL}/activities/${a.slug}` })),
    "Things to Do in Kashmir",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {activities.length > 0 && <JsonLd data={listJsonLd} />}

      <SecondaryHero
        image={section?.heroImage ?? "/hero/gulmarg-lg.webp"}
        imageMobile={section?.heroImageMobile ?? "/hero/gulmarg.webp"}
        alt="Things to do in Kashmir"
        aside={<HeroLeadCard source="activities" buttonLabel="Plan My Activities" />}
      >
        <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <span className="font-semibold text-white">Activities</span>
        </nav>
        <h1 className="mt-6 h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]">
          Things to Do in Kashmir
        </h1>
        <p className="mt-3 max-w-md text-[16px] text-white/85">
          Shikara sunsets, Gulmarg gondola, alpine treks and more — handpicked experiences for your trip.
        </p>
      </SecondaryHero>

      <ActivitiesPageClient
        activities={activities.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          location: a.location,
          duration: a.duration,
          price: a.price,
          image: a.coverImage,
        }))}
      />
    </div>
  );
}
