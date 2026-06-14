// Serializable shapes passed from the campaign page (server) to its client sections.

export interface CampaignHighlight {
  image: string;
  emoji: string;
  title: string;
  description: string;
}

export interface CampaignActivity {
  image: string;
  title: string;
}

export interface CampaignItineraryItem {
  title: string;
  description: string;
  image: string;
}

export interface CampaignTier {
  name: string;
  price: string;
  old?: string;
  tag?: string;
  desc: string;
  feats: string[];
}

export interface CampaignBatch {
  date: string;
  seats: number;
  price: string;
  status: 'filling' | 'open' | 'sold';
}

export interface CampaignTestimonial {
  image: string;
  name: string;
  location: string;
  quote: string;
}

export interface CampaignFaq {
  question: string;
  answer: string;
}

// Fully-parsed campaign passed to the client page wrapper.
export interface CampaignData {
  slug: string;
  accent: string;
  accent2: string;
  particles: 'snow' | 'embers';
  name: string;
  badge: string | null;
  titleHtml: string | null;
  sub: string | null;
  heroImage: string | null;
  finalImage: string | null;
  facts: string[];
  heroCta: string | null;
  proofCount: string | null;
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
  highlights: CampaignHighlight[];
  activitiesTitle: string | null;
  activities: CampaignActivity[];
  itineraryTitle: string | null;
  itinerary: CampaignItineraryItem[];
  tiers: CampaignTier[];
  batches: CampaignBatch[];
  inclusions: string[];
  exclusions: string[];
  galleryTitle: string | null;
  gallery: string[];
  testimonials: CampaignTestimonial[];
  faqsTitle: string | null;
  faqs: CampaignFaq[];
  finalTitle: string | null;
  finalSub: string | null;
  finalCta: string | null;
  finalNote: string | null;
}
