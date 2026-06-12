// src/app/(public)/blog/[slug]/page.tsx
'use client';

import { BlogPostHero } from '@/components/blog/BlogPostHero';
import { BlogPostHighlights } from '@/components/blog/BlogPostHighlights';
import { BlogPostIntro } from '@/components/blog/BlogPostIntro';
import { BlogPostOverview } from '@/components/blog/BlogPostOverview';
import { BlogPostProseBlocks } from '@/components/blog/BlogPostProseBlocks';
import { BlogPostRelated } from '@/components/blog/BlogPostRelated';
import { BlogPostSections } from '@/components/blog/BlogPostSections';
import { BlogPostSidebar } from '@/components/blog/BlogPostSidebar';

export default function BlogPostPage() {
  const post = {
    meta: {
      category: 'ITINERARIES',
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'Itineraries', href: '/blog?category=itineraries' },
      ],
      title: 'The Perfect 7-Day Kashmir Itinerary for First-Timers (2026)',
      excerpt: 'From Dal Lake sunrise to Gulmarg gondola — a tested, local-approved plan that covers the best of Kashmir without the rush.',
      heroSeed: 'post-hero',
      author: {
        name: 'Aamir Lone',
        role: 'Local Travel Expert, Srinagar',
        seed: 'author-aamir',
        bio: 'Born and raised in Kashmir. 15+ years of curating unforgettable travel experiences for 12,000+ happy travelers.',
      },
      readTime: '12 min read',
      date: 'June 12, 2026',
    },
    intro: [
      "Kashmir is not just a destination — it's an emotion. But if you're visiting for the first time, planning the perfect week can feel overwhelming. Where should you go? How many days are enough? What's the right order?",
      "After curating 500+ trips over the last 15 years, this is the exact 7-day Kashmir itinerary we recommend to our family and friends. It's balanced, not too hectic, and covers the best experiences in the right order.",
    ],
    overview: {
      title: 'Quick Overview',
      facts: ['7 Days / 6 Nights', '4 Destinations', 'Private Cab', 'All Sightseeing'],
      bestFor: 'First-timers, Families, Couples',
    },
    sections: {
      id: 'itinerary',
      title: 'Day-by-Day Itinerary',
      numberPrefix: 'DAY',
      items: [
        { title: 'Arrival in Srinagar', tag: 'Srinagar', image: 'd1-shikara',
          body: 'Arrive at Srinagar Airport. Our driver will pick you up and transfer to your houseboat on Dal Lake. Evening shikara ride at sunset.' },
        { title: 'Srinagar Local Sightseeing', tag: 'Srinagar', image: 'd2-gardens',
          body: 'Visit Mughal Gardens (Nishat, Shalimar), Hazratbal Shrine, and local market. Evening free for leisure.' },
        { title: 'Srinagar to Gulmarg', tag: 'Gulmarg', image: 'd3-gondola',
          body: 'Scenic 2-hour drive to Gulmarg. Ride the world-famous Gondola (Phase 1 & 2) and enjoy the snow-capped views.' },
        { title: 'Gulmarg to Pahalgam', tag: 'Pahalgam', image: 'd4-valley',
          body: 'Drive via Tangmarg and Pampore (saffron fields). Reach Pahalgam and explore Betaab Valley.' },
        { title: 'Pahalgam Local', tag: 'Pahalgam', image: 'd5-aru',
          body: 'Visit Aru Valley, Chandanwari, and Baisaran Valley. Pony ride or trek (optional).' },
        { title: 'Pahalgam to Sonmarg', tag: 'Sonmarg', image: 'd6-glacier',
          body: 'Drive to Sonmarg, the "Meadow of Gold". Enjoy Thajiwas Glacier and scenic walks.' },
        { title: 'Sonmarg to Srinagar – Departure', tag: 'Srinagar', image: 'd7-airport',
          body: 'Drive back to Srinagar. Drop at airport with unforgettable memories.' },
      ],
    },
    highlights: {
      id: 'included',
      title: "What's Included in Most Packages",
      items: [
        { label: 'Private Cab with Driver', icon: 'M5 17h14l1-5-2-5H6L4 12ZM7.5 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
        { label: 'Accommodation (3★ / 4★ Hotels)', icon: 'm3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 21V12h6v9' },
        { label: 'Breakfast & Dinner', icon: 'M4 19h16M5 19a7 7 0 0 1 14 0M12 12V9' },
        { label: 'All Sightseeing', icon: 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6' },
        { label: 'Permits & Taxes', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M9 13l2 2 4-4' },
        { label: '24x7 On-ground Support', icon: 'M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12v5a2 2 0 0 0 2 2h3v-6H3' },
      ],
    },
    proseBlocks: [
      {
        id: 'best-time',
        title: 'Best Time to Visit',
        type: 'text',
        content: 'April to June is ideal for first-timers — meadows in full bloom, pleasant 15–25°C days, and every road open. December to February is for snow lovers; expect Gulmarg at its white best but pack serious layers.',
      },
      {
        id: 'budget',
        title: 'Budget Breakdown',
        type: 'table',
        rows: [
          ['Stay (6 nights, 3★/houseboat)', '₹14,000 – ₹20,000'],
          ['Private cab (7 days)', '₹12,000 – ₹15,000'],
          ['Gondola, shikara & entries', '₹4,000 – ₹6,000'],
          ['Food & extras', '₹5,000 – ₹8,000'],
          ['Typical total (per couple)', '₹35,000 – ₹49,000'],
        ],
      },
      {
        id: 'tips',
        title: 'Travel Tips',
        type: 'list',
        items: [
          'Book Gondola Phase 2 tickets online a week ahead — counters sell out by 10 AM.',
          'Carry cash; cards work in Srinagar but rarely beyond.',
          'Keep Day 7 light — Srinagar airport security takes longer than most.',
          'Ask your houseboat host for kahwa at sunset. Trust us.',
        ],
      },
      {
        id: 'faqs',
        title: 'FAQs',
        type: 'faq',
        items: [
          ['Is 7 days enough for Kashmir?', 'Yes — this route covers the four headline destinations at a relaxed pace. Add 2–3 days only if you want Doodhpathri or an offbeat valley.'],
          ['Can this itinerary be customised?', 'Completely. Swap Sonmarg for Doodhpathri, add houseboat nights, or upgrade hotels — every trip we run is built to order.'],
          ['Do I need permits as an Indian tourist?', 'No permits are needed for any destination in this plan. Foreign nationals need none either for these areas.'],
        ],
      },
    ],
    relatedTour: {
      label: 'Plan this trip with us',
      seed: 'tour-honeymoon',
      name: 'Kashmir Honeymoon Escape',
      duration: '6N / 7D',
      price: '₹34,999',
      oldPrice: '₹39,999',
      off: '12% OFF',
      route: 'Srinagar · Gulmarg · Pahalgam · Sonmarg',
      rating: '4.9',
      reviews: '38 reviews',
      note: 'Free cancellation up to 30 days',
    },
    related: [
      { seed: 'rel-pack', category: 'TRAVEL TIPS', color: 'bg-sky-600', title: 'What to Pack for a Kashmir Winter Trip', date: 'June 8, 2026', readTime: '6 min read' },
      { seed: 'rel-5day', category: 'ITINERARIES', color: 'bg-brand-bright', title: '5-Day Kashmir Trip: The Perfect Short Itinerary', date: 'May 29, 2026', readTime: '7 min read' },
      { seed: 'rel-wazwan', category: 'FOOD & CULTURE', color: 'bg-amber-600', title: "Wazwan: A First-Timer's Guide to Kashmir's Royal Feast", date: 'May 22, 2026', readTime: '8 min read' },
      { seed: 'rel-compare', category: 'DESTINATIONS', color: 'bg-teal-600', title: 'Pahalgam vs Gulmarg: Which is Better for You?', date: 'May 15, 2026', readTime: '9 min read' },
    ],
  };

  const toc = [
    { label: post.sections.title, href: `#${post.sections.id}` },
    { label: post.highlights.title, href: `#${post.highlights.id}` },
    ...post.proseBlocks.map((b) => ({ label: b.title, href: `#${b.id}` })),
    { label: 'Related Tours', href: '#tourCard' },
  ];

  return (
    <div className="bg-white text-brand-ink">
      <BlogPostHero
        category={post.meta.category}
        title={post.meta.title}
        excerpt={post.meta.excerpt}
        image={`https://picsum.photos/seed/${post.meta.heroSeed}/1800/640`}
        author={{
          name: post.meta.author.name,
          role: post.meta.author.role,
          avatar: `https://picsum.photos/seed/${post.meta.author.seed}/90`,
        }}
        readTime={post.meta.readTime}
        date={post.meta.date}
        crumbs={post.meta.crumbs}
      />

      <main className="mx-auto max-w-[1300px] px-6 py-10">
        <div className="grid items-start gap-9 lg:grid-cols-[1fr_280px]">
          <article className="min-w-0">
            <BlogPostIntro paragraphs={post.intro} />
            <BlogPostOverview
              title={post.overview.title}
              facts={post.overview.facts}
              bestFor={post.overview.bestFor}
            />
            <BlogPostSections
              id={post.sections.id}
              title={post.sections.title}
              numberPrefix={post.sections.numberPrefix}
              sections={post.sections.items}
            />
            <BlogPostHighlights
              id={post.highlights.id}
              title={post.highlights.title}
              items={post.highlights.items}
            />
            <BlogPostProseBlocks blocks={post.proseBlocks} />
            <BlogPostRelated posts={post.related} />
          </article>

          <BlogPostSidebar
            toc={toc}
            author={{
              name: post.meta.author.name,
              role: post.meta.author.role,
              bio: post.meta.author.bio,
              avatar: `https://picsum.photos/seed/${post.meta.author.seed}/110`,
            }}
            relatedTour={post.relatedTour}
          />
        </div>
      </main>
    </div>
  );
}