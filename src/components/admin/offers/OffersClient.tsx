"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import type { OccasionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/accents";
import { OCCASION_LABELS } from "@/lib/offers/content";

interface OfferRow {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  sortOrder: number;
  occasionType: OccasionType;
  dates: string | null;
  packageCount: number;
  fromPrice: number | null;
  leadCount: number;
}

interface Props {
  offers: OfferRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

async function errorMessage(res: Response, fallback: string) {
  const body = (await res.json().catch(() => ({}))) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

export function OffersClient({ offers, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function togglePublished(o: OfferRow) {
    startTransition(async () => {
      const res = await fetch(`/api/occasion-offers/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !o.published }),
      });
      if (!res.ok) {
        toast.error(await errorMessage(res, "Update failed."));
        return;
      }
      toast.success(
        o.published ? "Offer unpublished — its page now returns 404." : "Offer is live.",
      );
      router.refresh();
    });
  }

  function duplicate(o: OfferRow) {
    startTransition(async () => {
      const res = await fetch(`/api/occasion-offers/${o.id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        toast.error(await errorMessage(res, "Duplicate failed."));
        return;
      }
      const { id } = (await res.json()) as { id: string };
      toast.success("Draft copy created — update its name, URL, dates and prices.");
      router.push(`/admin/offers/${id}/edit`);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/occasion-offers/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      if (!res.ok) {
        toast.error(await errorMessage(res, "Delete failed."));
        return;
      }
      toast.success("Offer deleted.");
      router.refresh();
    });
  }

  const iconBtn =
    "w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-50";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Occasion Offers</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Campaign landing pages (e.g. /offers/diwali-kashmir-tour-package-2026) with their own
            dates, stay tiers and prices. Unpublished offers return 404.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/offers/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Offer
          </Link>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["Offer", "Occasion", "Dates", "Packages", "Leads", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {offers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No offers yet.
                </td>
              </tr>
            ) : (
              offers.map((o) => (
                <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground text-xs">{o.name}</p>
                    <a
                      href={`/offers/${o.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-muted-foreground hover:text-primary"
                    >
                      /offers/{o.slug} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">
                    {OCCASION_LABELS[o.occasionType]}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {o.dates ?? <span className="text-muted-foreground">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {o.packageCount > 0 ? (
                      <>
                        {o.packageCount} · from {formatINR(o.fromPrice ?? 0)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">None published</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{o.leadCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-bold",
                        o.published
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {o.published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmDelete === o.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => remove(o.id)}
                          disabled={isPending}
                          className="text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg"
                        >
                          {isPending ? "…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[12px] font-bold text-muted-foreground px-2 py-1 rounded-lg border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Link
                            href={`/admin/offers/${o.id}/edit`}
                            className={cn(iconBtn, "hover:text-primary hover:bg-primary/10")}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => togglePublished(o)}
                            disabled={isPending}
                            className={cn(iconBtn, "hover:text-primary hover:bg-primary/10")}
                            title={o.published ? "Unpublish" : "Publish"}
                          >
                            {o.published ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        {canCreate && (
                          <button
                            onClick={() => duplicate(o)}
                            disabled={isPending}
                            className={cn(iconBtn, "hover:text-primary hover:bg-primary/10")}
                            title="Duplicate as draft"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(o.id)}
                            disabled={o.leadCount > 0}
                            className={cn(iconBtn, "hover:text-red-500 hover:bg-red-500/10")}
                            title={
                              o.leadCount > 0
                                ? "Has leads — unpublish instead of deleting"
                                : "Delete"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
