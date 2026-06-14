// src/components/campaign/CampaignMarquee.tsx
'use client';

interface CampaignMarqueeProps {
  items: string[];
}

export function CampaignMarquee({ items }: CampaignMarqueeProps) {
  return (
    <section className="relative z-[2] border-y border-border bg-foreground/[.03] py-4 backdrop-blur">
      <div className="marquee">
        <div className="mq-track text-[13px] font-semibold tracking-wide text-muted-foreground">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
