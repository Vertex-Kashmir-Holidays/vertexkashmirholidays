"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2, Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  name: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: Date | string;
  tour: { title: string; slug: string };
}

interface Props {
  initialReviews: Review[];
  totalCount: number;
  pendingCount: number;
}

export function ReviewsClient({ initialReviews, totalCount, pendingCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("PENDING");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialReviews.filter((r) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "PENDING" && !r.approved) ||
      (filter === "APPROVED" && r.approved);
    const matchesSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tour.title.toLowerCase().includes(search.toLowerCase()) ||
      r.body.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function handleApprove(id: string, approved: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        });
        if (!res.ok) throw new Error();
        toast.success(approved ? "Review approved!" : "Review rejected.");
        router.refresh();
      } catch {
        toast.error("Failed to update review.");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Review deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete review.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Reviews</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {totalCount} total · <span className="text-orange-500 font-semibold">{pendingCount} pending approval</span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { label: "Total Reviews", value: totalCount, color: "text-foreground" },
          { label: "Pending", value: pendingCount, color: "text-orange-500" },
          { label: "Approved", value: totalCount - pendingCount, color: "text-green-600 dark:text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-extrabold mt-1", color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <div className="flex gap-1.5">
            {(["ALL", "PENDING", "APPROVED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("text-xs font-bold px-3 py-2 rounded-xl transition-colors", filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted")}
              >
                {f === "ALL" ? `All (${totalCount})` : f === "PENDING" ? `Pending (${pendingCount})` : `Approved (${totalCount - pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Review cards */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No reviews in this category.</div>
          ) : (
            filtered.map((review) => (
              <div key={review.id} className={cn("p-5 hover:bg-muted/50 transition-colors", !review.approved && "border-l-2 border-l-orange-300")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-foreground">{review.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
                        <p className="text-[10px] text-muted-foreground">{review.tour.title}</p>
                      </div>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{review.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      <span className={review.approved ? "text-green-600 dark:text-green-400 font-semibold" : "text-orange-500 font-semibold"}>
                        {review.approved ? "Approved" : "Pending"}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!review.approved ? (
                      <button
                        onClick={() => handleApprove(review.id, true)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/15 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(review.id, false)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/15 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    )}

                    {confirmDelete === review.id ? (
                      <>
                        <button onClick={() => handleDelete(review.id)} disabled={isPending} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1.5 rounded-lg transition-colors">
                          {isPending ? "…" : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-muted-foreground hover:text-muted-foreground px-2 py-1.5 rounded-lg border border-border transition-colors">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(review.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
