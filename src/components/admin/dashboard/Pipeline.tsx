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

const STAGE_BARS = ["bg-blue-500", "bg-amber-400", "bg-rose-500", "bg-violet-500", "bg-emerald-500"];

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
      {/* Narrow panel (phones; half-width at lg–xl): stages as a vertical bar list. */}
      <ul className="space-y-2 sm:hidden lg:block 2xl:hidden">
        {stages.map((s, i) => (
          <li key={s.status}>
            <Link
              href={`/admin/leads?status=${s.status}`}
              className="block rounded-lg px-1 py-0.5 transition hover:bg-muted/50"
            >
              <span className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="font-semibold text-foreground">{s.label}</span>
                <span className="text-muted-foreground">
                  <span className="font-display text-sm font-extrabold text-foreground">{s.count}</span> · {pct(s.count)}%
                </span>
              </span>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full", STAGE_BARS[i % STAGE_BARS.length])}
                  style={{ width: `${Math.max(pct(s.count), s.count > 0 ? 3 : 0)}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {/* Wide panel: arrow-shaped stages. */}
      <div className="hidden sm:block lg:hidden 2xl:block">
        <div className="flex">
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
