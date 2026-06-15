"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

interface Booking {
  id: string;
  razorpayOrderId: string;
  razorpayPayId: string | null;
  status: BookingStatus;
  amount: number;
  travelDate: Date | string;
  travellers: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  createdAt: Date | string;
  tour: { title: string; slug: string; coverImage: string | null };
  user: { name: string | null; email: string } | null;
}

interface Props {
  initialBookings: Booking[];
  totalCount: number;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  PAID: "bg-green-500/15 text-green-700 dark:text-green-300",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["REFUNDED", "CANCELLED"],
  FAILED: ["CANCELLED"],
  CANCELLED: [],
  REFUNDED: [],
};

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function BookingsClient({ initialBookings, totalCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = initialBookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesSearch =
      search === "" ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.razorpayOrderId.toLowerCase().includes(search.toLowerCase()) ||
      b.tour.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  async function handleStatusChange(id: string, status: BookingStatus) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Booking marked as ${status.toLowerCase()}.`);
        router.refresh();
        setSelected(null);
      } catch {
        toast.error("Failed to update booking status.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Bookings</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{totalCount} total bookings</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, order ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50 appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-xs text-muted-foreground self-center shrink-0">{filtered.length} results</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Guest", "Tour", "Travel Date", "Pax", "Amount", "Status", "Booked", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const transitions = ALLOWED_TRANSITIONS[b.status];
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(selected?.id === b.id ? null : b)}
                      className={cn("hover:bg-muted/50 transition-colors cursor-pointer", selected?.id === b.id && "bg-primary/5 border-l-2 border-l-primary")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs truncate max-w-[120px]">{b.guestName}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{b.guestEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{b.tour.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(b.travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.travellers}</td>
                      <td className="px-4 py-3 text-xs font-bold text-foreground whitespace-nowrap">{fmtINR(b.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status])}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        {transitions.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {transitions.map((s) => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(b.id, s); }}
                                disabled={isPending}
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors",
                                  s === "REFUNDED" ? "border-purple-200 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10" : "border-border text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Booking Detail</h3>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selected.razorpayOrderId}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-muted-foreground text-xs">✕ Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div><p className="text-muted-foreground mb-0.5">Guest</p><p className="font-semibold text-foreground">{selected.guestName}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Email</p><p className="font-semibold text-foreground">{selected.guestEmail}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Phone</p><p className="font-semibold text-foreground">{selected.guestPhone}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Tour</p><p className="font-semibold text-foreground">{selected.tour.title}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Travel Date</p><p className="font-semibold text-foreground">{new Date(selected.travelDate).toLocaleDateString("en-IN")}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Travellers</p><p className="font-semibold text-foreground">{selected.travellers}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Amount</p><p className="font-bold text-foreground">{fmtINR(selected.amount)}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Payment ID</p><p className="font-mono text-foreground text-[10px]">{selected.razorpayPayId ?? "—"}</p></div>
            <div>
              <p className="text-muted-foreground mb-0.5">Status</p>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[selected.status])}>{selected.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
