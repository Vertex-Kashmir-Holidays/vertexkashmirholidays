"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  Copy,
  FileText,
  Phone,
  IndianRupee,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/atoms/badge";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { useServerPagedList } from "@/components/admin/ui/useServerPagedList";
import type { ItinerarySummary, ItineraryStatus } from "@/types/itinerary";

const STATUSES: ("ALL" | ItineraryStatus)[] = ["ALL", "DRAFT", "SENT", "CONFIRMED"];

const STATUS_VARIANT: Record<ItineraryStatus, BadgeProps["variant"]> = {
  DRAFT: "default",
  SENT: "warning",
  CONFIRMED: "success",
};

interface Props {
  /** First page of results, rendered by the server. */
  initialItems: ItinerarySummary[];
  /** Total itineraries visible to this user, across all pages. */
  initialTotal: number;
  showOwner: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function ItineraryListClient({ initialItems, initialTotal, showOwner, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { items, total, page, setPage, pageSize, changePageSize, pageCount, loading, reload } =
    useServerPagedList<ItinerarySummary>({
      endpoint: "/api/itineraries",
      itemsKey: "itineraries",
      initialItems,
      initialTotal,
      search,
      filters: { status: statusFilter },
    });

  function remove(item: ItinerarySummary) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/itineraries/${item.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Itinerary deleted.");
        setConfirmDelete(null);
        router.refresh();
        reload();
      } catch {
        toast.error("Failed to delete.");
      }
    });
  }

  function duplicate(item: ItinerarySummary) {
    startTransition(async () => {
      try {
        // Created as "<title> - copy"; the editor makes the user rename it
        // (customer name/phone) or deletes it on leave — see UntouchedCopyGuard.
        const res = await fetch("/api/itineraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ copyOf: item.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        toast.success("Itinerary copied — update the customer name or phone, then save.");
        router.push(`/admin/itinerary/${json.id}`);
      } catch {
        toast.error("Failed to duplicate.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Itineraries</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {initialTotal} saved {initialTotal === 1 ? "itinerary" : "itineraries"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/itinerary/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Itinerary
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, customer name or phone…"
              className="w-full rounded-xl border border-border bg-muted/50 py-2 pl-9 pr-4 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUSES)[number])}
            className="rounded-xl border border-border bg-muted/50 py-2 pl-4 pr-8 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            {STATUSES.map((sVal) => (
              <option key={sVal} value={sVal}>
                {sVal === "ALL" ? "All Statuses" : sVal}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`divide-y divide-border border-t border-border transition-opacity ${loading ? "opacity-60" : ""}`}
          aria-busy={loading}
        >
          {items.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No itineraries yet.</p>
              {canCreate && (
                <Link
                  href="/admin/itinerary/new"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Create your first itinerary
                </Link>
              )}
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/admin/itinerary/${item.id}`} className="min-w-0 flex-1 group">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">
                      {item.title}
                    </p>
                    <Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge>
                  </div>
                  {(item.customerName || item.customerPhone || item.totalCost) && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-foreground/85">
                      {item.customerName && <span>{item.customerName}</span>}
                      {item.customerPhone && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Phone className="h-3.5 w-3.5" />
                          {item.customerPhone}
                        </span>
                      )}
                      {item.totalCost && (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold">{item.totalCost}</span>
                        </span>
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {showOwner && item.ownerName ? `${item.ownerName} · ` : ""}
                    Updated{" "}
                    {new Date(item.updatedAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5">
                  {item.customerPhone && (
                    <a
                      href={`tel:${item.customerPhone.replace(/[^\d+]/g, "")}`}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      aria-label={`Call ${item.customerName || "customer"}`}
                      title={`Call ${item.customerPhone}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    href={`/admin/itinerary/${item.id}`}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                    aria-label={canEdit ? "Edit" : "View"}
                  >
                    {canEdit ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Link>
                  {/* A copy must be edited and saved, or it's deleted — so all three. */}
                  {canCreate && canEdit && canDelete && (
                    <button
                      onClick={() => duplicate(item)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && item.linked && (
                    <span
                      className="rounded-lg p-2 text-muted-foreground/40"
                      aria-label="Linked to a lead/booking — can't be deleted"
                      title="Linked to a lead/booking — can't be deleted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  )}
                  {canDelete &&
                    !item.linked &&
                    (confirmDelete === item.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => remove(item)}
                          disabled={isPending}
                          className="rounded-lg bg-red-600 px-2 py-1 text-[12px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border border-border px-2 py-1 text-[12px] font-semibold text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
          onPage={setPage}
          onPageSize={changePageSize}
          noun="itineraries"
        />
      </div>
    </div>
  );
}
