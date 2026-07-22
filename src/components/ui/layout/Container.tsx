import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// The site's real max-width convention — mx-auto max-w-[1300px] px-6 is
// hand-copied across 70+ section wrappers. className lets callers layer on
// their own vertical padding (pt-16, py-14, etc.) without losing the shared
// width/centering.
export function Container({ children, className }: ContainerProps) {
  return <div className={cn("mx-auto max-w-[1300px] px-6", className)}>{children}</div>;
}
