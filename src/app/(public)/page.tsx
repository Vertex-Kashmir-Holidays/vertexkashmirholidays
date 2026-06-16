import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  JsonLd,
  buildTravelAgency,
  buildWebSite,
  buildItemList,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { AboutSection } from "@/components/about/AboutSection";
import { BlogSection } from "@/components/blog/BlogSection";
import { DestinationsSection } from "@/components/destinations/DestinationsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { OffersSection } from "@/components/home/OffersSection";
import { PackagesSection } from "@/components/home/PackagesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { UpdatesStrip } from "@/components/home/UpdatesStrip";
import { VideoReviewsSection } from "@/components/home/VideoReviewsSection";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import type { SectionHeading } from "@/types/home";

// ISR: serve cached HTML and refresh in the background (admin edits appear
// within the window). Replaces force-dynamic, which hit the DB every request.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  return buildMetadata({
    // No brand suffix here — the root layout title template appends
    // "| Vertex Kashmir Holidays" automatically.
    title:
      settings?.metaTitle ??
      "Premium Kashmir Tour Packages — Honeymoon, Family & Adventure Holidays",
    description:
      settings?.metaDesc ??
      "Discover Kashmir with Vertex Kashmir Holidays — curated honeymoon, family, adventure and luxury tour packages. Dal Lake houseboats, Gulmarg Gondola and glacier treks, booked online with local experts.",
    canonical: SITE_URL,
    ogImage: settings?.ogImage ?? null,
  });
}

export default async function HomePage() {
  const [
    content,
    sections,
    slides,
    stats,
    tickerItems,
    videos,
    tours,
    whyItems,
    destinations,
    offers,
    testimonials,
    blogs,
    settings,
  ] = await Promise.all([
    prisma.homeContent.findUnique({ where: { id: "singleton" } }),
    prisma.homeSection.findMany(),
    prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.siteStat.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tickerItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.videoReview.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tour.findMany({
      where: { published: true },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      take: 4,
      include: {
        destinations: { include: { destination: { select: { name: true } } } },
      },
    }),
    prisma.whyChooseItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.destination.findMany({
      where: { isFeatured: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
    }),
    prisma.offer.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.blog.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const heading = (key: string): SectionHeading => {
    const s = sections.find((x) => x.key === key);
    return {
      kicker: s?.kicker ?? null,
      title: s?.title ?? null,
      subtitle: s?.subtitle ?? null,
      ctaLabel: s?.ctaLabel ?? null,
      ctaHref: s?.ctaHref ?? null,
    };
  };

  let formAvatars: string[] = [];
  try {
    formAvatars = JSON.parse(content?.formAvatars ?? "[]");
  } catch {
    formAvatars = [];
  }

  // ── Structured data (JSON-LD) ────────────────────────────────────────────
  const sameAs = [
    settings?.facebook,
    settings?.instagram,
    settings?.twitter,
    settings?.youtube,
  ].filter((u): u is string => Boolean(u && u.startsWith("http")));

  const organizationJsonLd = buildTravelAgency({
    telephone: settings?.sitePhone,
    email: settings?.siteEmail,
    streetAddress: settings?.siteAddress,
    sameAs,
  });

  const webSiteJsonLd = buildWebSite();

  const packagesJsonLd = buildItemList(
    tours.map((t) => ({
      name: t.title,
      url: `${SITE_URL}/tours/${t.slug}`,
    })),
    "Featured Kashmir Tour Packages",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={webSiteJsonLd} />
      {tours.length > 0 && <JsonLd data={packagesJsonLd} />}
      <HeroSection
        content={{
          badge: content?.heroBadge ?? null,
          title: content?.heroTitle ?? null,
          subtitle: content?.heroSubtitle ?? null,
          ctaPrimaryLabel: content?.heroCtaPrimaryLabel ?? null,
          ctaPrimaryHref: content?.heroCtaPrimaryHref ?? null,
          ctaSecondaryLabel: content?.heroCtaSecondaryLabel ?? null,
          ctaSecondaryHref: content?.heroCtaSecondaryHref ?? null,
          formKicker: content?.formKicker ?? null,
          formTitle: content?.formTitle ?? null,
          formSubtitle: content?.formSubtitle ?? null,
          formButtonLabel: content?.formButtonLabel ?? null,
          formNote: content?.formNote ?? null,
          formAvatars,
        }}
        slides={slides.map((s) => ({ image: s.image, imageMobile: s.imageMobile, alt: s.alt }))}
        stats={stats
          .filter((s) => s.section === "hero")
          .map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
      />
      <UpdatesStrip items={tickerItems.map((t) => t.text)} />
      <VideoReviewsSection
        heading={heading("videos")}
        videos={videos.map((v) => ({
          id: v.id,
          name: v.name,
          place: v.place,
          duration: v.duration,
          thumbnail: v.thumbnail,
          videoUrl: v.videoUrl,
        }))}
      />
      <PackagesSection
        heading={heading("packages")}
        tours={tours.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          badge: t.badge,
          badgeColor: t.badgeColor,
          durationLabel: `${t.duration - 1}N / ${t.duration}D`,
          places: t.destinations.map((d) => d.destination.name).join(", "),
          image: t.coverImage,
          rating: t.rating,
          reviewCount: t.reviewCount,
          priceFrom: t.priceFrom,
          priceWas: t.priceWas,
        }))}
      />
      <WhyChooseSection
        heading={heading("why")}
        items={whyItems.map((w) => ({
          id: w.id,
          emoji: w.emoji,
          title: w.title,
          description: w.description,
        }))}
      />
      <DestinationsSection
        heading={heading("destinations")}
        destinations={destinations.map((d) => ({
          id: d.id,
          slug: d.slug,
          name: d.name,
          tagline: d.tagline,
          coverImage: d.coverImage,
        }))}
      />
      <AboutSection
        heading={heading("about")}
        content={{
          para1: content?.aboutPara1 ?? null,
          para2: content?.aboutPara2 ?? null,
          image1: content?.aboutImage1 ?? null,
          image2: content?.aboutImage2 ?? null,
          cardEmoji: content?.aboutCardEmoji ?? null,
          cardTitle: content?.aboutCardTitle ?? null,
          cardSubtitle: content?.aboutCardSubtitle ?? null,
          ratingTitle: content?.aboutRatingTitle ?? null,
          ratingSubtitle: content?.aboutRatingSubtitle ?? null,
        }}
        stats={stats
          .filter((s) => s.section === "about")
          .map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
      />
      <OffersSection
        heading={heading("offers")}
        offers={offers.map((o) => ({
          id: o.id,
          badge: o.badge,
          title: o.title,
          description: o.description,
          image: o.image,
          price: o.price,
          oldPrice: o.oldPrice,
          endsText: o.endsText,
          ctaHref: o.ctaHref,
        }))}
      />
      <TestimonialsSection
        heading={heading("testimonials")}
        testimonials={testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          location: t.location,
          avatar: t.avatar,
          quote: t.quote,
          rating: t.rating,
        }))}
      />
      <BlogSection
        heading={heading("blogs")}
        blogs={blogs.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          coverImage: b.coverImage,
          category: b.category,
          readTime: b.readTime,
          dateLabel: b.publishedAt
            ? b.publishedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : null,
        }))}
      />
    </div>
  );
}
