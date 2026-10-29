"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";
export const cellCls =
  "w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
export const labelCls = "block text-[12px] font-semibold text-muted-foreground mb-1";

/** The API's `{ error: string }` message, or `fallback`. */
export async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : fallback;
}

export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function replaceAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

/** Whole-rupee input. `nullable` → empty means "not offered" (null). */
export function AmountInput({
  value,
  onChange,
  nullable = false,
  className,
  ariaLabel,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  nullable?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-label={ariaLabel}
      value={value ?? ""}
      placeholder={nullable ? "—" : "0"}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(nullable ? null : 0);
        const n = Math.max(0, Math.round(Number(raw)));
        onChange(Number.isFinite(n) ? n : nullable ? null : 0);
      }}
      className={cn(cellCls, "text-right tabular-nums", className)}
    />
  );
}

export function RowActions({
  index,
  count,
  onMove,
  onDelete,
  label,
}: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
  label: string;
}) {
  const btn = "rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30";
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} title={`Move ${label} up`}>
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={btn}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        title={`Move ${label} down`}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
        onClick={onDelete}
        title={`Delete ${label}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AddRowButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

/** Editable ordered list of short strings (inclusions). */
export function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(replaceAt(items, i, e.target.value))}
            className={cellCls}
          />
          <RowActions
            index={i}
            count={items.length}
            label="item"
            onMove={(d) => onChange(moveItem(items, i, d))}
            onDelete={() => onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <AddRowButton onClick={() => onChange([...items, ""])}>{addLabel}</AddRowButton>
    </div>
  );
}

export function Section({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {badge}
        </div>
        {description ? <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
