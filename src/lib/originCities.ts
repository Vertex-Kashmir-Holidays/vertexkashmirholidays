// Editorial config for the "Kashmir Tour Packages from [City]" SEO landing
// pages (/tours/kashmir-tour-packages-from/[city]). Deliberately holds only
// naming/marketing copy — factual flight/train information lives in
// @/lib/transport/data (single source of truth, see that file's header for
// why) and is looked up by city slug at render time, not duplicated here.
export interface OriginCity {
  slug: string;
  /** Display name used in copy/headings. */
  name: string;
  /** Only set when the common search term differs from the display name
   *  (e.g. Bengaluru/Bangalore) — used once in the intro for clarity. */
  akaName?: string;
  metaDescription: string;
}

export const ORIGIN_CITIES: OriginCity[] = [
  {
    slug: "mumbai",
    name: "Mumbai",
    metaDescription:
      "Kashmir tour packages from Mumbai with flights or train arranged separately. Compare honeymoon, family and group packages, then get a personalised travel quote.",
  },
  {
    slug: "delhi",
    name: "Delhi",
    metaDescription:
      "Kashmir tour packages from Delhi with flights or train arranged separately. Compare honeymoon, family and group packages, then get a personalised travel quote.",
  },
  {
    slug: "bangalore",
    name: "Bengaluru",
    akaName: "Bangalore",
    metaDescription:
      "Kashmir tour packages from Bengaluru (Bangalore) with flights or train arranged separately. Compare honeymoon, family and group packages, then get a personalised travel quote.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    metaDescription:
      "Kashmir tour packages from Hyderabad with flights or train arranged separately. Compare honeymoon, family and group packages, then get a personalised travel quote.",
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    metaDescription:
      "Kashmir tour packages from Kolkata with flights or train arranged separately. Compare honeymoon, family and group packages, then get a personalised travel quote.",
  },
];

export function getOriginCityBySlug(slug: string): OriginCity | undefined {
  return ORIGIN_CITIES.find((c) => c.slug === slug);
}
