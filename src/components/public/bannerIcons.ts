import {
  BedDouble,
  Bus,
  CalendarCheck,
  Car,
  Headphones,
  Heart,
  Map,
  Mountain,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  TrainFront,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Fixed icon set for SPLIT promo-banner features (Banner.features[].icon).
// Admins pick by key in BannerForm; the public card renders the same map, so
// a stored key always resolves (unknown keys fall back to Sparkles).
export const BANNER_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  plane: { label: "Flight", Icon: Plane },
  train: { label: "Train", Icon: TrainFront },
  bus: { label: "Bus", Icon: Bus },
  car: { label: "Car / Cab", Icon: Car },
  hotel: { label: "Hotel", Icon: BedDouble },
  meals: { label: "Meals", Icon: Utensils },
  mountain: { label: "Mountain", Icon: Mountain },
  map: { label: "Map", Icon: Map },
  ticket: { label: "Ticket", Icon: Ticket },
  calendar: { label: "Calendar", Icon: CalendarCheck },
  shield: { label: "Safe / Trusted", Icon: ShieldCheck },
  support: { label: "Support", Icon: Headphones },
  wallet: { label: "Price / Wallet", Icon: Wallet },
  star: { label: "Star", Icon: Star },
  heart: { label: "Heart", Icon: Heart },
  sparkles: { label: "Sparkles", Icon: Sparkles },
};

export function bannerIcon(key: string): LucideIcon {
  return BANNER_ICONS[key]?.Icon ?? Sparkles;
}

/** One feature row in a SPLIT promo banner (stored as JSON in Banner.features). */
export interface BannerFeature {
  icon: string;
  title: string;
  text?: string;
}

export const MAX_BANNER_FEATURES = 4;

export function parseBannerFeatures(raw: string | null | undefined): BannerFeature[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as BannerFeature[]).filter((f) => f && typeof f.title === "string")
      : [];
  } catch {
    return [];
  }
}
