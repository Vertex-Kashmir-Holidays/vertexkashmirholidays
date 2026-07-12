// src/app/(public)/blog/author/[slug]/page.tsx

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { JsonLd, buildBreadcrumbList } from '@/components/seo/JsonLd';
import { imgSrc } from '@/lib/placeholder';
import { BlogArticlesGrid } from '@/components/blog/BlogArticlesGrid';
import type { BlogArticleData } from '@/types/blog';

export const revalidate = 1800;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Without this, Next.js has no known slug list to pre-render and falls back
// to fully dynamic rendering on every request regardless of `revalidate`.
export async function generateStaticParams() {
  const rows = await prisma.blog.findMany({
    where: { published: true, author: { not: null } },
    select: { author: true },
    distinct: ['author'],
  });
  const slugs = new Set<string>();
  for (const r of rows) if (r.author) slugs.add(slugify(r.author));
  return [...slugs].map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

const shortDate = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

// Authors are a free-text field on Blog (no dedicated Author model), so the
// archive route matches on the slugified name rather than a stored slug.
// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const findAuthorName = cache(async (slug: string): Promise<string | null> => {
  const rows = await prisma.blog.findMany({
    where: { published: true, author: { not: null } },
    select: { author: true },
    distinct: ['author'],
  });
  const match = rows.find((r) => r.author && slugify(r.author) === slug);
  return match?.author ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await findAuthorName(slug);
  if (!author) {
    return buildMetadata({
      title: 'Author Not Found',
      description: 'This author page could not be found.',
      canonical: `${SITE_URL}/blog/author/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: `Articles by ${author}`,
    description: `Kashmir travel guides and articles written by ${author}.`,
    canonical: `${SITE_URL}/blog/author/${slug}`,
  });
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await findAuthorName(slug);
  if (!author) notFound();

  const posts = await prisma.blog.findMany({
    where: { published: true, author },
    orderBy: { publishedAt: 'desc' },
  });
  if (posts.length === 0) notFound();

  const first = posts[0];
  const avatar = imgSrc(first.authorImage);

  const articles: BlogArticleData[] = posts.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    coverImage: b.coverImage,
    category: b.category,
    dateLabel: shortDate(b.publishedAt),
    readTime: b.readTime,
  }));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
    { name: author, url: `${SITE_URL}/blog/author/${slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />

      <section className="mx-auto max-w-[1300px] px-6 pb-6 pt-28">
        <nav className="flex items-center gap-2 text-[14px] text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-primary">Home</Link>
          <span>›</span>
          <Link href="/blog" className="transition hover:text-primary">Blog</Link>
          <span>›</span>
          <span className="font-semibold text-foreground">{author}</span>
        </nav>

        <div className="mt-6 flex items-center gap-4">
          <Image
            src={avatar}
            alt={author}
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 rounded-full object-cover"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{author}</h1>
            {first.authorRole && <p className="text-[14px] font-semibold text-primary">{first.authorRole}</p>}
            {first.authorBio && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{first.authorBio}</p>}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1300px] px-6 pb-16">
        <BlogArticlesGrid articles={articles} />
      </main>
    </div>
  );
}
