import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../atoms/button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Shown as a "Try again" button when provided. */
  onRetry?: () => void;
  className?: string;
}

// Inline, in-panel failure state for a client-side fetch that failed after
// mount (e.g. a modal loading its data) — distinct from src/app/error.tsx,
// which is the route-crash boundary Next.js renders for the whole page.
function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      <p>{title}</p>
      {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export { ErrorState };
