"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import {
  B2bRequestFormDialog,
  b2bRequestError,
  b2bRequestPayload,
  type B2bRequestForm,
} from "./B2bRequestFormDialog";

interface Props {
  requestId: string;
  initial: B2bRequestForm;
}

/** Edit an existing B2B request's guest and trip details (admin request page). */
export function EditB2bRequestButton({ requestId, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSave(form: B2bRequestForm): Promise<string | null> {
    const res = await fetch(`/api/admin/b2b-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b2bRequestPayload(form)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return b2bRequestError(data, "Could not update request.");
    toast.success("Request updated.");
    setOpen(false);
    router.refresh();
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit request
      </button>
      <B2bRequestFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit Request"
        submitLabel="Save Changes"
        initial={initial}
        onSubmit={handleSave}
      />
    </>
  );
}
