import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">{title}</h2>
        {description && <p className="text-muted-foreground text-xs mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
