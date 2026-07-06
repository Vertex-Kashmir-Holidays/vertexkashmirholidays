// src/components/activities/ActivityWhatToCarry.tsx
import { CheckCircle2 } from 'lucide-react';

interface ActivityWhatToCarryProps {
  items: string[];
}

export function ActivityWhatToCarry({ items }: ActivityWhatToCarryProps) {
  if (items.length === 0) return null;

  return (
    <section id="what-to-carry" className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      <h2 className="text-[17px] font-bold">What to Carry</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-[13px] text-foreground/80">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
