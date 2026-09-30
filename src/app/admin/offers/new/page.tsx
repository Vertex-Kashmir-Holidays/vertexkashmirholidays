import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OfferForm } from "@/components/admin/offers/OfferForm";
import { getOfferHotelCatalog } from "@/lib/offers/hotelCatalog";

export const metadata: Metadata = { title: "New Occasion Offer — Admin" };
// Reads the tour + destination lists for the pickers.
export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const [tours, destinations, hotelCatalog] = await Promise.all([
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    getOfferHotelCatalog(),
  ]);

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
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <h2 className="font-display font-extrabold text-foreground text-xl">Add Occasion Offer</h2>
      <OfferForm tours={tours} destinations={destinations} hotelCatalog={hotelCatalog} />
    </div>
  );
}
