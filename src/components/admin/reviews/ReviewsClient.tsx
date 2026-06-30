"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2, Star, Search, Plus, Pencil, X, Loader2, Images } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { usePagination } from "@/components/admin/ui/usePagination";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: Date | string;
  tour: { title: string; slug: string };
  user: { image: string | null } | null;
}

interface TourOption {
  id: string;
  title: string;
}

interface Props {
  initialReviews: Review[];
  totalCount: number;
  pendingCount: number;
  tours: TourOption[];
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Draft used by both the "add" and "edit" modal. tourId only applies to new
// reviews (editing never moves a review to a different tour).
interface ReviewDraft {
  id: string | null;
  tourId: string;
  name: string;
  avatar: string;
  // The reviewer's account picture, shown as the fallback when no per-review
  // avatar is set. Read-only context for the admin.
  userImage: string | null;
  rating: number;
  body: string;
  approved: boolean;
}

// Clickable 1-5 star selector for the modal.
function RatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        return (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="transition hover:scale-110">
            <Star className={cn("h-6 w-6", n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewsClient({ initialReviews, totalCount, pendingCount, tours, isAdmin, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  // Default to ALL so every review (admin-added and customer-submitted) is
  // visible at a glance; admins can still filter to the pending queue.
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

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

  const { page, setPage, pageSize, changePageSize, pageCount, total, pageItems } = usePagination(filtered);

  async function handleApprove(id: string, approved: boolean) {
    if (!canEdit) { toast.error("You don't have permission to approve reviews. Contact your administrator."); return; }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        });
        if (res.status === 403) { toast.error("You don't have permission to approve reviews. Contact your administrator."); return; }
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
        if (res.status === 403) { toast.error("You don't have permission to delete reviews. Contact your administrator."); return; }
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

  function openAdd() {
    // Non-admins can add a review but cannot publish it — it goes to the
    // pending queue for an admin to approve.
    setDraft({ id: null, tourId: "", name: "", avatar: "", userImage: null, rating: 5, body: "", approved: isAdmin });
  }

  function openEdit(r: Review & { tourId?: string }) {
    setDraft({
      id: r.id,
      tourId: r.tourId ?? "",
      name: r.name,
      avatar: r.avatar ?? "",
      userImage: r.user?.image ?? null,
      rating: r.rating,
      body: r.body,
      approved: r.approved,
    });
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDraft((d) => (d ? { ...d, avatar: data.url } : d));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.id && !draft.tourId) return toast.error("Select a tour.");
    if (draft.name.trim().length < 2) return toast.error("Name must be at least 2 characters.");
    if (draft.rating < 1) return toast.error("Choose a rating.");
    if (draft.body.trim().length < 10) return toast.error("Review must be at least 10 characters.");

    startTransition(async () => {
      try {
        const isNew = !draft.id;
        const url = isNew ? "/api/reviews" : `/api/reviews/${draft.id}`;
        const payload = isNew
          ? { tourId: draft.tourId, name: draft.name.trim(), avatar: draft.avatar.trim(), rating: draft.rating, body: draft.body.trim(), approved: draft.approved }
          : { name: draft.name.trim(), avatar: draft.avatar.trim(), rating: draft.rating, body: draft.body.trim(), approved: draft.approved };
        const res = await fetch(url, {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(typeof data.error === "string" ? data.error : "Failed to save review.");
        }
        toast.success(isNew ? "Review added." : "Review updated.");
        setDraft(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save review.");
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
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add Review
        </button>
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
            pageItems.map((review) => (
              <div key={review.id} className={cn("p-5 hover:bg-muted/50 transition-colors", !review.approved && "border-l-2 border-l-orange-300")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {(() => {
                        const src = review.avatar ?? review.user?.image ?? null;
                        return src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-foreground">{review.name.charAt(0).toUpperCase()}</span>
                          </div>
                        );
                      })()}
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
                    {isAdmin && canEdit && (!review.approved ? (
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
                    ))}

                    {canEdit && (
                      <button
                        onClick={() => openEdit(review)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && (confirmDelete === review.id ? (
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
                    ))}
                  </div>
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
          noun="reviews"
        />
      </div>

      {/* Add / edit modal */}
      {draft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDraft(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-foreground">
                {draft.id ? "Edit review" : "Add review"}
              </h3>
              <button onClick={() => setDraft(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!draft.id && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tour</label>
                  <select
                    value={draft.tourId}
                    onChange={(e) => setDraft({ ...draft, tourId: e.target.value })}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">Select a tour…</option>
                    {tours.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Reviewer name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  maxLength={100}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Reviewer picture</label>
                <div className="flex items-center gap-3">
                  {(() => {
                    const preview = draft.avatar || draft.userImage || "";
                    return (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 m-auto grid place-items-center text-sm font-bold text-muted-foreground">
                            {draft.name.charAt(0).toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvatarPickerOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                    >
                      <Images className="h-3.5 w-3.5" />
                      Gallery
                    </button>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted">
                      {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                    </label>
                    {draft.avatar && (
                      <button type="button" onClick={() => setDraft({ ...draft, avatar: "" })} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {draft.avatar
                    ? "Custom picture set for this review."
                    : draft.userImage
                      ? "Using the customer's profile picture. Upload to override."
                      : "No picture — set a default one here."}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Rating</label>
                <RatingInput value={draft.rating} onChange={(n) => setDraft({ ...draft, rating: n })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Review</label>
                <textarea
                  rows={4}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={draft.approved}
                    onChange={(e) => setDraft({ ...draft, approved: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  Approved (visible on the public site)
                </label>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={saveDraft}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {draft.id ? "Save changes" : "Add review"}
                </button>
                <button onClick={() => setDraft(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery picker for the reviewer avatar (rendered above the modal). */}
      <GalleryPicker
        open={avatarPickerOpen}
        type="IMAGE"
        title="Choose a reviewer picture from gallery"
        onSelect={(url) => setDraft((d) => (d ? { ...d, avatar: url } : d))}
        onClose={() => setAvatarPickerOpen(false)}
      />
    </div>
  );
}
