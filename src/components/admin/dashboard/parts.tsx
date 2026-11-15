import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Building blocks for the admin dashboard: KPI card with sparkline, panel
// shell, avatar initials and the empty-state line. Server-safe (no hooks).

export type Tone = "blue" | "rose" | "green" | "violet" | "amber";

const TONES: Record<Tone, { card: string; icon: string; line: string }> = {
  blue: {
    card: "bg-blue-500/[0.07] border-blue-500/20",
    icon: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    line: "text-blue-500",
  },
  rose: {
    card: "bg-rose-500/[0.07] border-rose-500/20",
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    line: "text-rose-500",
  },
  green: {
    card: "bg-emerald-500/[0.07] border-emerald-500/20",
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    line: "text-emerald-500",
  },
  violet: {
    card: "bg-violet-500/[0.07] border-violet-500/20",
    icon: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    line: "text-violet-500",
  },
  amber: {
    card: "bg-amber-500/[0.07] border-amber-500/20",
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    line: "text-amber-500",
  },
};

/** Tiny trend line; scales to its box. A flat series draws a flat line. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = max === min ? 20 : 36 - ((v - min) / span) * 32;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className} aria-hidden>
      <polygon points={`0,40 ${pts.join(" ")} 100,40`} fill="currentColor" opacity={0.12} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  Icon,
  tone,
  series,
  change,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  Icon: LucideIcon;
  tone: Tone;
  series: number[];
  /** % vs the previous period, or null to show `sub` alone. */
  change: number | null;
  sub: string;
  href: string;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        t.card,
      )}
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", t.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-extrabold leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs font-semibold text-foreground/80">{label}</p>
        <p className="mt-1.5 flex items-center gap-1 text-[12px]">
          {change !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-bold",
                change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
          )}
          <span className="truncate text-muted-foreground">{sub}</span>
        </p>
      </div>
      <Sparkline values={series} className={cn("h-10 w-20 shrink-0 sm:w-24", t.line)} />
    </Link>
  );
}

export function Panel({
  title,
  Icon,
  iconClass,
  badge,
  href,
  hrefLabel = "View all",
  children,
  className,
  bodyClassName,
}: {
  title: string;
  Icon: LucideIcon;
  iconClass?: string;
  badge?: ReactNode;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl border border-border bg-card shadow-sm", className)}>
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3.5 sm:px-5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="min-w-0 flex-1 truncate font-display text-sm font-bold text-foreground">{title}</h3>
        {badge != null && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {hrefLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </header>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

const AVATAR_TONES = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
];

/** Initials bubble; the colour is stable per name. */
export function Avatar({ name }: { name: string }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const tone = AVATAR_TONES[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        tone,
      )}
    >
      {initials}
    </span>
  );
}

/** Name over phone, with avatar — the "Customer" cell of every dashboard table. */
export function PersonCell({ name, phone }: { name: string; phone?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{name}</p>
        {phone ? <p className="truncate text-[12px] text-muted-foreground">{phone}</p> : null}
      </div>
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-xs text-muted-foreground">{children}</p>;
}

export const thCls =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pl-5 last:pr-5";
export const tdCls = "px-4 py-3 align-middle first:pl-5 last:pr-5";
