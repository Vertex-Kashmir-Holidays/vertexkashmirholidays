"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Trash2, Phone, Mail, Calendar, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type InquiryStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
const STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  CONTACTED: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  CONVERTED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  CLOSED: "bg-muted text-muted-foreground",
};

interface InquiryRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  travelDate: Date | string | null;
  travellers: number | null;
  message: string | null;
  source: string | null;
  status: InquiryStatus;
  createdAt: Date | string;
}

interface Props {
  initialItems: InquiryRow[];
  totalCount: number;
  sources: string[];
  canEdit: boolean;
  canDelete: boolean;
}

export function InquiriesClient({ initialItems, totalCount, sources, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialItems.filter((i) => {
    const matchesSource = sourceFilter === "ALL" || (i.source ?? "website") === sourceFilter;
    const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
    const matchesSearch =
      search === "" ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search) ||
      (i.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesSource && matchesStatus && matchesSearch;
  });

  function updateStatus(item: InquiryRow, status: InquiryStatus) {
    if (status === item.status) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/inquiries/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Marked ${item.name} as ${status}.`);
        router.refresh();
      } catch {
        toast.error("Failed to update status.");
      }
    });
  }

  function remove(item: InquiryRow) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/inquiries/${item.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Inquiry deleted.");
        setConfirmDelete(null);
        router.refresh();
      } catch {
        toast.error("Failed to delete inquiry.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-extrabold text-foreground">Inquiries</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{totalCount} total leads &amp; submissions</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email..."
              className="w-full rounded-xl border border-border bg-muted/50 py-2 pl-9 pr-4 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 py-2 pl-4 pr-8 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="ALL">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 py-2 pl-4 pr-8 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="shrink-0 self-center text-xs text-muted-foreground">{filtered.length} results</p>
        </div>

        <div className="divide-y divide-border border-t border-border">
          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No inquiries found.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_STYLES[item.status])}>
                      {item.status}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {item.source ?? "website"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a href={`tel:${item.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" /> {item.phone}
                    </a>
                    {item.email && (
                      <a href={`mailto:${item.email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3 w-3" /> {item.email}
                      </a>
                    )}
                    {item.travelDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {item.travellers != null && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" /> {item.travellers}
                      </span>
                    )}
                  </div>
                  {item.message && <p className="mt-1.5 text-xs text-muted-foreground">{item.message}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item, e.target.value as InquiryStatus)}
                    disabled={!canEdit || isPending}
                    className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {canDelete && (
                    confirmDelete === item.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => remove(item)}
                          disabled={isPending}
                          className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="text-muted-foreground transition hover:text-red-500 dark:text-red-400"
                        aria-label="Delete inquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
