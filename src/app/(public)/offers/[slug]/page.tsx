import type { Metadata } from "next";
import { OccasionOfferView, occasionOfferMetadata } from "@/components/offers/OfferView";
import { getLiveOccasionOffers } from "@/lib/offers/queries";

// Occasion Offer pages (/offers/diwali-kashmir-tour-package-2026, …). Offer
// saves revalidate this page immediately (src/lib/cache.ts → invalidateOccasionOffer);
// the TTL only refreshes the reviews/stats blocks, which come from elsewhere.
export const revalidate = 3600;

// Few offers at a time — pre-render every published one. An offer published
// after a deploy renders on its first request and is cached.
export async function generateStaticParams() {
  const offers = await getLiveOccasionOffers();
  return offers.map((o) => ({ slug: o.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return occasionOfferMetadata(slug);
}

export default async function OccasionOfferPage({ params }: PageProps) {
  const { slug } = await params;
  return <OccasionOfferView slug={slug} />;
}
