"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATE_CARD_STATUS_STYLES } from "@/lib/rateCards/schema";
import { errorMessage } from "./fields";

export interface RateCardRow {
  id: string;
  name: string;
  seasonLabel: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  updatedAt: string;
  updatedByName: string | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function RateCardsManageClient({ cards, canDuplicate }: { cards: RateCardRow[]; canDuplicate: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function duplicate(card: RateCardRow) {
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${card.id}/duplicate`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res, "Duplicate failed."));
      const { id } = (await res.json()) as { id: string };
      toast.success("Copy created as a draft.");
      router.push(`/admin/rate-cards/${id}`);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/rate-cards"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Sales view
        </Link>
        <h2 className="mt-1 font-display text-xl font-extrabold text-foreground">Manage rate cards</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Only the active card is visible to sales. Start next season by duplicating this one.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No rate cards yet. Run the season seed script to create the first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Card</th>
                <th className="px-4 py-3 font-semibold">Valid</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Last edited</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/rate-cards/${card.id}`} className="font-semibold text-foreground hover:underline">
                      {card.name}
                    </Link>
                    <p className="text-[12px] text-muted-foreground">{card.seasonLabel}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground">
                    {fmtDate(card.startDate)} – {fmtDate(card.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", RATE_CARD_STATUS_STYLES[card.status])}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    v{card.version} · {new Date(card.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    {card.updatedByName ? <span className="block">{card.updatedByName}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/rate-cards/${card.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-semibold text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Link>
                      {canDuplicate ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => duplicate(card)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-semibold text-foreground hover:bg-muted disabled:opacity-40"
                        >
                          <Copy className="h-3 w-3" /> Duplicate
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
