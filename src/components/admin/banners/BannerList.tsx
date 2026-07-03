"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Megaphone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerType = "STRIP" | "PROMO";

interface BannerRow {
  id: string;
  type: BannerType;
  title: string;
  pages: string; // JSON string array
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
}

function formatPages(raw: string): string {
  try {
    const p = JSON.parse(raw) as string[];
    if (!Array.isArray(p) || p.length === 0) return "—";
    if (p.includes("*")) return "All pages";
    return p.join(", ");
  } catch {
    return "—";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BannerList({
  items,
  canEdit,
  canDelete,
  canCreate = false,
}: {
  items: BannerRow[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function toggleActive(id: string, next: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        toast.error(res.status === 403 ? "You don't have permission to change this banner." : "Couldn't update the banner. Please try again.");
        return;
      }
      toast.success(next ? "Banner is now live." : "Banner hidden from the site.");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(res.status === 403 ? "You don't have permission to delete banners." : "Couldn't delete the banner. Please try again.");
        return;
      }
      toast.success("Banner deleted.");
      setConfirmDelete(null);
      router.refresh();
    });
  }

  // Shared presentational bits so the desktop table and mobile cards stay in sync.
  const typeBadge = (t: BannerType) => (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
        t === "STRIP"
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      )}
    >
      {t}
    </span>
  );

  const toggle = (b: BannerRow) => (
    <button
      type="button"
      role="switch"
      aria-checked={b.isActive}
      disabled={!canEdit || isPending}
      onClick={() => toggleActive(b.id, !b.isActive)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card disabled:opacity-60",
        b.isActive ? "bg-emerald-500" : "bg-muted-foreground/30",
      )}
      aria-label={b.isActive ? `Deactivate ${b.title}` : `Activate ${b.title}`}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition",
          b.isActive ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );

  const actions = (b: BannerRow) => (
    <>
      <Link
        href={`/admin/banners/${b.id}`}
        className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:h-8 md:w-8"
        aria-label={`Edit ${b.title}`}
      >
        <Pencil className="h-4 w-4" />
      </Link>
      {canDelete &&
        (confirmDelete === b.id ? (
          <span className="flex items-center gap-1">
            <button
              onClick={() => remove(b.id)}
              disabled={isPending}
              className="min-h-[40px] rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white md:min-h-0"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="min-h-[40px] rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted md:min-h-0"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(b.id)}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:text-red-400 md:h-8 md:w-8"
            aria-label={`Delete ${b.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ))}
    </>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">No banners yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Announce offers with a top strip, or spotlight a deal with an inline promo card.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/banners/new"
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Plus className="h-4 w-4" /> New Banner
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop / tablet: table (md and up) ──────────────────────────── */}
      <div className="hidden w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-[28%] px-4 py-2.5 font-semibold">Title</th>
              <th className="w-[10%] px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Pages</th>
              <th className="w-[8%] px-4 py-2.5 font-semibold">Active</th>
              <th className="w-[20%] px-4 py-2.5 font-semibold">Start / End</th>
              <th className="w-[7%] px-4 py-2.5 font-semibold">Sort</th>
              <th className="w-[12%] px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((b) => (
              <tr key={b.id} className="align-middle transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <span className="block truncate font-semibold text-foreground" title={b.title}>
                    {b.title}
                  </span>
                </td>
                <td className="px-4 py-3">{typeBadge(b.type)}</td>
                <td className="truncate px-4 py-3 text-xs text-muted-foreground" title={formatPages(b.pages)}>
                  {formatPages(b.pages)}
                </td>
                <td className="px-4 py-3">{toggle(b)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(b.startsAt)} — {formatDate(b.endsAt)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">{actions(b)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: stacked cards (below md) ─────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {items.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-foreground">{b.title}</p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">{formatPages(b.pages)}</p>
              </div>
              {typeBadge(b.type)}
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div className="flex gap-1.5">
                <dt className="font-medium text-foreground/70">Dates:</dt>
                <dd>
                  {formatDate(b.startsAt)} — {formatDate(b.endsAt)}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-medium text-foreground/70">Sort:</dt>
                <dd>{b.sortOrder}</dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                {toggle(b)}
                <span className="text-xs font-medium text-foreground">{b.isActive ? "Active" : "Hidden"}</span>
              </div>
              <div className="flex items-center gap-1">{actions(b)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
