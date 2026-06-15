"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStaff, type Role } from "@/lib/rbac";

const ROLE_OPTIONS: Role[] = ["SUPERADMIN", "ADMIN", "SALES", "EDITOR", "CUSTOMER"];

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date | string;
  _count: { bookings: number; reviews: number };
}

interface Props {
  initialUsers: UserRow[];
  totalCount: number;
  currentUserId: string;
}

export function UsersClient({ initialUsers, totalCount, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filtered = initialUsers.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesSearch =
      search === "" ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  function handleRoleChange(user: UserRow, newRole: Role) {
    if (user.id === currentUserId) {
      toast.error("You cannot change your own role.");
      return;
    }
    if (newRole === user.role) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error);
        }
        toast.success(`${user.name ?? user.email} is now ${newRole}.`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error && err.message ? err.message : "Failed to update role.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Users</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{totalCount} registered users</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-4 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground self-center shrink-0">{filtered.length} results</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["User", "Role", "Bookings", "Reviews", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">No users found.</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isStaff(user.role) ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                          {isStaff(user.role) ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs">{user.name ?? "—"}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isStaff(user.role) ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{user._count.bookings}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{user._count.reviews}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      {user.id !== currentUserId ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                          disabled={isPending}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">You</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
