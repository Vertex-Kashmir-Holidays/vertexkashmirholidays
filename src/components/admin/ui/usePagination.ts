import { useEffect, useMemo, useState } from "react";

// Shared page-size choices for every admin listing table. 10 is the default.
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Client-side pagination over an already-loaded (and already filtered) array.
 * Admin list pages load their rows up front and filter/search in the browser,
 * so paginating the resulting array keeps one consistent, dependency-free model
 * across every table.
 *
 * Pass the *filtered* list. When it shrinks (a search narrows results) the page
 * is clamped back into range automatically.
 */
export function usePagination<T>(items: T[], initialPageSize: number = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Keep the page valid as the underlying set changes size.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function changePageSize(n: number) {
    setPageSize(n);
    setPage(1);
  }

  return { page, setPage, pageSize, changePageSize, pageCount, total, pageItems };
}
