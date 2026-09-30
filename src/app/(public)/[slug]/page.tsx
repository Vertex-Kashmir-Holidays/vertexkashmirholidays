// Shared top-level dynamic route. Serves two kinds of page, disjoint by slug:
//  - the legal/policy pages (fixed LEGAL_SLUGS) — see LegalPageView
//  - Tour Collection landing pages (/kashmir-tour-packages, …) — see
//    TourCollectionView; admin slugs can never be a legal slug or any other
//    top-level route (src/lib/tours/collections.ts), and static route folders
//    always win over this dynamic segment anyway.
// Anything else 404s, identical to having no route.

import type { Metadata } from "next";
import { LEGAL_SLUGS } from "@/lib/legal/content";
import { LegalPageView, legalPageMetadata } from "@/components/legal/LegalPageView";
import { TourCollectionView, tourCollectionMetadata } from "@/components/tours/TourCollectionView";
import { getLiveTourCollections } from "@/lib/tours/collectionQueries";

// 5 minutes, same as /plan-your-kashmir-trip and for the same reason: collection
// pages carry admin PROMO banners whose active window is time-based
// (startsAt/endsAt) and banner edits don't revalidate pages, so a short TTL is
// what makes a new or scheduled banner appear. Tour/collection edits still
// revalidate these pages immediately (src/lib/cache.ts); regenerating the
// small legal pages this often costs one tiny query.
export const revalidate = 300;

// Both slug sets are small — pre-render them all at build time. A collection
// published after a deploy renders on its first request and is cached.
export async function generateStaticParams() {
  const collections = await getLiveTourCollections();
  return [...LEGAL_SLUGS, ...collections.map((c) => c.slug)].map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return LEGAL_SLUGS.includes(slug) ? legalPageMetadata(slug) : tourCollectionMetadata(slug);
}

export default async function TopLevelSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return LEGAL_SLUGS.includes(slug) ? (
    <LegalPageView slug={slug} />
  ) : (
    <TourCollectionView slug={slug} />
  );
}
