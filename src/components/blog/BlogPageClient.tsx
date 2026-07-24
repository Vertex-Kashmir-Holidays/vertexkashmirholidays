"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BlogArticlesGrid } from "@/components/blog/BlogArticlesGrid";
import { BlogCategoryChips } from "@/components/blog/BlogCategoryChips";
import { BlogFeaturedStory } from "@/components/blog/BlogFeaturedStory";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import type {
  BlogArticleData,
  BlogCategoryData,
  BlogChipData,
  BlogFeaturedData,
  BlogPageContent,
  BlogTrendingData,
} from "@/types/blog";

const PAGE_SIZE = 9;

interface BlogPageClientProps {
  content: BlogPageContent;
  featured: BlogFeaturedData | null;
  articles: BlogArticleData[];
  chips: BlogChipData[];
  categories: BlogCategoryData[];
  trending: BlogTrendingData[];
}

export function BlogPageClient({
  content,
  featured,
  articles,
  chips,
  categories,
  trending,
}: BlogPageClientProps) {
  // Read client-side (not via the page's searchParams prop) so this page can
  // stay statically rendered — reading searchParams server-side forces the
  // whole route dynamic on every request regardless of `revalidate`.
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const initialCategory = categorySlug
    ? (categories.find((c) => c.slug === categorySlug)?.name ?? "All")
    : "All";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch = activeCategory === "All" || article.category === activeCategory;
      const searchMatch = !q || article.title.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [articles, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  return (
    <div className="bg-background text-foreground">
      <BlogHero content={content} onSearch={handleSearch} />
      <BlogCategoryChips
        chips={chips}
        onCategoryChange={handleCategoryChange}
        initialActive={initialCategory}
      />

      <main className="mx-auto max-w-[1300px] px-6 py-9">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            {featured && <BlogFeaturedStory story={featured} />}
            <BlogArticlesGrid articles={paged} />
            <BlogPagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>

          <BlogSidebar content={content} categories={categories} trending={trending} />
        </div>
      </main>
    </div>
  );
}
