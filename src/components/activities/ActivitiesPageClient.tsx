"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, RotateCcw } from "lucide-react";
import { ActivityCard, type ActivityCardData } from "@/components/activities/ActivityCard";

const PAGE_SIZE = 9;

type SortOption = "popular" | "price-asc" | "price-desc";
const sortLabels: Record<SortOption, string> = {
  popular: "Popular",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

export function ActivitiesPageClient({ activities }: { activities: ActivityCardData[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = activities.filter(
      (a) => !q || a.name.toLowerCase().includes(q) || (a.location ?? "").toLowerCase().includes(q),
    );
    if (sort === "price-asc") result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "price-desc")
      result.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return result;
  }, [activities, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const clear = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-[1300px] px-3 sm:px-6 py-10">
      <div className="grid gap-7 lg:grid-cols-[252px_1fr]">
        {/* Filters */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-[16px] font-bold">Search</p>
          <label className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              placeholder="Search activities..."
            />
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </label>

          <button
            onClick={clear}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Clear Filters
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </aside>

        {/* Grid */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="h-display text-[18px] font-bold">
              All Activities{" "}
              <span className="font-sans text-[14px] font-semibold text-primary">
                ({filtered.length} {filtered.length === 1 ? "Activity" : "Activities"})
              </span>
            </h2>
            <div className="flex items-center gap-2.5 text-[14px]">
              <label htmlFor="act-sort" className="hidden text-muted-foreground sm:inline">
                Sort by:
              </label>
              <select
                id="act-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="cursor-pointer appearance-none rounded-lg border border-border bg-card px-3.5 py-2 font-semibold shadow-soft outline-none transition hover:border-primary"
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {paged.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <p className="text-[18px] font-bold">No activities match your filters</p>
              <button
                onClick={clear}
                className="rounded-lg border-[1.5px] border-primary px-5 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((a, i) => (
                <ActivityCard key={a.id} activity={a} index={i} />
              ))}
            </motion.div>
          )}

          {pageCount > 1 && (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`${
                    p === currentPage
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "border border-border bg-card text-foreground shadow-soft hover:border-primary hover:text-primary"
                  } grid h-10 w-10 place-items-center rounded-full text-[14px] font-semibold transition`}
                >
                  {p}
                </button>
              ))}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
