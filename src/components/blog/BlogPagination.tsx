// src/components/blog/BlogPagination.tsx
"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Builds a compact page list with ellipses, e.g. 1 … 4 5 6 … 12
function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function BlogPagination({ currentPage, totalPages, onPageChange }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);

  return (
    <nav className="mt-9 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {pages.map((p, i) => {
        if (p === "…") {
          return (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          );
        }
        const isActive = p === currentPage;
        return (
          <motion.button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={isActive ? "page" : undefined}
            className={`grid h-9 w-9 place-items-center rounded-lg text-[14px] font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground shadow-card"
                : "border border-border bg-card text-foreground shadow-soft hover:border-primary hover:text-primary"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {p}
          </motion.button>
        );
      })}
      <motion.button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage >= totalPages}
        className="ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[14px] font-semibold shadow-soft transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Next
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
      </motion.button>
    </nav>
  );
}
