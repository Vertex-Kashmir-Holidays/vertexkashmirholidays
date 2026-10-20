// src/app/(public)/blog/page.tsx

import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBlog, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { BlogPageClient, BlogPageView } from "@/components/blog/BlogPageClient";
import { TransportAssistanceBanner } from "@/components/tours/TransportAssistanceBanner";
import { TrustSection } from "@/components/common/TrustSection";

// 12h safety net — Blog mutations invalidate this page directly (src/lib/cache.ts);
// kept shorter than most CMS pages since new posts should surface reasonably fast.
export const revalidate = 43200;

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getBlogContent = cache(() => prisma.blogContent.findUnique({ where: { id: "singleton" } }));

export async function generateMetadata(): Promise<Metadata> {
  const content = await getBlogContent();
  return buildMetadata({
    title: content?.metaTitle || "Kashmir Travel Blog — Guides, Tips & Itineraries",
    description:
      content?.metaDescription ||
      "Expert Kashmir travel guides from Vertex Kashmir Holidays — best time to visit, Gulmarg & Pahalgam tips, houseboat stays, budgets and sample itineraries.",
    canonical: `${SITE_URL}/blog`,
    ogImage: content?.ogImage ?? content?.heroImage ?? null,
  });
}

const dateLabel = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

export default async function BlogPage() {
  const [content, blogs, categories, counts] = await Promise.all([
    getBlogContent(),
    prisma.blog.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.blogCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.blog.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { _all: true },
    }),
  ]);

  const featuredPost = blogs.find((b) => b.featured) ?? blogs[0] ?? null;

  const trendingPosts = (
    blogs.filter((b) => b.trending).length ? blogs.filter((b) => b.trending) : blogs
  ).slice(0, 4);

  // Articles grid excludes the featured story (shown separately above).
  const articlePosts = blogs.filter((b) => b.id !== featuredPost?.id);

  const countMap = new Map(counts.map((c) => [c.category, c._count._all]));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
  ]);

  const blogContent = {
    heroKicker: content?.heroKicker ?? null,
    heroTitle: content?.heroTitle ?? null,
    heroSubtitle: content?.heroSubtitle ?? null,
    heroImage: content?.heroImage ?? null,
    heroImageMobile: content?.heroImageMobile ?? null,
    heroSearchPlaceholder: content?.heroSearchPlaceholder ?? null,
    aboutTitle: content?.aboutTitle ?? null,
    aboutText: content?.aboutText ?? null,
    aboutCtaLabel: content?.aboutCtaLabel ?? null,
    aboutCtaHref: content?.aboutCtaHref ?? null,
    newsletterTitle: content?.newsletterTitle ?? null,
    newsletterText: content?.newsletterText ?? null,
  };

  const viewProps = {
    content: blogContent,
    featured: featuredPost
      ? {
          slug: featuredPost.slug,
          title: featuredPost.title,
          excerpt: featuredPost.excerpt,
          image: featuredPost.coverImage,
          authorName: featuredPost.author,
          authorImage: featuredPost.authorImage,
          dateLabel: dateLabel(featuredPost.publishedAt),
          readTime: featuredPost.readTime,
        }
      : null,
    articles: articlePosts.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt,
      coverImage: b.coverImage,
      category: b.category,
      dateLabel: dateLabel(b.publishedAt),
      readTime: b.readTime,
    })),
    // Only categories with at least one published post — an empty chip just
    // shows an empty grid.
    chips: categories
      .filter((c) => (countMap.get(c.name) ?? 0) > 0)
      .map((c) => ({ name: c.name, slug: c.slug, icon: c.icon })),
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      count: countMap.get(c.name) ?? 0,
    })),
    trending: trendingPosts.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      image: b.coverImage,
      dateLabel: dateLabel(b.publishedAt),
    })),
  };

  // Every published post, newest first — the same order as the page.
  const blogJsonLd = buildBlog({
    name: content?.heroTitle || "Kashmir Travel Blog",
    posts: blogs,
  });
  const postsJsonLd = buildItemList(
    blogs.map((b) => ({ name: b.title, url: `${SITE_URL}/blog/${b.slug}` })),
    "Kashmir Travel Blog Posts",
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {blogs.length > 0 && <JsonLd data={blogJsonLd} />}
      {blogs.length > 0 && <JsonLd data={postsJsonLd} />}
      {/* BlogPageClient reads ?category= via useSearchParams(), which needs a
        Suspense boundary on a statically-rendered page — everything inside it
        is client-rendered. The fallback is the same view with no category
        filter, so the served HTML has the hero, every post card and their
        links (not just the hero); the interactive version takes over on
        hydration. */}
      <Suspense fallback={<BlogPageView {...viewProps} initialCategory="All" />}>
        <BlogPageClient {...viewProps} />
      </Suspense>
      <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-12">
        <TransportAssistanceBanner placement="travel-stories" />
      </div>
      <TrustSection type="blog" />
    </>
  );
}
