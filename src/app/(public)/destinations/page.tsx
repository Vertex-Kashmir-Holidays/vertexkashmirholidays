// src/app/(public)/destinations/page.tsx
'use client';

import { DestinationsCTABand } from '@/components/destinations/DestinationsCTABand';
import { DestinationsFilterBar } from '@/components/destinations/DestinationsFilterBar';
import { DestinationsGrid } from '@/components/destinations/DestinationsGrid';
import { DestinationsHero } from '@/components/destinations/DestinationsHero';
import { DestinationsThingsToDo } from '@/components/destinations/DestinationsThingsToDo';
import { useState } from 'react';
  const destinationsData = [
    { seed: 'd-gulmarg', tours: 12, n: 'Gulmarg', tag: 'The Meadow of Flowers', d: 'Famous for skiing, gondola rides and stunning meadows.', alt: '2,650m Altitude', season: 'Apr - Mar', g: 'Kashmir Valley' },
    { seed: 'd-pahalgam', tours: 15, n: 'Pahalgam', tag: 'Valley of Shepherds', d: 'Lush green valleys, rivers and breathtaking landscapes.', alt: '2,130m Altitude', season: 'Mar - Nov', g: 'Kashmir Valley' },
    { seed: 'd-srinagar', tours: 18, n: 'Srinagar', tag: 'The Crown of Kashmir', d: 'Beautiful Dal Lake, Mughal gardens and rich heritage.', alt: '1,585m Altitude', season: 'Mar - Dec', g: 'Kashmir Valley' },
    { seed: 'd-sonmarg', tours: 10, n: 'Sonmarg', tag: 'Meadow of Gold', d: 'Gateway to high altitude treks and glaciers.', alt: '2,730m Altitude', season: 'Apr - Oct', g: 'Kashmir Valley' },
    { seed: 'd-doodhpathri', tours: 11, n: 'Doodhpathri', tag: 'Valley of Milk', d: 'Pristine meadows and untouched natural beauty.', alt: '2,690m Altitude', season: 'Apr - Oct', g: 'Kashmir Valley' },
    { seed: 'd-yusmarg', tours: 8, n: 'Yusmarg', tag: 'The Meadow', d: 'Peaceful meadows, perfect for picnics and nature walks.', alt: '2,400m Altitude', season: 'Apr - Oct', g: 'Kashmir Valley' },
    { seed: 'd-aru', tours: 7, n: 'Aru Valley', tag: 'Hidden Gem', d: 'Scenic valley en route to Pahalgam, ideal for nature lovers.', alt: '2,400m Altitude', season: 'Apr - Oct', g: 'Kashmir Valley' },
    { seed: 'd-ladakh', tours: 20, n: 'Ladakh', tag: 'Land of High Passes', d: 'Breathtaking landscapes, monasteries and adventure.', alt: '3,500m+ Altitude', season: 'May - Sep', g: 'Ladakh' },
  ];

export default function DestinationsPage() {
  const [filteredDestinations, setFilteredDestinations] = useState(destinationsData);



  const handleFilterChange = (chip: string, search: string) => {
    const filtered = destinationsData.filter((x) => {
      const chipMatch =
        chip === 'All' ||
        x.n === chip ||
        x.g === chip ||
        (chip === 'Other States' && x.g !== 'Kashmir Valley' && x.g !== 'Ladakh');
      const searchMatch = !search || x.n.toLowerCase().includes(search) || x.tag.toLowerCase().includes(search);
      return chipMatch && searchMatch;
    });
    setFilteredDestinations(filtered);
  };

  return (
    <div className="bg-white text-brand-ink">
      <DestinationsHero />
      <DestinationsFilterBar onFilterChange={handleFilterChange} />
      <DestinationsGrid destinations={filteredDestinations} />
      <DestinationsCTABand />
      <DestinationsThingsToDo />
    </div>
  );
}