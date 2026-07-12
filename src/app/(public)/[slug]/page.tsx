// Public legal/policy pages (Terms, Privacy, Refund & Cancellation).
// A single dynamic route scoped to the known legal slugs — any other path
// falls through to a 404, identical to having no route.

import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/JsonLd";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { LEGAL_PAGES, LEGAL_SLUGS, getLegalDefault } from "@/lib/legal/content";

export const revalidate = 3600;

// Small, fixed, known slug set — pre-render all of them at build time instead
// of generating each on-demand on its first post-deploy hit.
export async function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getLegalPage = cache(async (slug: string) =>
  prisma.legalPage.findUnique({ where: { slug } }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const def = getLegalDefault(slug);
  if (!def) return buildMetadata({ title: "Not Found", description: "", noindex: true });

  const record = await getLegalPage(slug);
  return buildMetadata({
    title: `${record?.title ?? def.title} | Vertex Kashmir Holidays`,
    description: def.description,
    canonical: `${SITE_URL}/${slug}`,
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  if (!LEGAL_SLUGS.includes(slug)) notFound();

  const def = getLegalDefault(slug)!;
  const record = await getLegalPage(slug);

  const title = record?.title ?? def.title;
  const html = record?.content ?? def.content;
  const updated = record?.updatedAt ?? new Date();
  // Admin-set banner from the gallery, falling back to the shipped default.
  const heroImage = record?.heroImage ?? def.heroImage;
  const heroImageMobile = record?.heroImageMobile ?? def.heroImageMobile;

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: title, url: `${SITE_URL}/${slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />

      {/* Unified image-banner hero (admin-replaceable from the gallery). */}
      <SecondaryHero image={heroImage} imageMobile={heroImageMobile} alt={title}>
        <nav className="flex flex-wrap items-center gap-1.5 text-[14px] text-white/85" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <span className="font-semibold text-white">{title}</span>
        </nav>
        <h1 className="h-display mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-[44px]">{title}</h1>
        <p className="mt-3 text-sm text-white/80">
          Last updated: {longDate(updated)}
        </p>
      </SecondaryHero>

      <main className="mx-auto max-w-[1100px] px-6 py-10 sm:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_240px]">
          <article className="min-w-0 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
            <BlogPostBody html={html} />
          </article>

          {/* Sidebar: jump between policies */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Legal &amp; Policies</p>
              <ul className="mt-3 space-y-1.5">
                {LEGAL_PAGES.map((p) => {
                  const active = p.slug === slug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        className={
                          active
                            ? "block rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                            : "block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        }
                      >
                        {p.navLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 border-t border-border pt-4">
                <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">
                  Questions? Contact us →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
