'use client';

import { useMemo, useState } from 'react';
import { DestinationsFilterBar } from '@/components/destinations/DestinationsFilterBar';
import { DestinationsGrid, type DestinationCardData } from '@/components/destinations/DestinationsGrid';

interface DestinationsBrowserProps {
  destinations: DestinationCardData[];
}

// Client-side filter + grid over the DB-fetched destinations. The chip matches
// a destination's region or name; the search matches name or tagline.
export function DestinationsBrowser({ destinations }: DestinationsBrowserProps) {
  const [chip, setChip] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return destinations.filter((d) => {
      const chipMatch =
        chip === 'All' ||
        d.name === chip ||
        d.region === chip ||
        (chip === 'Other States' && d.region !== 'Kashmir Valley' && d.region !== 'Ladakh');
      const searchMatch =
        !q || d.name.toLowerCase().includes(q) || (d.tagline ?? '').toLowerCase().includes(q);
      return chipMatch && searchMatch;
    });
  }, [destinations, chip, search]);

  return (
    <>
      <DestinationsFilterBar
        onFilterChange={(nextChip, nextSearch) => {
          setChip(nextChip);
          setSearch(nextSearch);
        }}
      />
      <DestinationsGrid destinations={filtered} />
    </>
  );
}
