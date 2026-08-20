import { Skeleton } from "@/components/ui/atoms/skeleton";
import { cn } from "@/lib/utils";

export interface FormSkeletonProps {
  /** Announced while the route streams, e.g. "Loading package editor". */
  label: string;
  /** Field placeholders per card. One number per card, top to bottom. */
  sections?: number[];
  /** Reserve the breadcrumb line admin detail pages render above the heading. */
  breadcrumb?: boolean;
  /** Reserve the narrow right-hand column of the admin detail/editor layout. */
  sidebar?: number;
  /** Reserve the header's primary action ("Save", "Publish") button. */
  action?: boolean;
  className?: string;
}

/**
 * Route-level placeholder for the admin create/edit/detail layout: an optional
 * breadcrumb, a heading, then stacked bordered cards of field rows with an
 * optional sidebar column. Used wherever a list `loading.tsx` would otherwise
 * cascade a table skeleton onto a form page.
 */
function FormSkeleton({
  label,
  sections = [5, 3],
  breadcrumb = false,
  sidebar = 0,
  action = true,
  className,
}: FormSkeletonProps) {
  const cards = (
    <div className="space-y-5">
      {sections.map((fields, s) => (
        <div key={s} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: fields }).map((_, f) => (
              <div key={f} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-5", className)} aria-busy="true" aria-label={label}>
      {breadcrumb && <Skeleton className="h-3 w-48" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3 w-40" />
        </div>
        {action && <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-28" />}
      </div>

      {sidebar > 0 ? (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-4">
          <div className="xl:col-span-3">{cards}</div>
          <div className="space-y-5 xl:col-span-1">
            {Array.from({ length: sidebar }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        cards
      )}
    </div>
  );
}

export { FormSkeleton };
