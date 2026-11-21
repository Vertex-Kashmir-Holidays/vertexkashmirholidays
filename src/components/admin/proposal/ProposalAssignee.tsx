"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, UserCheck } from "lucide-react";

export interface AssigneeOption {
  id: string;
  name: string | null;
  email: string;
}

// "Assigned to" picker for a proposal — saves on change (like a lead's
// assignee). The owner and the assignee both see the proposal; admins see all.
export function ProposalAssignee({
  proposalId,
  ownerName,
  initialAssigneeId,
  staff,
  apiBasePath = "/api/proposals",
}: {
  proposalId: string;
  ownerName: string | null;
  initialAssigneeId: string | null;
  staff: AssigneeOption[];
  apiBasePath?: string;
}) {
  const [assigneeId, setAssigneeId] = useState(initialAssigneeId ?? "");
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const prev = assigneeId;
    setAssigneeId(next);
    setSaving(true);
    try {
      const res = await fetch(`${apiBasePath}/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: next || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not change the assignee");
      }
      const who = staff.find((u) => u.id === next);
      toast.success(next ? `Assigned to ${who?.name ?? who?.email ?? "staff"}` : "Unassigned");
    } catch (err) {
      setAssigneeId(prev);
      toast.error(err instanceof Error ? err.message : "Could not change the assignee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 no-print sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        <UserCheck className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">
          Created by <span className="font-semibold text-foreground">{ownerName ?? "—"}</span>
        </span>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="shrink-0 font-semibold text-muted-foreground">Assigned to</span>
        <span className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
          <select
            value={assigneeId}
            onChange={(e) => void change(e.target.value)}
            disabled={saving}
            className="w-full appearance-none rounded-lg border border-border bg-background py-1.5 pl-2.5 pr-8 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 max-md:text-[16px]"
          >
            <option value="">Not assigned</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
          {saving ? (
            <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          )}
        </span>
      </label>
    </div>
  );
}
