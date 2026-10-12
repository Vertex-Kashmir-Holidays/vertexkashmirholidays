"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Plus } from "lucide-react";

interface Band {
  id: string;
  key: string;
  label: string;
  minAmount: number;
  isActive: boolean;
}

export interface CoverageItem {
  kind: string;
  name: string;
  pricePerPerson: number;
  /** The active band it falls in, or null (below the lowest band). */
  band: string | null;
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-mono text-foreground outline-none focus:border-primary";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Gap-proof budget-band editor: admins set only each band's START (₹ per
// person); the server regenerates every active band's end and label on save.
// Below: coverage of every tour/offer price against the active bands.
export function BudgetBandsClient({
  bands,
  coverage,
}: {
  bands: Band[];
  coverage: CoverageItem[];
}) {
  const router = useRouter();
  const [starts, setStarts] = useState<Record<string, string>>(() =>
    Object.fromEntries(bands.map((b) => [b.id, String(b.minAmount)])),
  );
  const [newStart, setNewStart] = useState("");
  const [busy, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function save(id: string | null, body: { minAmount: string; isActive: boolean }) {
    setBusyId(id ?? "new");
    startTransition(async () => {
      const res = await fetch(id ? `/api/admin/budget-bands/${id}` : "/api/admin/budget-bands", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
      };
      setBusyId(null);
      if (!res.ok) {
        const err = json.error;
        toast.error(
          typeof err === "string"
            ? err
            : (Object.values(err?.fieldErrors ?? {})[0]?.[0] ?? "Save failed."),
        );
        return;
      }
      toast.success(id ? "Bands updated." : "Band added.");
      if (!id) setNewStart("");
      router.refresh();
    });
  }

  const active = bands.filter((b) => b.isActive);
  const retired = bands.filter((b) => !b.isActive);
  const gaps = coverage.filter((c) => !c.band);

  const button = (label: string, id: string | null, onClick: () => void, tone = "primary") => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        tone === "primary"
          ? "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          : "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
      }
    >
      {busy && busyId === (id ?? "new") && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Active bands */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-semibold">Key</th>
              <th className="px-3 py-2 font-semibold">Starts at (₹ per person)</th>
              <th className="px-3 py-2 font-semibold">Range shown on the site (generated)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {active.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{b.key}</td>
                <td className="px-3 py-2 w-48">
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    value={starts[b.id] ?? ""}
                    onChange={(e) => setStarts((s) => ({ ...s, [b.id]: e.target.value }))}
                  />
                </td>
                <td className="px-3 py-2 font-semibold text-foreground">{b.label}</td>
                <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                  {button("Save", b.id, () =>
                    save(b.id, { minAmount: starts[b.id], isActive: true }),
                  )}
                  {button(
                    "Deactivate",
                    b.id,
                    () => save(b.id, { minAmount: starts[b.id], isActive: false }),
                    "secondary",
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">new</td>
              <td className="px-3 py-2 w-48">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  placeholder="e.g. 35000"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                Splits the band it falls in; ranges and labels update automatically.
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => save(null, { minAmount: newStart, isActive: true })}
                  disabled={busy || !newStart.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {busy && busyId === "new" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add band
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Coverage */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-display font-bold text-foreground text-sm">
          Coverage — every price a visitor can see, per person
        </h3>
        {gaps.length > 0 ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> {gaps.length} price
            {gaps.length === 1 ? "" : "s"} below the lowest band — lower the first band&apos;s
            start.
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Every price falls in a band.</p>
        )}
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-border">
            {coverage.map((c, i) => (
              <tr key={i} className={c.band ? "" : "text-red-600 dark:text-red-400"}>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                  {c.kind}
                </td>
                <td className="py-1.5 pr-3">{c.name}</td>
                <td className="py-1.5 pr-3 font-mono whitespace-nowrap">{inr(c.pricePerPerson)}</td>
                <td className="py-1.5 font-semibold whitespace-nowrap">{c.band ?? "No band"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Retired */}
      {retired.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display font-bold text-foreground text-sm">Retired bands</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hidden from the site; leads captured with them keep their label. Reactivating one
            regenerates its range and label from its start.
          </p>
          <ul className="mt-3 divide-y divide-border text-sm">
            {retired.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-1.5">
                <span>
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{b.key}</span>
                  {b.label}
                </span>
                {button(
                  "Reactivate",
                  b.id,
                  () => save(b.id, { minAmount: String(b.minAmount), isActive: true }),
                  "secondary",
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
