"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "./usePagination";

interface Props {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  /** Word for the rows being listed, e.g. "leads", "bookings". Defaults to "records". */
  noun?: string;
}

// Shared footer control for admin listing tables: rows-per-page selector,
// "X–Y of Z" range, and prev/next paging. Hidden when there's nothing to show.
export function TablePagination({
  page,
  pageSize,
  pageCount,
  total,
  onPage,
  onPageSize,
  noun = "records",
}: Props) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Rows per page</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="appearance-none rounded-lg border border-border bg-card pl-2.5 pr-7 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="tabular-nums">
          {start}–{end} of {total} {noun}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="px-2 text-xs font-semibold text-muted-foreground tabular-nums">
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
