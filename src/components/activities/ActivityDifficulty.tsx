// src/components/activities/ActivityDifficulty.tsx
import { Gauge } from 'lucide-react';

interface ActivityDifficultyProps {
  difficulty: string | null;
}

export function ActivityDifficulty({ difficulty }: ActivityDifficultyProps) {
  if (!difficulty) return null;

  return (
    <section id="difficulty" className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      <h2 className="text-[18px] font-bold">Difficulty Level</h2>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Gauge className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="rounded-full bg-primary/10 px-4 py-1.5 text-[14px] font-bold text-primary">
          {difficulty}
        </span>
      </div>
    </section>
  );
}
