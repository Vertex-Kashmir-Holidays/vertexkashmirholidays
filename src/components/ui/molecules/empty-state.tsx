import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Optional lucide icon shown above the title. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** e.g. a Button to create the first item. */
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="h-8 w-8" />}
      <p>{title}</p>
      {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
