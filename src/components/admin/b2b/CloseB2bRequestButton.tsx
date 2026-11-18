"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RotateCcw, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";

interface Props {
  requestId: string;
  agencyName: string;
  /** Closed requests the agent already has (since last activation). */
  closedCount: number;
  limit: number;
}

/** Close a B2B request with a reason — emails the agent; the closure that
 *  reaches the limit deactivates their partnership. */
export function CloseB2bRequestButton({ requestId, agencyName, closedCount, limit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const next = closedCount + 1;
  const willDeactivate = next >= limit;

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b-requests/${requestId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not close the request.");
      const mail = data.emailDelivered ? "" : " (the email could not be sent)";
      toast.success(
        data.deactivated
          ? `Request closed — ${agencyName}'s partnership is now deactivated${mail}.`
          : `Request closed and the agent was emailed${mail}.`,
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close the request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
      >
        <XCircle className="h-3.5 w-3.5" /> Close request
      </button>
      <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close this request?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              The agent is emailed the reason below, with a reminder to send complete, genuine requests.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Reason
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Travel dates and hotel category were not shared after follow-ups."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 max-md:text-[16px]"
              />
            </label>
            <p
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                willDeactivate
                  ? "bg-red-500/10 text-red-700 dark:text-red-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {willDeactivate
                ? `This is closed request ${next} of ${limit} — ${agencyName}'s partnership will be deactivated and they can no longer send requests.`
                : `This will be closed request ${next} of ${limit} for ${agencyName}. At ${limit} the partnership is deactivated.`}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving || reason.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Close & email agent
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Reopen a closed request (admins, within 2 months of closing). */
export function ReopenB2bRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function reopen() {
    if (!window.confirm("Reopen this request? The agent is not emailed.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b-requests/${requestId}/close`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not reopen the request.");
      toast.success("Request reopened.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reopen the request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void reopen()}
      disabled={saving}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
    >
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />}
      Reopen
    </button>
  );
}
