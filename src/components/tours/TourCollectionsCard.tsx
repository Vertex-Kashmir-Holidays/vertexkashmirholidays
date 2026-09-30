import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TourCollectionLinkData } from "@/components/tours/TourCollectionLinks";

// Sidebar card on /tours linking to each live Tour Collection with its tour
// count — same card chrome as the sidebar's "Browse by Type" card.
export function TourCollectionsCard({ collections }: { collections: TourCollectionLinkData[] }) {
  if (collections.length === 0) return null;
  return (
    <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-[16px] font-bold">Tour Packages</p>
      <ul className="mt-3 space-y-1 text-[14px]">
        {collections.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${c.slug}`}
              className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 font-semibold text-foreground/85 transition hover:bg-muted hover:text-primary"
            >
              <span>
                {c.name}
                <span className="ml-1.5 text-[12px] font-medium text-muted-foreground">
                  ({c.packageCount})
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                strokeWidth={2.2}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
