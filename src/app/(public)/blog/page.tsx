// src/app/(public)/blog/page.tsx
'use client';

import { BlogArticlesGrid } from '@/components/blog/BlogArticlesGrid';
import { BlogCategoryChips } from '@/components/blog/BlogCategoryChips';
import { BlogFeaturedStory } from '@/components/blog/BlogFeaturedStory';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { useState } from 'react';

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    { seed: 'b-srinagar', cat: 'KASHMIR', chip: 'Kashmir', title: 'Srinagar in Summer: 10 Things You Must Do', date: 'May 26, 2026', read: '6 min read' },
    { seed: 'b-packing', cat: 'TRAVEL TIPS', chip: 'Travel Tips', title: 'Packing List for Kashmir Trip: What to Pack & What to Skip', date: 'May 24, 2026', read: '5 min read' },
    { seed: 'b-romantic', cat: 'HONEYMOON', chip: 'Honeymoon', title: '7 Romantic Experiences for Couples in Kashmir', date: 'May 23, 2026', read: '7 min read' },
    { seed: 'b-apharwat', cat: 'ADVENTURE', chip: 'Adventure', title: 'Apharwat Peak Trek & Gondola Ride: Ultimate Guide', date: 'May 21, 2026', read: '6 min read' },
    { seed: 'b-dishes', cat: 'FOOD', chip: 'Food', title: "Must Try 15 Kashmiri Dishes You'll Love", date: 'May 19, 2026', read: '8 min read' },
    { seed: 'b-tulip', cat: 'KASHMIR', chip: 'Kashmir', title: 'Tulip Garden Kashmir: Complete Guide 2026', date: 'May 17, 2026', read: '4 min read' },
    { seed: 'b-pahalgam', cat: 'DESTINATIONS', chip: 'Kashmir', title: 'Pahalgam Travel Guide: Best Time, Places & Hotels', date: 'May 16, 2026', read: '6 min read' },
    { seed: 'b-culture', cat: 'CULTURE', chip: 'Culture', title: 'Kashmiri Culture & Traditions: A Complete Guide', date: 'May 15, 2026', read: '7 min read' },
    { seed: 'b-winter', cat: 'TRAVEL TIPS', chip: 'Travel Tips', title: 'Kashmir in Winter: Everything You Need to Know', date: 'May 14, 2026', read: '5 min read' },
  ];

  const categories = [
    { name: 'Kashmir Guide', count: 28 },
    { name: 'Honeymoon', count: 16 },
    { name: 'Travel Tips', count: 22 },
    { name: 'Adventure', count: 14 },
    { name: 'Culture & Festivals', count: 12 },
    { name: 'Food & Cuisine', count: 10 },
    { name: 'News & Updates', count: 8 },
  ];

  const trending = [
    { seed: 'tr-gondola', title: 'Gulmarg Gondola: Everything You Need to Know', date: 'May 25, 2026' },
    { seed: 'tr-wazwan', title: "Kashmiri Wazwan: A Foodie's Paradise", date: 'May 22, 2026' },
    { seed: 'tr-tarsar', title: 'Trek to Tarsar Marsar: Complete Guide 2026', date: 'May 20, 2026' },
    { seed: 'tr-besttime', title: 'Best Time to Visit Kashmir Month by Month', date: 'May 18, 2026' },
  ];

  const featuredStory = {
    title: '15 Best Places to Visit in Kashmir This Summer 2026',
    excerpt: 'From blooming meadows to crystal-clear lakes, explore the most beautiful places in Kashmir you shouldn\'t miss this season.',
    image: 'https://picsum.photos/seed/blog-featured/900/640',
    author: {
      name: 'Aamir Bashir',
      image: 'https://picsum.photos/seed/author-aamir/70',
    },
    date: 'May 28, 2026',
    readTime: '8 min',
  };

  // Filter articles based on category and search
  const filteredArticles = articles.filter((article) => {
    const categoryMatch = activeCategory === 'All' || article.chip === activeCategory || article.cat === activeCategory.toUpperCase();
    const searchMatch = !searchQuery || article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="bg-white text-brand-ink">
      <BlogHero onSearch={setSearchQuery} />
      <BlogCategoryChips onCategoryChange={setActiveCategory} />
      
      <main className="mx-auto max-w-[1300px] px-6 py-9">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <BlogFeaturedStory story={featuredStory} />
            <BlogArticlesGrid articles={filteredArticles} />
            <BlogPagination />
          </div>
          
          <BlogSidebar categories={categories} trending={trending} />
        </div>
      </main>
    </div>
  );
}