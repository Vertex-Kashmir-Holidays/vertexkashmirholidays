// src/app/(public)/blog/[slug]/page.tsx

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { JsonLd, buildBreadcrumbList, buildBlogPosting } from '@/components/seo/JsonLd';
import { formatINR } from '@/lib/accents';
import { BlogPostBody } from '@/components/blog/BlogPostBody';
import { BlogPostHero } from '@/components/blog/BlogPostHero';
import { BlogPostRelated } from '@/components/blog/BlogPostRelated';
import { BlogPostSidebar } from '@/components/blog/BlogPostSidebar';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

const longDate = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

const shortDate = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Injects ids into the body's <h2> headings and returns the table of contents.
function withHeadingIds(html: string | null): {
  html: string;
  toc: { label: string; href: string }[];
} {
  if (!html) return { html: '', toc: [] };
  const toc: { label: string; href: string }[] = [];
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, _attrs, inner) => {
    const label = String(inner).replace(/<[^>]+>/g, '').trim();
    const id = slugify(label);
    toc.push({ label, href: `#${id}` });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blog.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      metaTitle: true,
      metaDesc: true,
      ogImage: true,
      published: true,
    },
  });

  if (!post || !post.published) {
    return buildMetadata({
      title: 'Article Not Found',
      description: 'The Kashmir travel article you are looking for could not be found.',
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
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.blog.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  const [relatedRaw, tour] = await Promise.all([
    prisma.blog.findMany({
      where: {
        published: true,
        slug: { not: slug },
        ...(post.category ? { category: post.category } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: 4,
    }),
    prisma.tour.findFirst({
      where: { published: true },
      orderBy: [{ bestseller: 'desc' }, { rating: 'desc' }],
      include: { destinations: { include: { destination: { select: { name: true } } } } },
    }),
  ]);

  // Fall back to most-recent posts if the category has fewer than 4 siblings.
  let related = relatedRaw;
  if (related.length < 4) {
    const fillers = await prisma.blog.findMany({
      where: { published: true, slug: { not: slug }, id: { notIn: related.map((r) => r.id) } },
      orderBy: { publishedAt: 'desc' },
      take: 4 - related.length,
    });
    related = [...related, ...fillers];
  }

  const { html, toc } = withHeadingIds(post.body);

  const avatar = post.authorImage ?? 'https://picsum.photos/seed/vk-author/110';

  const fullToc = [...toc, ...(tour ? [{ label: 'Related Tours', href: '#tourCard' }] : [])];

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={buildBlogPosting(post)} />
      <JsonLd data={breadcrumbJsonLd} />

      <BlogPostHero
        category={post.category}
        title={post.title}
        excerpt={post.excerpt}
        image={post.coverImage ?? 'https://picsum.photos/seed/blog-post-hero/1800/640'}
        author={{ name: post.author ?? 'Vertex Kashmir Holidays', role: post.authorRole, avatar }}
        readTime={post.readTime ? `${post.readTime} min read` : null}
        date={longDate(post.publishedAt)}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          ...(post.category
            ? [{ label: post.category, href: `/blog?category=${slugify(post.category)}` }]
            : []),
        ]}
      />

      <main className="mx-auto max-w-[1300px] px-6 py-10">
        <div className="grid items-start gap-9 lg:grid-cols-[1fr_280px]">
          <article className="min-w-0">
            <BlogPostBody html={html} />
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
              name: post.author ?? 'Vertex Kashmir Holidays',
              role: post.authorRole,
              bio: post.authorBio,
              avatar,
            }}
            relatedTour={
              tour
                ? {
                    label: 'Plan this trip with us',
                    image: tour.coverImage,
                    href: `/tours/${tour.slug}`,
                    name: tour.title,
                    duration: `${tour.duration - 1}N / ${tour.duration}D`,
                    price: formatINR(tour.priceFrom),
                    oldPrice: tour.priceWas ? formatINR(tour.priceWas) : undefined,
                    off: tour.discountPct ? `${tour.discountPct}% OFF` : undefined,
                    route: tour.destinations.map((d) => d.destination.name).join(' · '),
                    rating: tour.rating.toFixed(1),
                    reviews: `${tour.reviewCount} reviews`,
                    note: 'Free cancellation up to 30 days',
                  }
                : undefined
            }
          />
        </div>
      </main>
    </div>
  );
}
