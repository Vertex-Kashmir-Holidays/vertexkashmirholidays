"use client";

import { parseMarqueeItem } from "@/lib/marqueeIcons";

interface UpdatesStripProps {
  items: string[];
}

export function UpdatesStrip({ items }: UpdatesStripProps) {
  if (items.length === 0) return null;

  return (
    <section className="relative z-[2] border-y border-border bg-foreground/[.03] py-4 backdrop-blur">
      <div className="marquee">
        <div className="marquee-track text-[14px] font-semibold tracking-wide text-muted-foreground">
          {[...items, ...items].map((item, i) => {
            const { Icon, label } = parseMarqueeItem(item);
            return (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                {Icon && <Icon className="h-4 w-4 text-primary" strokeWidth={2} />}
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
