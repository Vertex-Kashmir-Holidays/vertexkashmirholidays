"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, ExternalLink, Trash2, ChevronDown, Pencil, Users, CalendarClock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type LeadStatus = "NEW" | "CONNECTED" | "NOT_CONNECTED" | "QUALIFIED" | "NEGOTIATION" | "ON_HOLD" | "CONVERTED" | "REJECTED";
type LeadSource = "WEBSITE" | "MANUAL" | "GOOGLE_ADS" | "META_ADS" | "THIRD_PARTY" | "REFERRAL";
type LeadCategory = "HONEYMOON_TOUR" | "COUPLE" | "FAMILY_TOUR" | "GROUP_TOUR" | "SKI_TOUR" | "OFFBEAT_TOUR";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  category: LeadCategory | null;
  adults: number;
  status: LeadStatus;
  startDate: Date | string | null;
  followUpAt: Date | string | null;
  updatedAt: Date | string;
  negotiatedAmount: number | null;
  tokenAmount: number | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  createdAt: Date | string;
}

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
}

interface Stats {
  total: number;
  todayFollowUps: number;
  converted: number;
}

interface Props {
  initialLeads: Lead[];
  totalCount: number;
  staffUsers: StaffUser[];
  stats: Stats;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-link/10 text-link",
  CONNECTED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  NOT_CONNECTED: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  QUALIFIED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  NEGOTIATION: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ON_HOLD: "bg-muted text-muted-foreground",
  CONVERTED: "bg-green-500/15 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  MANUAL: "Manual",
  GOOGLE_ADS: "Google",
  META_ADS: "Meta",
  THIRD_PARTY: "3rd Party",
  REFERRAL: "Referral",
};

const selectCls =
  "pl-3 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50 appearance-none";

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function LeadsClient({ initialLeads, totalCount, staffUsers, stats, canCreate, canEdit, canDelete, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialLeads.filter((l) => {
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
    if (sourceFilter !== "ALL" && l.source !== sourceFilter) return false;
    if (isAdmin && assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED" && l.assignedTo !== null) return false;
      if (assigneeFilter !== "UNASSIGNED" && l.assignedTo?.id !== assigneeFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !l.name.toLowerCase().includes(q) &&
        !l.phone.includes(q) &&
        !(l.email?.toLowerCase().includes(q) ?? false)
      )
        return false;
    }
    return true;
  });

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Lead deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete lead.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Leads</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{totalCount} total leads</p>
        </div>
        {canCreate && (
          <Link
            href="/admin/leads/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Leads" value={stats.total} icon={Users} accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard label="Today's Follow-ups" value={stats.todayFollowUps} icon={CalendarClock} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatCard label="Converted" value={stats.converted} icon={TrendingUp} accent="bg-green-500/10 text-green-600 dark:text-green-400" />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>

          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
              <option value="ALL">All Status</option>
              <option value="NEW">New</option>
              <option value="CONNECTED">Connected</option>
              <option value="NOT_CONNECTED">Not Connected</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CONVERTED">Converted</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectCls}>
              <option value="ALL">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="MANUAL">Manual</option>
              <option value="GOOGLE_ADS">Google</option>
              <option value="META_ADS">Meta</option>
              <option value="THIRD_PARTY">3rd Party</option>
              <option value="REFERRAL">Referral</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {isAdmin && (
            <div className="relative">
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectCls}>
                <option value="ALL">All Staff</option>
                <option value="UNASSIGNED">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          )}

          <p className="text-xs text-muted-foreground self-center shrink-0">{filtered.length} results</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Lead", "Assigned To", "Status", "Source", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {search || statusFilter !== "ALL" || sourceFilter !== "ALL"
                      ? "No leads match your filters."
                      : "No leads yet. Create your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className={cn("hover:bg-muted/50 transition-colors", confirmDelete === lead.id && "bg-red-500/5")}>
                    {/* Lead */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate max-w-[160px]">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.phone}</p>
                        {lead.email && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{lead.email}</p>
                        )}
                      </div>
                    </td>

                    {/* Assigned To — name + email */}
                    <td className="px-4 py-3">
                      {lead.assignedTo ? (
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                            {lead.assignedTo.name ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {lead.assignedTo.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[lead.status])}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                        {SOURCE_LABELS[lead.source]}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(lead.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {confirmDelete === lead.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={isPending}
                            className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
                          >
                            {isPending ? "…" : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View detail"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/admin/leads/${lead.id}/edit`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(lead.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
