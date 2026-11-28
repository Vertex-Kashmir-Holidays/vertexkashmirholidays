"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  B2bRequestFormDialog,
  EMPTY_B2B_REQUEST_FORM,
  b2bRequestError,
  b2bRequestPayload,
  type B2bRequestForm,
} from "./B2bRequestFormDialog";

interface Props {
  agentId: string;
  agentLabel: string;
}

/**
 * Create a request for one already-known agent (no agent picker) — used from
 * the agency detail panel on the B2B Agents list.
 */
export function NewB2bRequestForAgentButton({ agentId, agentLabel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleCreate(form: B2bRequestForm): Promise<string | null> {
    const res = await fetch("/api/admin/b2b-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, ...b2bRequestPayload(form) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return b2bRequestError(data, "Could not create request.");
    toast.success("B2B request created.");
    setOpen(false);
    router.refresh();
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110"
      >
        <Plus className="h-3.5 w-3.5" /> New Request
      </button>
      <B2bRequestFormDialog
        open={open}
        onOpenChange={setOpen}
        title={`New Request — ${agentLabel}`}
        submitLabel="Create Request"
        initial={EMPTY_B2B_REQUEST_FORM}
        onSubmit={handleCreate}
      />
    </>
  );
}
