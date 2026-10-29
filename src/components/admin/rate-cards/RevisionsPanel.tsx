"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";
import { rateCardDataSchema, toSalesData, type RateCardSalesData } from "@/lib/rateCards/schema";
import { RateCardSalesView } from "./RateCardSalesView";
import { Section, errorMessage } from "./fields";

interface RevisionRow {
  id: string;
  version: number;
  changeNote: string | null;
  createdAt: string;
  createdByName: string | null;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function RevisionsPanel({
  cardId,
  currentVersion,
  hasUnsavedChanges,
}: {
  cardId: string;
  currentVersion: number;
  hasUnsavedChanges: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [viewing, setViewing] = useState<{ version: number; data: RateCardSalesData } | null>(null);
  const [restoring, setRestoring] = useState<RevisionRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rate-cards/${cardId}/revisions`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((rows: RevisionRow[]) => !cancelled && setRevisions(rows))
      .catch(() => !cancelled && setRevisions([]));
    return () => {
      cancelled = true;
    };
  }, [cardId, currentVersion]);

  function view(rev: RevisionRow) {
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${cardId}/revisions/${rev.id}`);
      if (!res.ok) return void toast.error(await errorMessage(res, "Couldn't load that version."));
      const parsed = rateCardDataSchema.safeParse((await res.json()).data);
      if (!parsed.success) return void toast.error("That version's data can't be displayed.");
      setViewing({ version: rev.version, data: toSalesData(parsed.data) });
    });
  }

  function restore(rev: RevisionRow) {
    setRestoring(null);
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${cardId}/revisions/${rev.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: currentVersion }),
      });
      if (!res.ok) return void toast.error(await errorMessage(res, "Restore failed."));
      toast.success(`Restored version ${rev.version} as version ${currentVersion + 1}.`);
      router.refresh();
    });
  }

  return (
    <Section
      title="Revision history"
      description={`Current version: ${currentVersion}. Each save keeps the previous version here; restoring creates a new version.`}
    >
      {revisions === null ? (
        <p className="text-[12px] text-muted-foreground">Loading…</p>
      ) : revisions.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No earlier versions yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {revisions.map((rev) => (
            <li key={rev.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
              <span className="font-bold text-foreground">v{rev.version}</span>
              <span className="text-[12px] text-muted-foreground">
                {fmtDateTime(rev.createdAt)}
                {rev.createdByName ? ` · ${rev.createdByName}` : ""}
              </span>
              {rev.changeNote ? <span className="text-[12px] text-foreground">“{rev.changeNote}”</span> : null}
              <span className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => view(rev)}
                  className="rounded-lg border border-border px-2 py-1 text-[12px] font-semibold text-foreground hover:bg-muted disabled:opacity-40"
                >
                  View
                </button>
                <button
                  type="button"
                  disabled={isPending || hasUnsavedChanges}
                  title={hasUnsavedChanges ? "Save or discard your changes first" : undefined}
                  onClick={() => setRestoring(rev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-semibold text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <History className="h-3 w-3" /> Restore
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version {viewing?.version} (read only)</DialogTitle>
          </DialogHeader>
          {viewing ? <RateCardSalesView data={viewing.data} /> : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!restoring}
        title={`Restore version ${restoring?.version}?`}
        description={`The card's current data is kept in history, and version ${restoring?.version}'s data becomes version ${currentVersion + 1}. Card name and dates are not changed.`}
        confirmLabel="Restore"
        onConfirm={() => restoring && restore(restoring)}
        onCancel={() => setRestoring(null)}
      />
    </Section>
  );
}
