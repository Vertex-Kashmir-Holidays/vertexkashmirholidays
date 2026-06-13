// Server component — renders application/ld+json script tags.

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── Schema builders ───────────────────────────────────────────────────────────

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertexkashmirholidays.com";

export function buildTravelAgency(opts?: {
  telephone?: string | null;
  email?: string | null;
  streetAddress?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${siteUrl}/#organization`,
    name: "Vertex Kashmir Holidays",
    description:
      "Premium Kashmir tourism and booking platform — curated honeymoon, family, adventure and luxury packages.",
    url: siteUrl,
    logo: `${siteUrl}/brand/icon.png`,
    image: `${siteUrl}/brand/icon.png`,
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
      streetAddress: opts?.streetAddress ?? "Residency Road",
      addressLocality: "Srinagar",
      addressRegion: "Jammu & Kashmir",
      postalCode: "190001",
      addressCountry: "IN",
    },
    sameAs: opts?.sameAs ?? [],
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.description ?? tour.title,
    image: tour.coverImage ?? `${siteUrl}/brand/icon.png`,
    url: `${siteUrl}/tours/${tour.slug}`,
    touristType: "General",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.duration,
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
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.description ?? tour.title,
    image: tour.coverImage ?? `${siteUrl}/brand/icon.png`,
    url: `${siteUrl}/tours/${tour.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: tour.priceFrom,
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/tours/${tour.slug}`,
    },
    ...(tour.reviewCount && tour.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: tour.rating ?? 4.5,
            reviewCount: tour.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
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
    image: post.coverImage ?? `${siteUrl}/brand/icon.png`,
    url: `${siteUrl}/blog/${post.slug}`,
    author: {
      "@type": "Person",
      name: post.author ?? "Vertex Kashmir Holidays",
    },
    publisher: {
      "@type": "Organization",
      name: "Vertex Kashmir Holidays",
      logo: { "@type": "ImageObject", url: `${siteUrl}/brand/icon.png` },
    },
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.description ?? dest.name,
    image: dest.coverImage ?? `${siteUrl}/brand/icon.png`,
    url: `${siteUrl}/destinations/${dest.slug}`,
    touristType: "General",
    ...(dest.location ? { geo: { "@type": "GeoCoordinates", description: dest.location } } : {}),
  };
}
