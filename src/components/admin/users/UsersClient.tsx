"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
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

  async function handleRoleToggle(user: UserRow) {
    if (user.id === currentUserId) {
      toast.error("You cannot change your own role.");
      return;
    }
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) throw new Error();
        toast.success(`${user.name ?? user.email} is now ${newRole}.`);
        router.refresh();
      } catch {
        toast.error("Failed to update role.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-brand-navy text-xl">Users</h2>
          <p className="text-gray-400 text-xs mt-0.5">{totalCount} registered users</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition bg-gray-50/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition bg-gray-50/50"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <p className="text-xs text-gray-400 self-center shrink-0">{filtered.length} results</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-t border-b border-gray-100">
                {["User", "Role", "Bookings", "Reviews", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No users found.</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", user.role === "ADMIN" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500")}>
                          {user.role === "ADMIN" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-navy text-xs">{user.name ?? "—"}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", user.role === "ADMIN" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500")}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-brand-navy">{user._count.bookings}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-brand-navy">{user._count.reviews}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleRoleToggle(user)}
                          disabled={isPending}
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors",
                            user.role === "ADMIN"
                              ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                              : "border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5"
                          )}
                        >
                          {user.role === "ADMIN" ? "Demote" : "Make Admin"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300">You</span>
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
