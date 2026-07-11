// Server component — renders application/ld+json script tags.

import { safeLdJson } from "@/lib/sanitize";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeLdJson(data) }}
    />
  );
}

// ── Schema builders ───────────────────────────────────────────────────────────

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertexkashmirholidays.com";

export function buildTravelAgency(opts?: {
  telephone?: string | null;
  email?: string | null;
  streetAddress?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${siteUrl}/#organization`,
    name: "Vertex Kashmir Holidays",
    ...(opts?.legalName ? { legalName: opts.legalName } : {}),
    ...(opts?.taxId ? { taxID: opts.taxId } : {}),
    description:
      "Premium Kashmir tourism and booking platform — curated honeymoon, family, adventure and luxury packages.",
    url: siteUrl,
    logo: `${siteUrl}/brand/png/icon/vertex-icon-512.png`,
    image: `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    ...(opts?.email ? { email: opts.email } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: opts?.telephone ?? "+91-94190-00000",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: opts?.streetAddress ?? "Katipora, Tangmarg",
      addressLocality: opts?.addressLocality ?? "Baramulla",
      addressRegion: opts?.addressRegion ?? "Jammu & Kashmir",
      postalCode: opts?.postalCode ?? "193402",
      addressCountry: opts?.addressCountry ?? "IN",
    },
    sameAs: opts?.sameAs ?? [],
  };
}

// Augments the SAME organization entity buildTravelAgency() declares (matching
// @id — JSON-LD graph nodes with an identical @id are merged by Google's
// parser across separate <script> blocks on one page) rather than redeclaring
// the whole entity a second time. The public layout already injects the base
// buildTravelAgency() on every page; only /reviews — the one page where
// reviews are actually visible on-page, a requirement of this markup, not
// just a nicety — adds this supplement.
//
// TravelAgency is a LocalBusiness subtype, one of the types Google's
// structured-data guidelines treat as eligible for aggregateRating/review
// markup (unlike a bare Organization, which their "self-serving reviews"
// policy restricts).
export function buildOrganizationReviews(opts: {
  aggregateRating?: { ratingValue: number; reviewCount: number } | null;
  reviews?: { author: string; rating: number; body: string; datePublished: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@id": `${siteUrl}/#organization`,
    ...(opts.aggregateRating && opts.aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.aggregateRating.ratingValue,
            reviewCount: opts.aggregateRating.reviewCount,
          },
        }
      : {}),
    ...(opts.reviews && opts.reviews.length > 0
      ? {
          review: opts.reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            reviewBody: r.body,
            datePublished: r.datePublished,
          })),
        }
      : {}),
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Vertex Kashmir Holidays",
    url: siteUrl,
    description:
      "Curated Kashmir tour packages — honeymoon, family, adventure and luxury holidays booked online with local experts.",
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-IN",
  };
}

export function buildItemList(
  items: { name: string; url: string }[],
  name?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(name ? { name } : {}),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildTouristTrip(tour: {
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  duration: number;
  priceFrom: number;
  touristType?: string | string[];
  itineraryItems?: { position: number; name: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.description ?? tour.title,
    image: tour.coverImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/tours/${tour.slug}`,
    touristType: tour.touristType ?? "General",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.duration,
      ...(tour.itineraryItems && tour.itineraryItems.length > 0
        ? {
            itemListElement: tour.itineraryItems.map((d) => ({
              "@type": "ListItem",
              position: d.position,
              name: d.name,
            })),
          }
        : {}),
    },
    provider: { "@id": `${siteUrl}/#organization` },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: tour.priceFrom,
      availability: "https://schema.org/InStock",
      seller: { "@id": `${siteUrl}/#organization` },
      url: `${siteUrl}/tours/${tour.slug}`,
    },
  };
}

export function buildProduct(tour: {
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  priceFrom: number;
  rating?: number;
  reviews?: Array<{ name: string; rating: number; body: string; createdAt: Date }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.description ?? tour.title,
    image: tour.coverImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/tours/${tour.slug}`,
    brand: { "@type": "Brand", name: "Vertex Kashmir Holidays" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: tour.priceFrom,
      availability: "https://schema.org/InStock",
      seller: { "@id": `${siteUrl}/#organization` },
      url: `${siteUrl}/tours/${tour.slug}`,
    },
    // aggregateRating count always matches tour.reviews.length — the same
    // array rendered in the visible Reviews section on this page — so the
    // schema can never claim more reviews than are actually shown.
    ...(tour.reviews && tour.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: tour.rating ?? 4.5,
            reviewCount: tour.reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(tour.reviews && tour.reviews.length > 0
      ? {
          review: tour.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: r.name },
            reviewBody: r.body,
            datePublished: r.createdAt.toISOString().split("T")[0],
          })),
        }
      : {}),
  };
}

export function buildCampaignProduct(campaign: {
  name: string;
  slug: string;
  sub?: string | null;
  heroImage?: string | null;
  tiers: Array<{ name: string; price: string; desc: string }>;
  offerDeadline?: string | null;
}) {
  const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

  const offers = campaign.tiers.length > 0
    ? campaign.tiers.map((t) => {
        const price = parsePrice(t.price);
        return {
          "@type": "Offer",
          name: t.name,
          description: t.desc,
          priceCurrency: "INR",
          ...(isNaN(price) ? {} : { price }),
          availability: "https://schema.org/InStock",
          seller: { "@id": `${siteUrl}/#organization` },
          ...(campaign.offerDeadline
            ? { priceValidUntil: campaign.offerDeadline.split("T")[0] }
            : {}),
          url: `${siteUrl}/adventures/${campaign.slug}`,
        };
      })
    : [
        {
          "@type": "Offer",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          seller: { "@id": `${siteUrl}/#organization` },
          ...(campaign.offerDeadline
            ? { priceValidUntil: campaign.offerDeadline.split("T")[0] }
            : {}),
          url: `${siteUrl}/adventures/${campaign.slug}`,
        },
      ];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: campaign.name,
    description: campaign.sub ?? campaign.name,
    image: campaign.heroImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/adventures/${campaign.slug}`,
    brand: { "@type": "Brand", name: "Vertex Kashmir Holidays" },
    offers: offers.length === 1 ? offers[0] : offers,
  };
}

export function buildCampaignEvents(campaign: {
  name: string;
  slug: string;
  heroImage?: string | null;
  batches: Array<{ date: string; seats: number; price: string; status: string }>;
}) {
  return campaign.batches
    .filter((b) => b.date)
    .map((b) => {
      const price = parseInt(b.price.replace(/[^0-9]/g, ""), 10);
      const availability =
        b.status === "sold"
          ? "https://schema.org/SoldOut"
          : b.status === "filling"
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/InStock";
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: campaign.name,
        startDate: b.date,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Kashmir, India",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Srinagar",
            addressRegion: "Jammu & Kashmir",
            addressCountry: "IN",
          },
        },
        image: campaign.heroImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
        url: `${siteUrl}/adventures/${campaign.slug}`,
        organizer: { "@id": `${siteUrl}/#organization` },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          ...(isNaN(price) ? {} : { price }),
          availability,
          url: `${siteUrl}/adventures/${campaign.slug}`,
        },
      };
    });
}

export function buildFAQPage(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbList(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildBlogPosting(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.title,
    image: post.coverImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/blog/${post.slug}`,
    author: {
      "@type": "Person",
      name: post.author ?? "Vertex Kashmir Holidays",
    },
    // References the sitewide Organization node injected once in
    // (public)/layout.tsx, instead of inlining a duplicate Organization object.
    publisher: { "@id": `${siteUrl}/#organization` },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
  };
}

export function buildTouristDestination(dest: {
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const geo =
    dest.latitude != null && dest.longitude != null
      ? { "@type": "GeoCoordinates", latitude: dest.latitude, longitude: dest.longitude }
      : dest.location
      ? { "@type": "GeoCoordinates", description: dest.location }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.description ?? dest.name,
    image: dest.coverImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/destinations/${dest.slug}`,
    touristType: "General",
    ...(geo ? { geo } : {}),
  };
}

export function buildTouristAttraction(activity: {
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  location?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: activity.name,
    description: activity.description ?? activity.name,
    image: activity.coverImage ?? `${siteUrl}/brand/social/vertex-og-1200x630.png`,
    url: `${siteUrl}/activities/${activity.slug}`,
    ...(activity.location
      ? { touristType: "General", geo: { "@type": "GeoCoordinates", description: activity.location } }
      : {}),
    provider: { "@id": `${siteUrl}/#organization` },
  };
}

export function buildImageObjectList(images: string[]) {
  return images.map((url) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: url,
  }));
}
