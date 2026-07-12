// src/components/activities/ActivityNearby.tsx
import { ActivityCard, type ActivityCardData } from '@/components/activities/ActivityCard';

interface ActivityNearbyProps {
  activities: ActivityCardData[];
}

// Derived automatically (shared destination, excludes current activity, capped
// at 3–4) — no new database relation. Reuses the same ActivityCard as the
// listing page.
export function ActivityNearby({ activities }: ActivityNearbyProps) {
  if (activities.length === 0) return null;

  return (
    <section id="nearby-activities" className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      <h2 className="text-[18px] font-bold">Nearby Activities</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} index={i} />
        ))}
      </div>
    </section>
  );
}
