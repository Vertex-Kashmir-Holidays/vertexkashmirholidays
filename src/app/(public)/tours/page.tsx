// src/app/(public)/tours/page.tsx
import { prisma } from "@/lib/prisma";
import { ToursHeroSection } from "@/components/tours/ToursHeroSection";
import { ToursNewsletter } from "@/components/tours/ToursNewsletter";
import { ToursPageClient } from "@/components/tours/ToursPageClient";
import { ToursTrustBar } from "@/components/tours/ToursTrustBar";

export const dynamic = "force-dynamic";

export default async function ToursPage() {
  const [section, stats, tours] = await Promise.all([
    prisma.homeSection.findUnique({ where: { key: "toursHero" } }),
    prisma.siteStat.findMany({ where: { section: "hero" }, orderBy: { sortOrder: "asc" } }),
    prisma.tour.findMany({
      where: { published: true },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      include: {
        destinations: { include: { destination: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div className="bg-light-bg text-light-text">
      <ToursHeroSection
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? null,
          subtitle: section?.subtitle ?? null,
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        stats={stats.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
      />
      <ToursPageClient
        tours={tours.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          badge: t.badge,
          badgeColor: t.badgeColor,
          durationLabel: `${t.duration - 1}N / ${t.duration}D`,
          places: t.destinations.map((d) => d.destination.name).join(", "),
          image: t.coverImage,
          rating: t.rating,
          reviewCount: t.reviewCount,
          priceFrom: t.priceFrom,
          priceWas: t.priceWas,
          category: t.category,
          durationDays: t.duration,
        }))}
      />
      <ToursTrustBar />
      <ToursNewsletter />
    </div>
  );
}
