import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { OfferCard } from "@/components/offers/OfferCard";
import { getLiveOccasionOffers } from "@/lib/offers/queries";

// /offers — every published Occasion Offer. Offer saves revalidate this page
// (src/lib/cache.ts → invalidateOccasionOffer); the TTL is only a safety net.
export const revalidate = 3600;

const TITLE = "Kashmir Holiday Offers";
const DESCRIPTION =
  "Fixed-date Kashmir trips for the festive and holiday season — choose your dates, pick a package and see the price for 2 adults upfront.";

export async function generateMetadata(): Promise<Metadata> {
  const offers = await getLiveOccasionOffers();
  return buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    canonical: `${SITE_URL}/offers`,
    // An empty hub has nothing to index.
    noindex: offers.length === 0,
  });
}

export default async function OffersHubPage() {
  const offers = await getLiveOccasionOffers();
  const heroImage = offers.find((o) => o.heroImage)?.heroImage ?? null;

  return (
    <div className="bg-background text-foreground">
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", url: SITE_URL },
          { name: "Offers", url: `${SITE_URL}/offers` },
        ])}
      />
      {offers.length > 0 && (
        <JsonLd
          data={buildItemList(
            offers.map((o) => ({ name: o.name, url: `${SITE_URL}/offers/${o.slug}` })),
            TITLE,
          )}
        />
      )}

      <SecondaryHero
        image={heroImage ?? "/hero/gulmarg-lg.webp"}
        imageMobile={heroImage ?? "/hero/gulmarg.webp"}
        alt="Kashmir holiday offers"
      >
        <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>›</span>
          <span className="font-semibold text-white">Offers</span>
        </nav>
        <h1 className="hero-reveal h-display mt-6 text-3xl font-bold text-white sm:text-4xl lg:text-[46px]">
          {TITLE}
        </h1>
        <p className="hero-reveal mt-3 max-w-xl text-[16px] text-white/85">{DESCRIPTION}</p>
      </SecondaryHero>

      <div className="mx-auto max-w-[1300px] px-4 py-14 sm:px-6 sm:py-20">
        {offers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.slug} offer={o} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <p className="text-[18px] font-bold text-foreground">No seasonal offers right now.</p>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Our regular Kashmir packages are available all year.
            </p>
            <Link
              href="/tours"
              className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground"
            >
              Browse tour packages
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
