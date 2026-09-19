import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

interface Options<T> {
  /** List endpoint, e.g. "/api/proposals" — called with page/pageSize/search/filter params. */
  endpoint: string;
  /** JSON key holding the rows in the response, e.g. "proposals". The response must also carry `total`. */
  itemsKey: string;
  /** First page, rendered by the server component — no fetch is made on first paint. */
  initialItems: T[];
  initialTotal: number;
  /** Raw search box value — debounced here before it hits the network. */
  search: string;
  /** Discrete filters (e.g. status). Empty / "ALL" values are omitted from the request. */
  filters?: Record<string, string>;
}

/**
 * Server-side counterpart to `usePagination`: fetches only the visible page from
 * an offset-paginated endpoint instead of loading every row up front. Pair with
 * `TablePagination` for the rows-per-page dropdown and prev/next controls.
 */
export function useServerPagedList<T>({
  endpoint,
  itemsKey,
  initialItems,
  initialTotal,
  search,
  filters = {},
}: Options<T>) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const hasMounted = useRef(false);
  const requestId = useRef(0);

  // Avoid a network round trip on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const queryKey = JSON.stringify({ ...filters, search: debouncedSearch });
  const lastQueryKey = useRef(queryKey);

  async function load() {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      for (const [key, value] of Object.entries({ ...filters, search: debouncedSearch })) {
        if (value && value !== "ALL") params.set(key, value);
      }
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (id !== requestId.current) return; // a newer request superseded this one
      setItems(json[itemsKey] as T[]);
      setTotal(json.total as number);
    } catch {
      if (id === requestId.current) toast.error("Failed to load the list.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    // A filter/search change restarts from page 1; the resulting page change
    // re-runs this effect and does the fetch.
    if (lastQueryKey.current !== queryKey) {
      lastQueryKey.current = queryKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    // First mount: the server already rendered this page.
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, queryKey]);

  // Deleting the last row on the last page leaves `page` out of range.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function changePageSize(n: number) {
    setPageSize(n);
    setPage(1);
  }

  return { items, total, page, setPage, pageSize, changePageSize, pageCount, loading, reload: load };
}
