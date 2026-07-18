// src/components/activities/ActivityRelatedDestinations.tsx
import { imgSrc } from "@/lib/placeholder";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RelatedDestination {
  slug: string;
  name: string;
  tagline: string | null;
  coverImage: string | null;
}

interface ActivityRelatedDestinationsProps {
  destinations: RelatedDestination[];
}

// "Where to Experience This" — reuses the existing Activity ↔ Destination
// relation (ActivityDestination), no new relation added.
export function ActivityRelatedDestinations({ destinations }: ActivityRelatedDestinationsProps) {
  if (destinations.length === 0) return null;

  return (
    <section
      id="where-to-experience"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <h2 className="text-[18px] font-bold">Where to Experience This</h2>
      <div className="mt-4 grid gap-4">
        {destinations.map((d) => (
          <Link
            key={d.slug}
            href={`/destinations/${d.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary hover:shadow-soft"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={imgSrc(d.coverImage)}
                alt={d.name}
                fill
                sizes="64px"
                className="object-cover transition duration-500 group-hover:scale-110"
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-foreground transition group-hover:text-primary">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                {d.name}
              </p>
              {d.tagline && (
                <p className="mt-0.5 truncate text-[14px] text-muted-foreground">{d.tagline}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
