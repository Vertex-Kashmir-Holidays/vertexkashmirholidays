// Serializable shapes passed from the adventure page (server) to its client sections.

// Lightweight shape used by the public adventure listing grid (server → client).
export interface AdventureListItemData {
  id: string;
  slug: string;
  name: string;
  sub: string | null;
  badge: string | null;
  image: string | null;
  priceFrom: number | null;
  priceWas: number | null;
  offerText: string | null;
  facts: string[];
}

export interface AdventureHighlight {
  image: string;
  emoji: string;
  title: string;
  description: string;
}

export interface AdventureActivity {
  image: string;
  title: string;
}

export interface AdventureItineraryItem {
  title: string;
  description: string;
  image: string;
}

export interface AdventureTier {
  name: string;
  price: string;
  old?: string;
  tag?: string;
  desc: string;
  feats: string[];
  // Optional second price for the same tier (e.g. 3-sharing / 2-sharing) —
  // when price2 is set the card shows two labelled price rows.
  priceLabel?: string;
  price2?: string;
  old2?: string;
  price2Label?: string;
}

export interface AdventureBatch {
  date: string;
  seats: number;
  price: string;
  status: "filling" | "open" | "sold";
}

export interface AdventureTestimonial {
  image: string;
  name: string;
  location: string;
  quote: string;
}

export interface AdventureFaq {
  id: string;
  question: string;
  shortAnswer: string;
  slug: string;
  hasFullAnswer?: boolean;
}

// Fully-parsed adventure passed to the client page wrapper.
export interface AdventureData {
  slug: string;
  accent: string;
  accent2: string;
  particles: "snow" | "embers";
  name: string;
  badge: string | null;
  titleHtml: string | null;
  sub: string | null;
  heroImage: string | null;
  heroImageMobile: string | null;
  finalImage: string | null;
  facts: string[];
  heroCta: string | null;
  proofCount: string | null;
  formCta: string | null;
  pricingKicker: string | null;
  pricingTitle: string | null;
  paymentNote: string | null;
  offerText: string | null;
  offerDeadline: string | null;
  offerSeats: string | null;
  navCta: string | null;
  phone: string | null;
  whatsappHref: string | null;
  strip: string[];
  stats: Array<[string, string, string]>;
  filmTitle: string | null;
  filmDuration: string | null;
  filmPoster: string | null;
  filmSrc: string | null;
  highlightsTitle: string | null;
  highlights: AdventureHighlight[];
  activitiesTitle: string | null;
  activities: AdventureActivity[];
  itineraryTitle: string | null;
  itinerary: AdventureItineraryItem[];
  tiers: AdventureTier[];
  batches: AdventureBatch[];
  inclusions: string[];
  exclusions: string[];
  galleryTitle: string | null;
  gallery: string[];
  testimonials: AdventureTestimonial[];
  faqsTitle: string | null;
  faqs: AdventureFaq[];
  finalTitle: string | null;
  finalSub: string | null;
  finalCta: string | null;
  finalNote: string | null;
}
