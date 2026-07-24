"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle2, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/atoms/tooltip";
import { EmptyState } from "@/components/ui/molecules/empty-state";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { InlineConfirmActions } from "@/components/ui/organisms/inline-confirm-actions";

interface FaqRow {
  id: string;
  question: string;
  slug: string;
  status: string;
  featured: boolean;
  placements: string[];
  sortOrder: number;
  category: { name: string } | null;
  _count: {
    tours: number;
    destinations: number;
    blogs: number;
    campaigns: number;
    activities: number;
  };
}

interface Props {
  initialFaqs: FaqRow[];
  categoryOptions: { id: string; name: string }[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const PAGE_SIZE = 50;

export function FaqsClient({ initialFaqs, categoryOptions, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialFaqs.filter((f) => {
      if (search && !f.question.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && f.category?.name !== categoryFilter) return false;
      return true;
    });
  }, [initialFaqs, search, statusFilter, categoryFilter]);

  const visible = filtered.slice(0, visibleCount);

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
        if (res.status === 403) {
          toast.error("You don't have permission to delete FAQs. Contact your administrator.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success("FAQ deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete FAQ.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  async function handleToggleStatus(id: string, status: string) {
    const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/faqs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (res.status === 403) {
          toast.error("You don't have permission to change status. Contact your administrator.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success(next === "PUBLISHED" ? "FAQ published!" : "FAQ unpublished.");
        router.refresh();
      } catch {
        toast.error("Failed to update status.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="FAQs"
        description={`Single source of truth for FAQ content sitewide — ${initialFaqs.length} total.`}
        action={
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/faq-categories"
              className="flex items-center gap-2 border border-border hover:bg-muted text-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Manage Categories
            </Link>
            {canCreate && (
              <Link
                href="/admin/faqs/new"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25"
              >
                <Plus className="w-4 h-4" />
                New FAQ
              </Link>
            )}
          </div>
        }
      />

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <AdminSearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search questions..."
            className="min-w-[200px] max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setVisibleCount(PAGE_SIZE);
            }}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="ALL">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground shrink-0 ml-auto">
            {filtered.length} of {initialFaqs.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Question", "Category", "Attached To", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title={
                        search || statusFilter !== "ALL" || categoryFilter !== "ALL"
                          ? "No FAQs match your filters."
                          : "No FAQs yet."
                      }
                    />
                  </td>
                </tr>
              ) : (
                visible.map((faq) => {
                  const attachedCount =
                    faq._count.tours +
                    faq._count.destinations +
                    faq._count.blogs +
                    faq._count.campaigns +
                    faq._count.activities;
                  return (
                    <tr key={faq.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="min-w-0 flex items-center gap-1.5">
                          {faq.featured && (
                            <Star className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs leading-tight truncate max-w-[280px]">
                              {faq.question}
                            </p>
                            <p className="text-[12px] text-muted-foreground truncate">
                              /faq#{faq.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {faq.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {faq.placements.length > 0 &&
                          `${faq.placements.length} page${faq.placements.length === 1 ? "" : "s"}`}
                        {faq.placements.length > 0 && attachedCount > 0 && " · "}
                        {attachedCount > 0 &&
                          `${attachedCount} record${attachedCount === 1 ? "" : "s"}`}
                        {faq.placements.length === 0 && attachedCount === 0 && "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => canEdit && handleToggleStatus(faq.id, faq.status)}
                          disabled={isPending || !canEdit}
                          className="focus:outline-none"
                          title={
                            !canEdit
                              ? "No permission to change status"
                              : faq.status === "PUBLISHED"
                                ? "Click to unpublish"
                                : "Click to publish"
                          }
                        >
                          {faq.status === "PUBLISHED" ? (
                            <span className="flex items-center gap-1 text-[12px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full hover:bg-green-500/15 transition-colors">
                              <CheckCircle2 className="w-3 h-3" /> Published
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:bg-muted transition-colors">
                              <Clock className="w-3 h-3" /> Draft
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <InlineConfirmActions
                          confirming={confirmDelete === faq.id}
                          onConfirm={() => handleDelete(faq.id)}
                          onCancel={() => setConfirmDelete(null)}
                          pending={isPending}
                        >
                          {canEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/admin/faqs/${faq.id}/edit`}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setConfirmDelete(faq.id)}
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors",
                                  )}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[12px] text-muted-foreground italic">View only</span>
                          )}
                        </InlineConfirmActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > visible.length && (
          <div className="p-4 flex justify-center border-t border-border">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more ({visible.length} of{" "}
              {filtered.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
