import Link from 'next/link';
import type { TourCategory } from '@prisma/client';
import { TOUR_CATEGORY_META } from '@/lib/tours/categories';

// Internal links to the category landing pages, using their exact page-title
// text as anchor text — this is the concrete signal Google's sitelinks
// algorithm reads (anchor text + link structure), not just the pages existing.
export function TourCategoryLinksRow({ categories }: { categories: TourCategory[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-[14px] font-semibold text-muted-foreground">Browse by type:</span>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/tours/category/${TOUR_CATEGORY_META[c].slug}`}
          className="rounded-full border border-border px-3.5 py-1.5 text-[14px] font-semibold transition hover:border-primary hover:bg-muted"
        >
          {TOUR_CATEGORY_META[c].pageTitle}
        </Link>
      ))}
    </div>
  );
}
