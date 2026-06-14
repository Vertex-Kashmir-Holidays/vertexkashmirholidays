import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Complete Your Booking — Vertex Kashmir Holidays",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; date?: string; travellers?: string }>;
}) {
  const { tour: tourSlug, date, travellers } = await searchParams;

  if (!tourSlug) redirect("/tours");

  const [tour, settings] = await Promise.all([
    prisma.tour.findFirst({
      where: { slug: tourSlug, published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        priceFrom: true,
        duration: true,
        coverImage: true,
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!tour) redirect("/tours");

  const initialDate = date ?? "";
  const initialTravellers = parseInt(travellers ?? "2", 10) || 2;
  const whatsappNumber = (settings?.whatsapp ?? settings?.sitePhone ?? "919419000000").replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header strip ─────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-muted pt-20 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="w-3 h-3" />
              </li>
              <li>
                <Link href="/tours" className="hover:text-foreground transition-colors">
                  Tours
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="w-3 h-3" />
              </li>
              <li>
                <Link
                  href={`/tours/${tour.slug}`}
                  className="hover:text-foreground transition-colors truncate max-w-[160px] inline-block"
                >
                  {tour.title}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="w-3 h-3" />
              </li>
              <li className="text-foreground font-medium">Booking</li>
            </ol>
          </nav>

          <h1 className="font-display font-extrabold text-foreground text-3xl sm:text-4xl">
            Complete Your Booking
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Secure checkout · Takes less than 2 minutes
          </p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BookingForm
          tourId={tour.id}
          tourSlug={tour.slug}
          tourTitle={tour.title}
          tourCategory={tour.category}
          priceFrom={tour.priceFrom}
          duration={tour.duration}
          coverImage={tour.coverImage}
          initialDate={initialDate}
          initialTravellers={initialTravellers}
          whatsappNumber={whatsappNumber}
        />
      </div>
    </div>
  );
}
