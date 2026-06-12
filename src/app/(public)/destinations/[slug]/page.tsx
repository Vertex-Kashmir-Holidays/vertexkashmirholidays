// src/app/(public)/destinations/[slug]/page.tsx
'use client';

import { DestinationDetailGallery } from '@/components/destinations/DestinationDetailGallery';
import { DestinationDetailHero } from '@/components/destinations/DestinationDetailHero';
import { DestinationDetailOverview } from '@/components/destinations/DestinationDetailOverview';
import { DestinationDetailSidebar } from '@/components/destinations/DestinationDetailSidebar';
import { DestinationDetailTabs } from '@/components/destinations/DestinationDetailTabs';
import { DestinationDetailThingsToDo } from '@/components/destinations/DestinationDetailThingsToDo';
import { DestinationDetailTours } from '@/components/destinations/DestinationDetailTours';

export default function DestinationDetailPage() {
  const destinationData = {
    name: 'Gulmarg',
    tagline: 'The Meadow of Flowers',
    description: 'A breathtaking hill station in Jammu & Kashmir, famous for its snow-capped mountains, Asia\'s highest gondola ride, and endless meadows.',
    region: 'KASHMIR VALLEY',
    image: 'https://picsum.photos/seed/gulmarg-hero/1800/820',
    stats: [
      { value: '2,650 m', label: 'Altitude', icon: 'm8 21 4-14 4 14M5 21h14M10 13h4' },
      { value: '18°C', label: 'Avg. Summer', icon: 'M14 4v10.5a4 4 0 1 1-4-4 M14 4a2 2 0 1 1 4 0v6' },
      { value: 'Apr – Oct', label: 'Best Time', icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
      { value: '4.9/5', label: '2,134 reviews', icon: 'm12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z' },
    ],
    description: 'Gulmarg is a picturesque hill station located in the Baramulla district of Jammu & Kashmir. Known for its lush green meadows, pristine landscapes, and world-class skiing, Gulmarg is a paradise for nature lovers and adventure seekers alike.',
    features: [
      { title: 'Gondola Ride', description: "World's highest cable car (Apharwat Peak)", icon: 'M12 3v4 M2 5l20-2 M7 7v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7', color: 'text-sky-600 bg-sky-50' },
      { title: 'Skiing Paradise', description: 'Perfect slopes for beginners & pros', icon: 'm4 20 16-6 M17 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M8 9l4 3-1 5 M12 12l4 1 2-3', color: 'text-blue-600 bg-blue-50' },
      { title: 'Flower Meadows', description: 'Blooming valleys in spring & summer', icon: 'M12 8a3 3 0 1 0-3-3 M12 8a3 3 0 1 1 3-3 M12 8v9 M8 21h8 M7 13c2 0 3 1 3 1m7-1c-2 0-3 1-3 1', color: 'text-emerald-600 bg-emerald-50' },
      { title: 'Scenic Beauty', description: 'Breathtaking views in every season', icon: 'M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4 M12 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', color: 'text-teal-600 bg-emerald-50' },
    ],
    things: [
      { seed: 'g-gondola', title: 'Gondola Ride', description: 'Ride the Gulmarg Gondola to Apharwat Peak (4,200m) for stunning views.' },
      { seed: 'g-ski', title: 'Skiing & Snowboarding', description: 'World-class slopes and ski courses for all experience levels.' },
      { seed: 'g-trek', title: 'Trekking & Hiking', description: 'Explore Alpather Lake, Apharwat Peak & other scenic trails.' },
      { seed: 'g-golf', title: 'Golfing', description: 'One of the highest 18-hole golf courses in the world.' },
      { seed: 'g-horse', title: 'Horse Riding', description: 'Enjoy a peaceful ride through the meadows and pine forests.' },
    ],
    tours : [
      { badge: 'BESTSELLER', bc: 'orange', seed: 'pkg-honeymoon', t: 'Kashmir Honeymoon Escape', d: '6N / 7D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '852', old: '₹39,999', p: '₹34,999' },
      { badge: 'POPULAR', bc: 'blue', seed: 'pkg-family', t: 'Kashmir Family Snow Special', d: '5N / 6D', places: 'Srinagar, Gulmarg, Sonmarg', r: '4.8', n: '624', old: '₹28,999', p: '₹24,999' },
      { badge: 'TRENDING', bc: 'green', seed: 'pkg-trek', t: 'Kashmir Great Lakes Trek', d: '8N / 9D', places: 'Sonamarg, Nichnai, Gadsar, Vishansar', r: '4.9', n: '412', old: '₹24,999', p: '₹21,999' },
      { badge: '10% OFF', bc: 'orange', seed: 'pkg-luxury', t: 'Signature Luxury Kashmir', d: '5N / 6D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '236', old: '₹66,999', p: '₹59,999' },
      { badge: 'NEW', bc: 'green', seed: 'pkg-pahalgam', t: 'Pahalgam Valley Retreat', d: '4N / 5D', places: 'Pahalgam, Aru, Betaab Valley', r: '4.7', n: '189', p: '₹18,999' },
      { badge: 'POPULAR', bc: 'blue', seed: 'pkg-shikara', t: 'Srinagar Shikara Experience', d: '3N / 4D', places: 'Srinagar, Dal Lake, Mughal Gardens', r: '4.6', n: '215', p: '₹15,999' },
      { badge: 'BESTSELLER', bc: 'orange', seed: 'pkg-gulmarg', t: 'Gulmarg Adventure Getaway', d: '4N / 5D', places: 'Gulmarg, Apharwat, Khilanmarg', r: '4.8', n: '328', p: '₹22,999' },
      { badge: 'TRENDING', bc: 'green', seed: 'pkg-sonmarg', t: 'Sonmarg Autumn Special', d: '3N / 4D', places: 'Sonmarg, Thajiwas Glacier', r: '4.6', n: '156', p: '₹16,999' },
    ],
    gallery: [
      'https://picsum.photos/seed/gl-meadow/400/280',
      'https://picsum.photos/seed/gl-gondola/400/280',
      'https://picsum.photos/seed/gl-ski/400/280',
      'https://picsum.photos/seed/gl-sunset/400/280',
      'https://picsum.photos/seed/gl-lake/400/280',
    ],
    quickInfo: [
      { label: 'Location', value: 'Baramulla District, Jammu & Kashmir', icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6' },
      { label: 'Altitude', value: '2,650 m (8,694 ft)', icon: 'm8 21 4-14 4 14M5 21h14M10 13h4' },
      { label: 'Best Time to Visit', value: 'April to October, December to March', icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
      { label: 'Famous For', value: 'Skiing, Gondola Ride, Meadows', icon: 'M3 3h18v18H3zM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-3.8-3.8a2 2 0 0 0-2.8 0L6 20' },
      { label: 'Nearest Airport', value: 'Srinagar (55 km)', icon: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z' },
      { label: 'Ideal For', value: 'Family, Honeymoon, Adventure', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z' },
    ],
    weather: {
      temperature: 18,
      condition: 'Partly Cloudy',
      humidity: 56,
      wind: 12,
      feelsLike: 16,
    },
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 8v4l2.5 2.5' },
    { id: 'things', label: 'Things to Do', icon: 'm13 2-2 9h4l-4 11 1-8H8l5-12Z' },
    { id: 'tours', label: 'Tours', icon: 'M3 11h18l-2 8H5ZM8 11V7a4 4 0 0 1 8 0v4' },
    { id: 'gallery', label: 'Gallery', icon: 'M3 3h18v18H3zM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-3.8-3.8a2 2 0 0 0-2.8 0L6 20' },
  ];

  return (
    <div className="bg-brand-page text-brand-ink">
      <DestinationDetailHero
        name={destinationData.name}
        tagline={destinationData.tagline}
        description={destinationData.description}
        region={destinationData.region}
        image={destinationData.image}
        stats={destinationData.stats}
      />

      <DestinationDetailTabs sections={tabs} />

      <main className="relative z-10 bg-white pb-16">
        <div className="mx-auto max-w-[1300px] px-6 pt-8">
          <div className="grid items-start gap-7 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-7">
              <DestinationDetailOverview
                description={destinationData.description}
                features={destinationData.features}
              />
              <DestinationDetailThingsToDo things={destinationData.things} />
              <DestinationDetailTours tours={destinationData.tours} />
              <DestinationDetailGallery images={destinationData.gallery} />
            </div>

            <DestinationDetailSidebar
              quickInfo={destinationData.quickInfo}
              weather={destinationData.weather}
            />
          </div>
        </div>
      </main>
    </div>
  );
}