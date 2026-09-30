import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface TourCollectionLinkData {
  name: string;
  slug: string;
  packageCount: number;
}

// "Browse Tour Packages" row on /tours — the internal link from the All Tours
// catalogue to each Tour Collection landing page (/kashmir-tour-packages, …).
// The collection name is used verbatim as anchor text, matching that page's H1.
export function TourCollectionLinks({ collections }: { collections: TourCollectionLinkData[] }) {
  if (collections.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1300px] px-3 pt-10 sm:px-6">
      <h2 className="h-display text-[18px] font-bold text-foreground">Browse Tour Packages</h2>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {collections.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${c.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[14px] font-semibold text-foreground shadow-soft transition hover:border-primary hover:text-primary"
            >
              {c.name}
              <span className="text-xs font-medium text-muted-foreground">({c.packageCount})</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
