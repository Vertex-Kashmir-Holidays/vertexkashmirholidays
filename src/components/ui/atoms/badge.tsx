import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[12px] font-bold", {
  variants: {
    variant: {
      default: "bg-muted text-muted-foreground",
      success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
