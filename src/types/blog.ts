// Serializable shapes passed from the blog listing page (server) to its client sections.

export interface BlogPageContent {
  heroKicker: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  heroImageMobile: string | null;
  heroSearchPlaceholder: string | null;
  aboutTitle: string | null;
  aboutText: string | null;
  aboutCtaLabel: string | null;
  aboutCtaHref: string | null;
  newsletterTitle: string | null;
  newsletterText: string | null;
}

export interface BlogArticleData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  dateLabel: string | null;
  readTime: number | null;
}

export interface BlogFeaturedData {
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  authorName: string | null;
  authorImage: string | null;
  dateLabel: string | null;
  readTime: number | null;
}

export interface BlogChipData {
  name: string;
  slug: string;
  icon: string;
}

export interface BlogCategoryData {
  name: string;
  slug: string;
  count: number;
}

export interface BlogTrendingData {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  dateLabel: string | null;
}
