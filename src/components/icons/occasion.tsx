import type { SVGProps } from "react";
import {
  Moon,
  Palette,
  Sparkles,
  Sun,
  Tag,
  TreePine,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Diya (oil lamp) in Lucide's line style — Lucide has no diya, and Diwali
// offers should show one rather than a generic party icon.
export function DiyaIcon({
  className,
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* flame */}
      <path d="M12 2.5c1.7 1.9 2.5 3.4 2.5 4.8a2.5 2.5 0 0 1-5 0c0-1.4.8-2.9 2.5-4.8z" />
      {/* lamp bowl with spout */}
      <path d="M3 12.5h15.5l2.5-1.5-.9 2.6C19 17.2 15.8 19 12 19s-7-1.8-8.1-5z" />
      {/* base */}
      <path d="M9.5 19 9 21.5h6l-.5-2.5" />
    </svg>
  );
}

type OccasionIcon = LucideIcon | ((props: LucideProps) => React.JSX.Element);

/** Icon per occasion — Diwali gets the diya. */
export const OCCASION_ICONS: Record<string, OccasionIcon> = {
  DIWALI: DiyaIcon as OccasionIcon,
  CHRISTMAS: TreePine,
  NEW_YEAR: Sparkles,
  EID: Moon,
  HOLI: Palette,
  SUMMER: Sun,
  OTHER: Tag,
};

export const occasionIcon = (occasionType: string): OccasionIcon =>
  OCCASION_ICONS[occasionType] ?? Tag;
