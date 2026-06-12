import { prisma } from "@/lib/prisma";
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

export const dynamic = "force-dynamic";

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

  return (
    <div className="bg-dark-bg text-white">
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
        slides={slides.map((s) => ({ image: s.image, alt: s.alt }))}
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
