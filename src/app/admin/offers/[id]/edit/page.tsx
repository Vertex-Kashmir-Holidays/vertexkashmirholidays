import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseStringList } from "@/lib/tours/content";
import {
  parseCompareRows,
  parseCompareValues,
  parseOfferHotels,
  parseOfferItinerary,
  parseOfferStays,
  toDateInput,
} from "@/lib/offers/content";
import { OfferForm } from "@/components/admin/offers/OfferForm";
import { getOfferHotelCatalog } from "@/lib/offers/hotelCatalog";

export const metadata: Metadata = { title: "Edit Occasion Offer — Admin" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditOfferPage({ params }: Props) {
  const { id } = await params;
  const [o, tours, destinations, hotelCatalog] = await Promise.all([
    prisma.occasionOffer.findUnique({
      where: { id },
      include: {
        packages: { orderBy: { sortOrder: "asc" } },
        relatedTours: { select: { id: true } },
      },
    }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    getOfferHotelCatalog(),
  ]);
  if (!o) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/offers" className="hover:text-primary transition-colors">
              Occasion Offers
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{o.name}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display font-extrabold text-foreground text-xl">Edit Occasion Offer</h2>
        {o.published && (
          <a
            href={`/offers/${o.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline shrink-0"
          >
            View Live ↗
          </a>
        )}
      </div>
      <OfferForm
        tours={tours}
        destinations={destinations}
        hotelCatalog={hotelCatalog}
        defaults={{
          id: o.id,
          values: {
            name: o.name,
            slug: o.slug,
            occasionType: o.occasionType,
            startDate: toDateInput(o.startDate),
            endDate: toDateInput(o.endDate),
            shortDescription: o.shortDescription ?? "",
            heroTitle: o.heroTitle ?? "",
            heroSubtitle: o.heroSubtitle ?? "",
            heroImage: o.heroImage ?? "",
            heroImageMobile: o.heroImageMobile ?? "",
            ctaLabel: o.ctaLabel ?? "",
            overview: o.overview ?? "",
            whyThisOffer: o.whyThisOffer,
            inclusions: o.inclusions,
            exclusions: o.exclusions,
            gallery: o.gallery,
            activitiesTitle: o.activitiesTitle ?? "",
            activitiesIntro: o.activitiesIntro ?? "",
            activitiesNote: o.activitiesNote ?? "",
            activities: o.activities,
            filmUrl: o.filmUrl ?? "",
            filmPoster: o.filmPoster ?? "",
            faqs: o.faqs,
            metaTitle: o.metaTitle ?? "",
            metaDesc: o.metaDesc ?? "",
            canonicalUrl: o.canonicalUrl ?? "",
            ogTitle: o.ogTitle ?? "",
            ogDesc: o.ogDesc ?? "",
            ogImage: o.ogImage ?? "",
            noindex: o.noindex,
            published: o.published,
            sortOrder: o.sortOrder,
          },
          packages: o.packages.map((p) => ({
            key: p.id,
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            description: p.description ?? "",
            priceForTwo: String(p.priceForTwo),
            originalPriceForTwo: p.originalPriceForTwo != null ? String(p.originalPriceForTwo) : "",
            published: p.published,
            image: p.image ?? "",
            highlights: parseStringList(p.highlights).join("\n"),
            inclusions: parseStringList(p.inclusions).join("\n"),
            stays: parseOfferStays(p.stays),
            hotels: parseOfferHotels(p.hotels),
            compareValues: parseCompareValues(p.compareValues),
            badge: p.badge ?? "",
            mealPlan: p.mealPlan ?? "",
            vehicle: p.vehicle ?? "",
          })),
          itinerary: parseOfferItinerary(o.itinerary),
          compareRows: parseCompareRows(o.compareRows),
          relatedTourIds: o.relatedTours.map((t) => t.id),
        }}
      />
    </div>
  );
}
