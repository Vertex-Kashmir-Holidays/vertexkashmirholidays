import Link from "next/link";
import { cn } from "@/lib/utils";

// Sales pipeline as arrow-shaped stages (left → right). Each stage links to
// the Leads list filtered by that status.

const STAGE_TONES = [
  "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  "bg-amber-400/20 text-amber-800 dark:text-amber-200",
  "bg-rose-500/15 text-rose-800 dark:text-rose-200",
  "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
];

// Arrow notch on both sides; the first stage has a flat left edge.
const ARROW = "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)";
const ARROW_FIRST = "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)";

export function Pipeline({
  total,
  stages,
  others,
}: {
  total: number;
  stages: { status: string; label: string; count: number }[];
  others: { label: string; count: number }[];
}) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-[560px]">
          {stages.map((s, i) => (
            <Link
              key={s.status}
              href={`/admin/leads?status=${s.status}`}
              style={{ clipPath: i === 0 ? ARROW_FIRST : ARROW }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-5 text-center transition hover:brightness-110",
                i > 0 && "-ml-2",
                STAGE_TONES[i % STAGE_TONES.length],
              )}
            >
              <span className="text-[12px] font-bold">{s.label}</span>
              <span className="font-display text-2xl font-extrabold leading-tight">{s.count}</span>
              <span className="text-[11px] font-semibold opacity-75">{pct(s.count)}%</span>
            </Link>
          ))}
        </div>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        {others.map((o) => (
          <span key={o.label}>
            {o.label}: <span className="font-semibold text-foreground">{o.count}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
