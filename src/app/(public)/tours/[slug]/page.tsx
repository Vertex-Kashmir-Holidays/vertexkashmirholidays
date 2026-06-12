// src/app/(public)/tours/[slug]/page.tsx
'use client';

import { TourDetailsFAQs } from '@/components/tours/TourDetailsFAQs';
import { TourDetailsGallery } from '@/components/tours/TourDetailsGallery';
import { TourDetailsHero } from '@/components/tours/TourDetailsHero';
import { TourDetailsInclusions } from '@/components/tours/TourDetailsInclusions';
import { TourDetailsItinerary } from '@/components/tours/TourDetailsItinerary';
import { TourDetailsOverview } from '@/components/tours/TourDetailsOverview';
import { TourDetailsReviews } from '@/components/tours/TourDetailsReviews';
import { TourDetailsSidebar } from '@/components/tours/TourDetailsSidebar';
import { TourDetailsTabs } from '@/components/tours/TourDetailsTabs';

export default function TourDetailsPage() {
  const tourData = {
    name: 'Kashmir Honeymoon Escape',
    duration: '6N / 7D',
    badge: 'BESTSELLER',
    rating: 4.9,
    reviews: 652,
    couples: 12000,
    images: [
      'https://picsum.photos/seed/detail-hero/1800/760',
      'https://picsum.photos/seed/th-snow/1800/760',
      'https://picsum.photos/seed/th-lake/1800/760',
      'https://picsum.photos/seed/th-boat/1800/760',
      'https://picsum.photos/seed/th-valley/1800/760',
      'https://picsum.photos/seed/th-house/1800/760',
      'https://picsum.photos/seed/th-shikara/1800/760',
      'https://picsum.photos/seed/th-gondola/1800/760',
    ],
    description: 'Experience the perfect romantic getaway with your loved one in the breathtaking valleys of Kashmir. From the serene Dal Lake to the snow-covered peaks of Gulmarg, every moment of this journey is crafted for love.',
    chips: ['❤️ Romantic Decor', '🛶 Shikara Ride', '🕯️ Candle Light Dinner', '📷 Photographer Included'],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', body: 'Arrive at Srinagar Airport. Our representative will welcome you and transfer to houseboat. Enjoy a romantic shikara ride in Dal Lake during sunset.', image: 'itn-day1' },
      { day: 2, title: 'Srinagar Local Sightseeing', body: 'Visit Mughal Gardens — Nishat, Shalimar and Chashme Shahi — followed by Shankaracharya Temple and old city walks.', image: 'itn-day2' },
      { day: 3, title: 'Gulmarg – The Meadow of Flowers', body: 'Day excursion to Gulmarg. Gondola Phase 1 ride included; optional Phase 2 to Apharwat Peak for snow activities.', image: 'itn-day3' },
      { day: 4, title: 'Pahalgam – The Valley of Shepherds', body: 'Drive through saffron fields to Pahalgam. Visit Betaab Valley and Aru Valley; riverside walk along the Lidder.', image: 'itn-day4' },
      { day: 5, title: 'Sonmarg Excursion', body: 'Full-day trip to Sonmarg, the Meadow of Gold. Optional pony ride to Thajiwas Glacier.', image: 'itn-day5' },
      { day: 6, title: 'Srinagar Leisure Day', body: 'Free day for shopping in Lal Chowk and Polo View Market. Candle light dinner on the houseboat tonight.', image: 'itn-day6' },
      { day: 7, title: 'Departure', body: 'After breakfast, transfer to Srinagar Airport with a box of Kashmiri kahwa and memories for life.', image: 'itn-day7' },
    ],
    inclusions: [
      'Accommodation (5★ Deluxe Hotels / Houseboat)',
      'Daily Breakfast & Dinner',
      'Private Cab for Sightseeing',
      'Shikara Ride in Dal Lake',
      'Gulmarg Gondola Phase 1 Tickets',
      'All Tax & Parking',
      '24x7 On-ground Support',
    ],
    exclusions: [
      'Airfare / Train Tickets',
      'Lunch',
      'Personal Expenses',
      'Adventure Activities',
      'Gondola Phase 2 (Optional)',
      'Anything not mentioned in inclusions',
    ],
    gallery: ['gal-shikara', 'gal-room', 'gal-gondola', 'gal-tulip'],
    reviewData: [
      { seed: 'rv1', name: 'Riya & Arjun', meta: 'May 2024 · Verified Booking', quote: 'The most beautiful trip of our life! Everything was perfectly planned. The houseboat experience and the candle light dinner were truly magical.' },
      { seed: 'rv2', name: 'Sandeep & Nisha', meta: 'Apr 2024 · Verified Booking', quote: 'Gondola tickets were pre-booked so we skipped the queue entirely. Driver Bashir bhai was punctual every single day.' },
      { seed: 'rv3', name: 'Karan & Simran', meta: 'Mar 2024 · Verified Booking', quote: 'They surprised us with flower decor on the houseboat for our anniversary. The photographer add-on was 100% worth it.' },
      { seed: 'rv4', name: 'Aman & Priya', meta: 'Jan 2024 · Verified Booking', quote: 'Snow everywhere in Gulmarg and the team adjusted our plan around the weather without any extra charge.' },
    ],
    faqs: [
      { question: 'Is this package customisable?', answer: 'Yes — every itinerary is handcrafted. Add days, upgrade hotels, or swap activities; your quote updates transparently.' },
      { question: 'What is the advance payment?', answer: 'Just 20% to lock your dates. The balance is payable 7 days before the trip starts, securely via Razorpay.' },
      { question: 'Is Gondola Phase 2 included?', answer: 'Phase 1 is included. Phase 2 to Apharwat Peak is optional and can be added during booking or on the spot.' },
      { question: 'What is the cancellation policy?', answer: 'Free cancellation up to 15 days before departure. Between 7–15 days, the 20% advance is held as credit for 12 months.' },
    ],
    price: 34999,
    oldPrice: 38999,
    tourId: 'kashmir-honeymoon-escape-6n7d',
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'inclusions', label: 'Inclusions' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'faqs', label: 'FAQs' },
  ];

  return (
    <div className="bg-brand-page text-brand-ink">
      <TourDetailsHero
        tourName={tourData.name}
        duration={tourData.duration}
        badge={tourData.badge}
        rating={tourData.rating}
        reviews={tourData.reviews}
        couples={tourData.couples}
        images={tourData.images}
      />

      <main className="mx-auto max-w-[1300px] px-6 py-6">
        {/* Tabs - normal scrolling, no sticky */}
        <TourDetailsTabs sections={tabs} />

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_320px] mt-6">
          <div className="min-w-0">
            <section id="overview">
              <TourDetailsOverview
                description={tourData.description}
                chips={tourData.chips}
              />
            </section>

            <section id="itinerary" className="scroll-mt-16">
              <TourDetailsItinerary itinerary={tourData.itinerary} />
            </section>

            <section id="inclusions" className="scroll-mt-16">
              <TourDetailsInclusions
                inclusions={tourData.inclusions}
                exclusions={tourData.exclusions}
              />
            </section>

            <section id="gallery" className="scroll-mt-16">
              <TourDetailsGallery images={tourData.gallery.map(s => `https://picsum.photos/seed/${s}/420/320`)} />
            </section>

            <section id="reviews" className="scroll-mt-16">
              <TourDetailsReviews
                reviews={tourData.reviewData}
                totalReviews={tourData.reviews}
              />
            </section>

            <section id="faqs" className="scroll-mt-16">
              <TourDetailsFAQs faqs={tourData.faqs} />
            </section>
          </div>

          <TourDetailsSidebar
            price={tourData.price}
            oldPrice={tourData.oldPrice}
            rating={tourData.rating}
            reviews={tourData.reviews}
            tourId={tourData.tourId}
            tourName={tourData.name}
          />
        </div>
      </main>
    </div>
  );
}