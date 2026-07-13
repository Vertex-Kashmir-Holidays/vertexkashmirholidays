// Serializable shapes passed from the contact page (server) to its client sections.

export interface ContactHeroData {
  breadcrumb: string | null;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  imageMobile: string | null;
}

export interface ContactHeroFeatureData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface ContactReachCardData {
  type: 'whatsapp' | 'call' | 'email' | 'visit';
  title: string;
  value: string;
  subtitle: string;
  cta: string;
  href: string;
}

export interface ContactSectionHeading {
  kicker: string | null;
  title: string | null;
}

export interface ContactPromiseItemData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface ContactOfficeData {
  id: string;
  name: string;
  address: string;
  hours: string;
}

export interface ContactOfficeContent {
  kicker: string | null;
  title: string | null;
  subtitle: string | null;
  name: string | null;
  address: string | null;
  hours: string | null;
  mapLabel: string | null;
  mapSubLabel: string | null;
  directionsUrl: string | null;
  phone: string | null;
  email: string | null;
  legalName: string | null;
  tourismRegNumber: string | null;
  brandName: string | null;
  /** Google Place ID for the real map embed — falls back to the decorative illustration when absent. */
  placeId: string | null;
}

export interface ContactTestimonialData {
  id: string;
  name: string;
  location: string | null;
  avatar: string | null;
  quote: string;
  rating: number;
}

export interface ContactSocialLink {
  type: 'instagram' | 'facebook' | 'youtube' | 'whatsapp' | 'twitter';
  href: string;
}

export interface ContactSocialContent {
  kicker: string | null;
  title: string | null;
  text: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** Admin-curated "Follow Our Journey" preview grid — 4 fixed slots. */
  images: (string | null)[];
}

export interface ContactFormContent {
  kicker: string | null;
  title: string | null;
  note: string | null;
  whatsappHref: string;
}
