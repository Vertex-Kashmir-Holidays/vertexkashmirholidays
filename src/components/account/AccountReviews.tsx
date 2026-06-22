"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Pencil, Trash2, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: string;
  tourTitle: string;
}

interface ReviewableTour {
  id: string;
  title: string;
}

interface Props {
  reviews: ReviewRow[];
  reviewableTours: ReviewableTour[];
}

// Clickable 1-5 star selector.
function StarInput({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="transition hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star className={cn("h-6 w-6", n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        );
      })}
    </div>
  );
}

function StarsRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </div>
  );
}

export function AccountReviews({ reviews, reviewableTours }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add-review form state
  const [adding, setAdding] = useState(false);
  const [newTourId, setNewTourId] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newBody, setNewBody] = useState("");

  // Edit state (per review)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editBody, setEditBody] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function resetAdd() {
    setAdding(false);
    setNewTourId("");
    setNewRating(0);
    setNewBody("");
  }

  function submitNew() {
    if (!newTourId) return toast.error("Pick a tour to review.");
    if (newRating < 1) return toast.error("Please choose a star rating.");
    if (newBody.trim().length < 10) return toast.error("Review must be at least 10 characters.");
    startTransition(async () => {
      try {
        const res = await fetch("/api/account/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tourId: newTourId, rating: newRating, body: newBody.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not submit review.");
        toast.success(data.message ?? "Review submitted.");
        resetAdd();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not submit review.");
      }
    });
  }

  function startEdit(r: ReviewRow) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditBody(r.body);
    setConfirmDelete(null);
  }

  function submitEdit(id: string) {
    if (editRating < 1) return toast.error("Please choose a star rating.");
    if (editBody.trim().length < 10) return toast.error("Review must be at least 10 characters.");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/account/reviews/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: editRating, body: editBody.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not update review.");
        toast.success(data.message ?? "Review updated.");
        setEditingId(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update review.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/account/reviews/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Review deleted.");
        router.refresh();
      } catch {
        toast.error("Could not delete review.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  const inputCls =
    "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold text-foreground">My Reviews</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Share your experience on tours you&apos;ve travelled with us.
          </p>
        </div>
        {reviewableTours.length > 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Write a review
          </button>
        )}
      </div>

      {/* Add review form */}
      {adding && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Write a review</h2>
            <button onClick={resetAdd} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tour</label>
              <select value={newTourId} onChange={(e) => setNewTourId(e.target.value)} className={inputCls}>
                <option value="">Select a tour…</option>
                {reviewableTours.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Rating</label>
              <StarInput value={newRating} onChange={setNewRating} disabled={isPending} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Your review</label>
              <textarea
                rows={4}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                maxLength={2000}
                placeholder="Tell other travellers about your experience…"
                className={cn(inputCls, "resize-none")}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">{newBody.trim().length}/2000 · minimum 10 characters</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={submitNew}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Submit review
              </button>
              <button onClick={resetAdd} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing reviews */}
      {reviews.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-14 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold text-foreground">No reviews yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {reviewableTours.length > 0
              ? "Write a review for a tour you've travelled on."
              : "You can review a tour once your booking is confirmed."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const isEditing = editingId === r.id;
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{r.tourTitle}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      <span className={r.approved ? "font-semibold text-green-600 dark:text-green-400" : "font-semibold text-amber-600 dark:text-amber-400"}>
                        {r.approved ? "Published" : "Pending review"}
                      </span>
                    </p>
                  </div>
                  {!isEditing && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => startEdit(r)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      {confirmDelete === r.id ? (
                        <>
                          <button onClick={() => handleDelete(r.id)} disabled={isPending} className="rounded-lg bg-red-500 px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-600">
                            {isPending ? "…" : "Confirm"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-border px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(r.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <StarInput value={editRating} onChange={setEditRating} disabled={isPending} />
                    <textarea
                      rows={4}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={2000}
                      className={cn(inputCls, "resize-none")}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Editing re-submits your review for moderation before it shows publicly again.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => submitEdit(r.id)}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <StarsRow rating={r.rating} />
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
