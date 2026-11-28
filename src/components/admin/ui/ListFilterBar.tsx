"use client";

// Shared pieces of the admin list filter bar (Leads, Proposals, Bookings,
// Hotel Rates):
// on phones the search, filter toggle and refresh share the first line and
// the dropdowns fold behind the toggle, two per line; on md+ everything sits
// in one wrapping row.
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/atoms/button";

/** Search box sizing. On phones it fills the first line beside the filter
 *  toggle + refresh (2 × 38px + 2 gaps = 6.25rem), so opening the filters
 *  never pulls a dropdown up beside it and shrinks it. */
export const LIST_SEARCH_CLASS =
  "min-w-[180px] max-md:order-first max-md:min-w-0 max-md:flex-[1_1_calc(100%-6.25rem)]";

/** SelectTrigger sizing for a filter dropdown — two per line on phones. */
export const LIST_FILTER_TRIGGER =
  "w-auto min-w-[150px] max-md:w-[calc(50%-0.375rem)] max-md:min-w-0";

/** Phones only: shows/hides the folded filters, with a count of active ones. */
export function ListFilterToggle({
  open,
  onToggle,
  activeCount,
}: {
  open: boolean;
  onToggle: () => void;
  activeCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Hide filters" : "Show filters"}
      className={cn(
        "relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border transition-colors max-md:order-first md:hidden",
        open ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      <SlidersHorizontal className="h-4 w-4" />
      {activeCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      )}
    </button>
  );
}

/** Refresh — an icon on phones (first line), labelled at the row's end on md+. */
export function ListRefreshButton({ onClick, refreshing }: { onClick: () => void; refreshing: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={refreshing}
      aria-label="Refresh"
      className="ml-auto max-md:order-first max-md:ml-0 max-md:h-[38px] max-md:w-[38px] max-md:px-0"
    >
      <RefreshCw className={refreshing ? "animate-spin" : undefined} />
      <span className="max-md:sr-only">Refresh</span>
    </Button>
  );
}

/** "N results" — its own line at the bottom on phones. */
export function ListResultsCount({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground self-center shrink-0 max-md:order-last max-md:-mt-1 max-md:w-full">
      {children}
    </p>
  );
}
