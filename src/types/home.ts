// Serializable shapes passed from the home page (server) to its client sections.

export interface SectionHeading {
  kicker: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export interface HeroSlideData {
  image: string;
  alt: string | null;
}

export interface SiteStatData {
  label: string;
  value: string;
  suffix: string | null;
}

export interface HeroContentData {
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryLabel: string | null;
  ctaSecondaryHref: string | null;
  formKicker: string | null;
  formTitle: string | null;
  formSubtitle: string | null;
  formButtonLabel: string | null;
  formNote: string | null;
  formAvatars: string[];
}

export interface AboutContentData {
  para1: string | null;
  para2: string | null;
  image1: string | null;
  image2: string | null;
  cardEmoji: string | null;
  cardTitle: string | null;
  cardSubtitle: string | null;
  ratingTitle: string | null;
  ratingSubtitle: string | null;
}

export interface VideoReviewData {
  id: string;
  name: string;
  place: string | null;
  duration: string | null;
  thumbnail: string;
  videoUrl: string | null;
}

export interface HomeTourData {
  id: string;
  slug: string;
  title: string;
  badge: string | null;
  badgeColor: string | null;
  durationLabel: string;
  places: string;
  image: string | null;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  priceWas: number | null;
}

export interface WhyChooseItemData {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export interface DestinationCardData {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  coverImage: string | null;
}

export interface OfferData {
  id: string;
  badge: string | null;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  oldPrice: number | null;
  endsText: string | null;
  ctaHref: string | null;
}

export interface TestimonialData {
  id: string;
  name: string;
  location: string | null;
  avatar: string | null;
  quote: string;
  rating: number;
}

export interface BlogCardData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  readTime: number | null;
  dateLabel: string | null;
}
