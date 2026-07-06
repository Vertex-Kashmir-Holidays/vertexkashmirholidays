// src/components/destinations/DestinationNearby.tsx
'use client';

import { DestinationsGrid, type DestinationCardData } from '@/components/destinations/DestinationsGrid';

interface DestinationNearbyProps {
  destinations: DestinationCardData[];
}

// Thin wrapper — reuses the exact same destination card grid component from
// the /destinations listing page (no new card design). "Load More" self-hides
// once displayed >= length, which is always true for a 3–4 item nearby set.
export function DestinationNearby({ destinations }: DestinationNearbyProps) {
  if (destinations.length === 0) return null;

  return (
    <section id="nearby" className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="text-[17px] font-bold">Nearby Destinations</h2>
      <div className="mt-4 [&>div]:!px-0 [&>div]:!pt-0 [&>div]:!max-w-none">
        <DestinationsGrid destinations={destinations} />
      </div>
    </section>
  );
}
