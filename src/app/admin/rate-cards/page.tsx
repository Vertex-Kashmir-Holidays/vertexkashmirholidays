import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RateCardSalesView } from "@/components/admin/rate-cards/RateCardSalesView";
import { toSalesData } from "@/lib/rateCards/schema";
import { parseRateCardData } from "@/lib/rateCards/server";

export const metadata: Metadata = { title: "Rate Cards — Admin" };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Sales lookup: the ACTIVE card only, read-only. Cost and profit rules are
// stripped server-side (toSalesData) so they never reach the browser.
export default async function RateCardsPage() {
  const session = await auth();
  const [card, canEdit] = await Promise.all([
    prisma.rateCard.findFirst({
      where: { status: "ACTIVE" },
      select: { name: true, seasonLabel: true, startDate: true, endDate: true, updatedAt: true, data: true },
    }),
    can(session!.user.role, "rateCards", "edit"),
  ]);
  const data = card ? parseRateCardData(card.data) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">
            {card ? `${card.name} · ${card.seasonLabel}` : "Rate Cards"}
          </h2>
          {card ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Valid {fmtDate(card.startDate)} – {fmtDate(card.endDate)} · rates updated {fmtDate(card.updatedAt)}
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <Link
            href="/admin/rate-cards/manage"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage cards
          </Link>
        ) : null}
      </div>

      {data ? (
        <RateCardSalesView data={toSalesData(data)} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No active rate card right now. Ask an admin to activate this season&apos;s card.
        </p>
      )}
    </div>
  );
}
