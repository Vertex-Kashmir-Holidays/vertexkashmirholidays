// src/components/activities/ActivityQuickFacts.tsx
import { MapPin, Clock, BadgeIndianRupee, Gauge } from 'lucide-react';
import { formatINR } from '@/lib/accents';

interface ActivityQuickFactsProps {
  location: string | null;
  duration: string | null;
  price: number | null;
  difficulty: string | null;
}

// Same compact facts-strip idiom as the Tour/Destination detail pages.
export function ActivityQuickFacts({ location, duration, price, difficulty }: ActivityQuickFactsProps) {
  const facts = [
    ...(location ? [{ icon: MapPin, label: 'Location', value: location }] : []),
    ...(duration ? [{ icon: Clock, label: 'Duration', value: duration }] : []),
    ...(price != null ? [{ icon: BadgeIndianRupee, label: 'From', value: `${formatINR(price)} / person` }] : []),
    ...(difficulty ? [{ icon: Gauge, label: 'Difficulty', value: difficulty }] : []),
  ];

  if (facts.length === 0) return null;

  return (
    <section id="quick-facts" className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {facts.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">{f.label}</p>
              <p className="text-[13.5px] font-bold">{f.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
