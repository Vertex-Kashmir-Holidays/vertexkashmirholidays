"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";

interface Props {
  /** DELETE endpoint — the agent's or the CRM's request route. */
  endpoint: string;
  /** Where to go once deleted (the requests list). */
  redirectTo: string;
}

/** Delete a B2B request (e.g. a duplicate) — shared by the agent account page
 *  and the CRM request page; each endpoint applies its own rules. */
export function DeleteB2bRequestButton({ endpoint, redirectTo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setOpen(false);
    setDeleting(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not delete the request.");
      toast.success("Request deleted.");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the request.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={deleting}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this request?"
        description="Use this for duplicates or requests sent by mistake. The request and its itinerary are removed for good."
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
