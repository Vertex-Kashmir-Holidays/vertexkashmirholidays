// Centralized copy for <TrustSection>. One block of E-E-A-T / trust copy per
// page type — replaces the paragraph that used to be hardcoded into the
// shared Footer (identical on every page, which Google was using as the
// sitelink snippet instead of each page's actual meta description).
//
// `text` is a function, not a plain string: for the "detail" types (tour,
// destination, activity, category) it weaves in the specific tour/
// destination/activity/category name when the caller passes one, so e.g. two
// different tour pages don't render byte-identical body text — the same
// class of problem this component was built to fix in the first place, just
// one level down (per-type instead of sitewide). Callers that render exactly
// one page of a type (home, blog listing, the category hub) simply omit
// `name` and get the generic fallback sentence.
export type TrustSectionType = "home" | "tour" | "category" | "destination" | "activity" | "blog";

interface TrustContent {
  heading: string;
  text: (name?: string) => string;
}

export const TRUST_CONTENT: Record<TrustSectionType, TrustContent> = {
  home: {
    heading: "Why Choose Vertex Kashmir Holidays?",
    text: () =>
      "Operated by Vertex Kashmir Tour & Travels, Vertex Kashmir Holidays is a trusted local tour operator offering personalized Kashmir holidays, transparent pricing, experienced local guides, and dedicated travel support from planning to departure.",
  },
  tour: {
    heading: "Book With Local Kashmir Experts",
    text: (name) =>
      name
        ? `${name} is operated by Vertex Kashmir Tour & Travels and managed by local travel experts who understand every destination, hotel, and experience included in this itinerary.`
        : "This Kashmir tour package is operated by Vertex Kashmir Tour & Travels and managed by local travel experts who understand every destination, hotel, and experience included in your itinerary.",
  },
  category: {
    heading: "Handpicked Kashmir Tour Packages",
    text: (name) =>
      name
        ? `Browse our curated ${name}, created by local travel specialists who know every hotel, route, and season firsthand in Kashmir.`
        : "Browse carefully curated Kashmir tour packages created by local travel specialists for honeymoon, family, luxury, adventure, pilgrimage, and seasonal travel experiences.",
  },
  destination: {
    heading: "Explore Kashmir Like A Local",
    text: (name) =>
      `Discover authentic experiences, sightseeing, hotels, and local travel tips for ${name ?? "this destination"} from the experts at Vertex Kashmir Tour & Travels.`,
  },
  activity: {
    heading: "Book Authentic Kashmir Experiences",
    text: (name) =>
      name
        ? `Enjoy ${name} and other verified Kashmir experiences organized by trusted local travel professionals with transparent pricing and reliable support.`
        : "Enjoy verified adventure activities and local experiences organized by trusted Kashmir travel professionals with transparent pricing and reliable support.",
  },
  blog: {
    heading: "Travel Advice From Local Experts",
    text: () =>
      "Read practical travel guides, seasonal tips, itineraries, and destination advice written by the local team at Vertex Kashmir Tour & Travels.",
  },
};
