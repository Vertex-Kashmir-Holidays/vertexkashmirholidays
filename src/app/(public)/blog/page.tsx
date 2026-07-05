// src/app/(public)/blog/page.tsx

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { JsonLd, buildBreadcrumbList } from '@/components/seo/JsonLd';
import { BlogPageClient } from '@/components/blog/BlogPageClient';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const content = await prisma.blogContent.findUnique({ where: { id: 'singleton' } });
  return buildMetadata({
    title: 'Kashmir Travel Blog — Guides, Tips & Itineraries',
    description:
      'Expert Kashmir travel guides from Vertex Kashmir Holidays — best time to visit, Gulmarg & Pahalgam tips, houseboat stays, budgets and sample itineraries.',
    canonical: `${SITE_URL}/blog`,
    ogImage: content?.ogImage ?? content?.heroImage ?? null,
  });
}

const dateLabel = (d: Date | null) =>
  d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

type PageProps = { searchParams: Promise<{ category?: string }> };

export default async function BlogPage({ searchParams }: PageProps) {
  const { category: categorySlug } = await searchParams;
  const [content, blogs, categories, counts] = await Promise.all([
    prisma.blogContent.findUnique({ where: { id: 'singleton' } }),
    prisma.blog.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.blogCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.blog.groupBy({
      by: ['category'],
      where: { published: true },
      _count: { _all: true },
    }),
  ]);

  const featuredPost = blogs.find((b) => b.featured) ?? blogs[0] ?? null;

  const trendingPosts = (blogs.filter((b) => b.trending).length
    ? blogs.filter((b) => b.trending)
    : blogs
  ).slice(0, 4);

  // Articles grid excludes the featured story (shown separately above).
  const articlePosts = blogs.filter((b) => b.id !== featuredPost?.id);

  const countMap = new Map(counts.map((c) => [c.category, c._count._all]));

  // Resolve the ?category=<slug> query param (used by category "View" links
  // and blog-post breadcrumbs) to the display name BlogPageClient filters by.
  const initialCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name ?? 'All'
    : 'All';

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
  ]);

  return (
    <>
    <JsonLd data={breadcrumbJsonLd} />
    <BlogPageClient
      initialCategory={initialCategory}
      content={{
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
      }}
      featured={
        featuredPost
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
          : null
      }
      articles={articlePosts.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        coverImage: b.coverImage,
        category: b.category,
        dateLabel: dateLabel(b.publishedAt),
        readTime: b.readTime,
      }))}
      chips={categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon }))}
      categories={categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        count: countMap.get(c.name) ?? 0,
      }))}
      trending={trendingPosts.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        image: b.coverImage,
        dateLabel: dateLabel(b.publishedAt),
      }))}
    />
    </>
  );
}
