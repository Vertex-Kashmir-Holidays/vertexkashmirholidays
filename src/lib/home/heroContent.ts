// Static defaults for the two hero content strips (features + payment
// methods). Shipped as code today — same "ship a default, DB overrides later"
// convention as LEGAL_PAGES in src/lib/legal/content.ts — so the eventual move
// to admin-editable HeroFeature/PaymentMethod tables only changes where the
// homepage fetches this array from, not HeroSection's props or rendering.
import type { HeroFeatureData, PaymentMethodData } from "@/types/home";

export const HERO_FEATURES: HeroFeatureData[] = [
  { id: "stays", icon: "mountain", title: "Handpicked Stays", subtitle: "Hotels & houseboats" },
  { id: "safety", icon: "shield", title: "Safe & Trusted", subtitle: "Reliable travel support" },
  { id: "transport", icon: "car", title: "Comfortable Transport", subtitle: "Hassle-free transfers" },
  { id: "local", icon: "sparkles", title: "Local Experiences", subtitle: "Curated Kashmir experiences" },
];

export const PAYMENT_METHODS: PaymentMethodData[] = [
  { id: "card", icon: "card", label: "Debit/Credit Card" },
  { id: "upi", icon: "upi", label: "UPI" },
  { id: "emi", icon: "emi", label: "EMI Options" },
  { id: "wallet", icon: "wallet", label: "Wallets" },
  { id: "netbanking", icon: "netbanking", label: "Net Banking" },
];
