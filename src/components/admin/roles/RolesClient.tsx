"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock } from "lucide-react";
import { ACTIONS, MODULES, type Action, type ModuleKey, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type ModulePerms = Record<Action, boolean>;
export type RoleMatrix = Record<string, Record<string, ModulePerms>>;

interface Props {
  roles: Role[];
  initialMatrix: RoleMatrix;
  canEdit: boolean;
}

const ROLE_BLURB: Record<string, string> = {
  ADMIN: "Full operational access across the panel.",
  SALES: "Manages bookings and customers.",
  EDITOR: "Manages content — packages, blogs, galleries, SEO.",
};

export function RolesClient({ roles, initialMatrix, canEdit }: Props) {
  const [activeRole, setActiveRole] = useState<Role>(roles[0]);
  const [matrix, setMatrix] = useState<RoleMatrix>(initialMatrix);
  const [isPending, startTransition] = useTransition();

  function toggle(module: ModuleKey, action: Action) {
    if (!canEdit) {
      toast.error("You don't have permission to edit roles.");
      return;
    }

    const current = matrix[activeRole][module];
    const next: ModulePerms = { ...current, [action]: !current[action] };

    // Granting any action implies view; revoking view revokes everything.
    if (action !== "view" && next[action]) next.view = true;
    if (action === "view" && !next.view) {
      next.create = false;
      next.edit = false;
      next.delete = false;
    }

    const prevMatrix = matrix;
    setMatrix({
      ...matrix,
      [activeRole]: { ...matrix[activeRole], [module]: next },
    });

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/role-permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: activeRole,
            module,
            canView: next.view,
            canCreate: next.create,
            canEdit: next.edit,
            canDelete: next.delete,
          }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setMatrix(prevMatrix); // roll back optimistic update
        toast.error("Failed to save permission.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Roles &amp; Permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Control which modules each role can view and what actions they can perform.
            <span className="ml-1 inline-flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" /> Super Admin always has full access.
            </span>
          </p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
              activeRole === r
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{ROLE_BLURB[activeRole]}</p>

      {/* Permissions matrix */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-4 py-3 text-center font-semibold capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                {ACTIONS.map((a) => (
                  <td key={a} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                      checked={matrix[activeRole][m.key][a]}
                      disabled={!canEdit || isPending}
                      onChange={() => toggle(m.key, a)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!canEdit && (
        <p className="text-xs text-muted-foreground">You have read-only access to this page.</p>
      )}
    </div>
  );
}
