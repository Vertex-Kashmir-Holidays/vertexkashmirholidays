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

// Reads ?category= client-side (not via the page's searchParams prop) so /blog
// can stay statically rendered — reading searchParams server-side forces the
// whole route dynamic on every request regardless of `revalidate`. The page's
// Suspense fallback renders <BlogPageView initialCategory="All"> directly, so
// the served HTML still carries the full grid (every post link) for crawlers.
export function BlogPageClient(props: BlogPageClientProps) {
  const categorySlug = useSearchParams().get("category");
  const initialCategory = categorySlug
    ? (props.categories.find((c) => c.slug === categorySlug)?.name ?? "All")
    : "All";
  // Keyed so a client-side navigation to another ?category= resets the view.
  return <BlogPageView key={initialCategory} {...props} initialCategory={initialCategory} />;
}

export function BlogPageView({
  content,
  featured,
  articles,
  chips,
  categories,
  trending,
  initialCategory,
}: BlogPageClientProps & { initialCategory: string }) {
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

          <BlogSidebar
            content={content}
            categories={categories}
            trending={trending}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </main>
    </div>
  );
}
