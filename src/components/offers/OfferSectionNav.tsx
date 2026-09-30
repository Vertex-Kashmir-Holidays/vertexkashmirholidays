"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useOfferSelection } from "./OfferSelection";

export interface OfferNavItem {
  id: string;
  label: string;
}

// Sticky in-page nav under the site header: only the sections this offer
// actually has, the one in view highlighted, and the enquiry CTA always one
// tap away on desktop. Scrolls horizontally on phones.
export function OfferSectionNav({ items }: { items: OfferNavItem[] }) {
  const { offer, openEnquiry } = useOfferSelection();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="sticky top-[76px] z-30 border-b border-border bg-background/90 backdrop-blur-xl sm:top-[84px]">
      <div className="mx-auto flex max-w-[1300px] items-center gap-4 px-4 sm:px-6">
        <nav
          aria-label="On this page"
          className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition",
                active === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => openEnquiry()}
          className="hidden shrink-0 rounded-full bg-primary px-5 py-2 text-[14px] font-bold text-primary-foreground shadow-glow transition hover:brightness-110 md:inline-flex"
        >
          {offer.ctaLabel}
        </button>
      </div>
    </div>
  );
}
