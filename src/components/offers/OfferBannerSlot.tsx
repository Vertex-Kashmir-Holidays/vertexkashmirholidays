import { PromoBannerCard, type PromoBannerData } from "@/components/public/PromoBanner";

// Admin-managed PROMO banners (Admin → Banners → "Offer pages — …" slots),
// e.g. transport options, rendered with the site's standard PromoBannerCard.
// Nothing renders when no banner targets the slot.
export function OfferBannerSlot({ banners }: { banners: PromoBannerData[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="space-y-6">
      {banners.map((b) => (
        <PromoBannerCard key={b.id} banner={b} />
      ))}
    </div>
  );
}
