import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PackageForm } from "@/components/admin/packages/PackageForm";
import {
  parseJson,
  parseItinerary,
  parseStringList,
  parseAccommodation,
  parseBudgetRows,
  parsePersonalExpenses,
  parsePackingList,
  parseImportantNotes,
  parseRelatedTours,
} from "@/lib/tours/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getTour = cache(async (id: string) =>
  prisma.tour.findUnique({ where: { id }, include: { activities: { select: { activityId: true } } } }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tour = await getTour(id);
  return { title: tour ? `Edit: ${tour.title} — Admin` : "Edit Package — Admin" };
}

export default async function EditPackagePage({ params }: Props) {
  const { id } = await params;
  const [tour, activities, otherTours] = await Promise.all([
    getTour(id),
    prisma.activity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tour.findMany({ where: { id: { not: id } }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!tour) notFound();

  const defaults = {
    id: tour.id,
    title: tour.title,
    slug: tour.slug,
    category: tour.category,
    duration: tour.duration,
    excerpt: tour.excerpt ?? "",
    description: tour.description ?? "",
    coverImage: tour.coverImage ?? "",
    coverImageMobile: tour.coverImageMobile ?? "",
    priceFrom: tour.priceFrom,
    priceWas: tour.priceWas,
    discountPct: tour.discountPct,
    bestseller: tour.bestseller,
    published: tour.published,
    formMode: tour.formMode,
    itinerary: parseItinerary(tour.itinerary),
    inclusions: parseStringList(tour.inclusions),
    exclusions: parseStringList(tour.exclusions),
    gallery: parseJson<unknown[]>(tour.gallery, []).map((item) =>
      typeof item === "string" ? { url: item, alt: "" } : (item as { url: string; alt: string })
    ),
    batches: parseJson<{ date: string; seats: number; price: string; status: string }[]>(tour.batches, []),
    metaTitle: tour.metaTitle ?? "",
    metaDesc: tour.metaDesc ?? "",
    ogImage: tour.ogImage ?? "",
    activityIds: tour.activities.map((a) => a.activityId),
    region: tour.region,
    badge: tour.badge ?? "",
    badgeColor: tour.badgeColor ?? "green",
    tagline: tour.tagline ?? "",
    bestTime: tour.bestTime ?? "",
    difficulty: tour.difficulty ?? "",
    startCity: tour.startCity ?? "",
    pickupDrop: tour.pickupDrop ?? "",
    transport: tour.transport ?? "",
    tourType: tour.tourType ?? "",
    happyCount: tour.happyCount,
    highlights: parseStringList(tour.highlights),
    perfectFor: parseStringList(tour.perfectFor),
    notIdealFor: parseStringList(tour.notIdealFor),
    whyItineraryWorks: tour.whyItineraryWorks ?? "",
    accommodation: parseAccommodation(tour.accommodation),
    accommodationImage: tour.accommodationImage ?? "",
    meals: tour.meals ?? "",
    transportDetail: tour.transportDetail ?? "",
    budgetBreakdown: parseBudgetRows(tour.budgetBreakdown),
    personalExpenses: parsePersonalExpenses(tour.personalExpenses),
    bestTimeDetail: tour.bestTimeDetail ?? "",
    thingsToCarry: parsePackingList(tour.thingsToCarry),
    localTravelTips: parseStringList(tour.localTravelTips),
    importantNotes: parseImportantNotes(tour.importantNotes),
    whyVertexBlurb: tour.whyVertexBlurb ?? "",
    ctaHeadline: tour.ctaHeadline ?? "",
    ctaBody: tour.ctaBody ?? "",
    ogTitle: tour.ogTitle ?? "",
    ogDescription: tour.ogDescription ?? "",
    relatedTours: parseRelatedTours(tour.relatedTours),
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/packages" className="hover:text-primary transition-colors">Packages</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium line-clamp-1 max-w-[200px]">{tour.title}</li>
        </ol>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Edit Package</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{tour.title}</p>
        </div>
        <a
          href={`/tours/${tour.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-semibold hover:underline shrink-0"
        >
          View Live ↗
        </a>
      </div>

      <PackageForm
        defaults={defaults}
        activityOptions={activities.map((a) => ({ id: a.id, label: a.name }))}
        relatedTourOptions={otherTours}
      />
    </div>
  );
}
