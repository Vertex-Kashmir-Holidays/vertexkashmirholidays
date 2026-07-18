// src/components/activities/ActivitySafetyTips.tsx
import { AlertTriangle } from "lucide-react";

interface ActivitySafetyTipsProps {
  tips: string[];
}

// Same warning-list idiom as Tour's Important Notes.
export function ActivitySafetyTips({ tips }: ActivitySafetyTipsProps) {
  if (tips.length === 0) return null;

  return (
    <section
      id="safety-tips"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <h2 className="text-[18px] font-bold">Safety Tips</h2>
      <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
