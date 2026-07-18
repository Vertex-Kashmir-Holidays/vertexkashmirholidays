// src/app/(public)/blog/[slug]/page.tsx

import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import {
  JsonLd,
  buildBreadcrumbList,
  buildBlogPosting,
  buildFAQPage,
} from "@/components/seo/JsonLd";
import { formatINR } from "@/lib/accents";
import { imgSrc } from "@/lib/placeholder";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { FaqPreviewList } from "@/components/faqs/FaqPreviewList";
import { BlogPostQuickAnswer } from "@/components/blog/BlogPostQuickAnswer";
import { BlogPostHero } from "@/components/blog/BlogPostHero";
import { BlogPostRelated } from "@/components/blog/BlogPostRelated";
import { BlogPostSidebar } from "@/components/blog/BlogPostSidebar";
import { TourDetailsRelatedTours } from "@/components/tours/TourDetailsRelatedTours";
import { parseRelatedTours } from "@/lib/tours/content";

export const revalidate = 1800;

// Without this, Next.js has no known slug list to pre-render and falls back
// to fully dynamic rendering on every request regardless of `revalidate`.
// The catalog is small, so pre-rendering all of them at build time is cheap;
// any post added after a deploy is rendered on its first request and cached
// from then on.
export async function generateStaticParams() {
  const blogs = await prisma.blog.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return blogs.map((b) => ({ slug: b.slug }));
}

const BADGE_COLORS = ["orange", "blue", "green"] as const;

type PageProps = { params: Promise<{ slug: string }> };

const longDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

const shortDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Injects ids into the body's <h2> headings and returns the table of contents.
function withHeadingIds(html: string | null): {
  html: string;
  toc: { label: string; href: string }[];
} {
  if (!html) return { html: "", toc: [] };
  const toc: { label: string; href: string }[] = [];
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, _attrs, inner) => {
    const label = String(inner)
      .replace(/<[^>]+>/g, "")
      .trim();
    const id = slugify(label);
    toc.push({ label, href: `#${id}` });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getBlogPost = cache(async (slug: string) => {
  return prisma.blog.findUnique({
    where: { slug },
    include: {
      relatedFaqs: {
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: { id: true, question: true, shortAnswer: true, slug: true },
      },
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post || !post.published) {
    return buildMetadata({
      title: "Article Not Found",
      description: "The Kashmir travel article you are looking for could not be found.",
      canonical: `${SITE_URL}/blog/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: post.metaTitle ?? post.title,
    description:
      post.metaDesc ??
      post.excerpt ??
      `${post.title} — a Kashmir travel guide by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/blog/${slug}`,
    ogImage: post.ogImage ?? post.coverImage ?? null,
    ogTitle: post.ogTitle ?? null,
    ogDescription: post.ogDescription ?? null,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getBlogPost(slug);
  if (!post || !post.published) notFound();

  const [relatedRaw, tour] = await Promise.all([
    prisma.blog.findMany({
      where: {
        published: true,
        slug: { not: slug },
        ...(post.category ? { category: post.category } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.tour.findFirst({
      where: { published: true },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      include: { destinations: { include: { destination: { select: { name: true } } } } },
    }),
  ]);

  // Fall back to most-recent posts if the category has fewer than 4 siblings.
  let related = relatedRaw;
  if (related.length < 4) {
    const fillers = await prisma.blog.findMany({
      where: { published: true, slug: { not: slug }, id: { notIn: related.map((r) => r.id) } },
      orderBy: { publishedAt: "desc" },
      take: 4 - related.length,
    });
    related = [...related, ...fillers];
  }

  const { html, toc } = withHeadingIds(post.body);

  const faqs = post.relatedFaqs;

  // Curated related-tours (editorial pairings), same convention as Tour.relatedTours.
  const relatedTourEntries = parseRelatedTours(post.relatedTours);
  const relatedTourRows =
    relatedTourEntries.length > 0
      ? await prisma.tour.findMany({
          where: { id: { in: relatedTourEntries.map((r) => r.tourId) }, published: true },
          include: { destinations: { include: { destination: { select: { name: true } } } } },
        })
      : [];
  const relatedTourById = new Map(relatedTourRows.map((t) => [t.id, t]));
  const curatedRelatedTours = relatedTourEntries
    .map((entry) => {
      const t = relatedTourById.get(entry.tourId);
      if (!t) return null;
      return {
        ctaSentence: entry.ctaSentence,
        tour: {
          badge: t.badge ?? "Tour Package",
          bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
            ? (t.badgeColor as (typeof BADGE_COLORS)[number])
            : ("green" as const),
          image: t.coverImage ?? undefined,
          detailHref: `/tours/${t.slug}`,
          bookHref: `/booking?tour=${t.slug}`,
          t: t.title,
          d: `${Math.max(t.duration - 1, 0)}N / ${t.duration}D`,
          places: t.destinations.map((d) => d.destination.name).join(", "),
          r: t.rating.toFixed(1),
          n: String(t.reviewCount),
          old: t.priceWas ? formatINR(t.priceWas) : undefined,
          p: formatINR(t.priceFrom),
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const avatar = imgSrc(post.authorImage);

  const fullToc = [
    ...toc,
    ...(faqs.length > 0 ? [{ label: "FAQs", href: "#faqs" }] : []),
    ...(tour ? [{ label: "Related Tours", href: "#tourCard" }] : []),
  ];

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={buildBlogPosting(post)} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqs.length > 0 && (
        <JsonLd
          data={buildFAQPage(faqs.map((f) => ({ question: f.question, answer: f.shortAnswer })))}
        />
      )}

      <BlogPostHero
        category={post.category}
        title={post.title}
        excerpt={post.excerpt}
        image={imgSrc(post.coverImage)}
        imageMobile={post.coverImageMobile}
        author={{ name: post.author ?? "Vertex Kashmir Holidays", role: post.authorRole, avatar }}
        readTime={post.readTime ? `${post.readTime} min read` : null}
        date={longDate(post.publishedAt)}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          ...(post.category
            ? [{ label: post.category, href: `/blog?category=${slugify(post.category)}` }]
            : []),
        ]}
      />

      <main className="mx-auto max-w-[1300px] px-3 sm:px-6 py-10">
        <div className="grid items-start gap-9 lg:grid-cols-[1fr_280px]">
          <article className="min-w-0">
            <BlogPostQuickAnswer html={post.quickAnswer} />
            <BlogPostBody html={html} />
            {faqs.length > 0 && (
              <section
                id="faqs"
                className="scroll-mt-16 mt-8 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
              >
                <h2 className="text-[18px] font-bold">FAQs</h2>
                <div className="mt-4">
                  <FaqPreviewList faqs={faqs} />
                </div>
              </section>
            )}
            {curatedRelatedTours.length > 0 && (
              <TourDetailsRelatedTours
                relatedTours={curatedRelatedTours}
                tourName={post.title}
                tourSlug={post.slug}
              />
            )}
            <BlogPostRelated
              posts={related.map((b) => ({
                id: b.id,
                slug: b.slug,
                title: b.title,
                excerpt: b.excerpt,
                coverImage: b.coverImage,
                category: b.category,
                dateLabel: shortDate(b.publishedAt),
                readTime: b.readTime,
              }))}
            />
          </article>

          <BlogPostSidebar
            toc={fullToc}
            author={{
              name: post.author ?? "Vertex Kashmir Holidays",
              role: post.authorRole,
              bio: post.authorBio,
              avatar,
              href: post.author ? `/blog/author/${slugify(post.author)}` : undefined,
            }}
            relatedTour={
              tour
                ? {
                    label: "Plan this trip with us",
                    image: tour.coverImage,
                    href: `/tours/${tour.slug}`,
                    name: tour.title,
                    duration: `${tour.duration - 1}N / ${tour.duration}D`,
                    price: formatINR(tour.priceFrom),
                    oldPrice: tour.priceWas ? formatINR(tour.priceWas) : undefined,
                    off: tour.discountPct ? `${tour.discountPct}% OFF` : undefined,
                    route: tour.destinations.map((d) => d.destination.name).join(" · "),
                    rating: tour.rating.toFixed(1),
                    reviews: `${tour.reviewCount} reviews`,
                    note: "Free cancellation up to 30 days",
                  }
                : undefined
            }
          />
        </div>
      </main>
    </div>
  );
}
