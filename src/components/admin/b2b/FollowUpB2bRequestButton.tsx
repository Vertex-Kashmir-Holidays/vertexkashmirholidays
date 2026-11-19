"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { EmailB2bAgentsDialog } from "./EmailB2bAgentsDialog";

/** Email the agent about this one request (e.g. no update for a long time) —
 *  the request is tagged on the email and in B2B Communication history. */
export function FollowUpB2bRequestButton({
  request,
}: {
  request: { id: string; label: string; agentLabel: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted"
      >
        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Follow up
      </button>
      <EmailB2bAgentsDialog
        open={open}
        onOpenChange={setOpen}
        selected={[]}
        activeCount={0}
        request={request}
        onSent={() => router.refresh()}
      />
    </>
  );
}
