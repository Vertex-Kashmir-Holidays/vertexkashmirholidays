// src/components/activities/ActivitySuitableFor.tsx
import { Users } from "lucide-react";

interface ActivitySuitableForProps {
  items: string[];
}

export function ActivitySuitableFor({ items }: ActivitySuitableForProps) {
  if (items.length === 0) return null;

  return (
    <section
      id="suitable-for"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <h2 className="text-[18px] font-bold">Suitable For</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3.5 py-1.5 text-[14px] font-semibold text-foreground/80"
          >
            <Users className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
