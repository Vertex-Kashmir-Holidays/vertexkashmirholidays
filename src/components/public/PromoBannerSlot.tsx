"use client";

import { usePathname } from "next/navigation";
import { PromoBanner, type PromoBannerData } from "@/components/public/PromoBanner";

// A promo banner plus its parsed target pages (["*"] means every page).
export type SlotBanner = PromoBannerData & { pages: string[] };

/**
 * Maps a public pathname to the banner page key used in the admin targeting
 * options. Section prefixes (and their detail pages) resolve to the section key;
 * anything else falls back to a key only "*" (All Pages) banners will match.
 */
function pageKeyFor(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/tours")) return "tours";
  if (pathname.startsWith("/destinations")) return "destinations";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/activities")) return "activities";
  if (pathname.startsWith("/campaign")) return "campaigns";
  return "other";
}

/**
 * Renders the active PROMO banners for the current page. Fed the full active set
 * by the public layout and filters client-side by pathname, so "All Pages" ("*")
 * banners appear on every public page while page-specific banners stay scoped.
 */
export function PromoBannerSlot({ banners }: { banners: SlotBanner[] }) {
  const pathname = usePathname() ?? "/";
  const key = pageKeyFor(pathname);
  const matched = banners.filter((b) => b.pages.includes("*") || b.pages.includes(key));
  return <PromoBanner banners={matched} />;
}
