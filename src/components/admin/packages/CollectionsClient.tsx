"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  sortOrder: number;
  publishedTourCount: number;
  tourCount: number;
}

interface Props {
  collections: Collection[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function CollectionsClient({ collections, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tour-collections/${id}`, { method: "DELETE" });
        if (res.status === 403) {
          toast.error("You don't have permission to delete collections.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success("Collection deleted. Its tours are unaffected.");
        router.refresh();
      } catch {
        toast.error("Failed to delete collection.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/packages" className="hover:text-primary transition-colors">
              Packages
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Tour Collections</li>
        </ol>
      </nav>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Tour Collections</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Top-level landing pages (e.g. /kashmir-tour-packages) listing every published tour
            assigned to them. Assign tours from each tour&apos;s edit form.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/packages/collections/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </Link>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["Collection", "Tours", "Status", "Order", "Actions"].map((h) => (
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
            {collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No collections yet.
                </td>
              </tr>
            ) : (
              collections.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground text-xs">{c.name}</p>
                    <a
                      href={`/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-muted-foreground hover:text-primary"
                    >
                      /{c.slug} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">
                    {c.publishedTourCount} published
                    {c.tourCount > c.publishedTourCount && (
                      <span className="text-muted-foreground"> / {c.tourCount} total</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-bold",
                        c.published && c.publishedTourCount > 0
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {c.published
                        ? c.publishedTourCount > 0
                          ? "Live"
                          : "Published · no tours (404)"
                        : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    {confirmDelete === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                          className="text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg"
                        >
                          {isPending ? "…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[12px] font-bold text-muted-foreground px-2 py-1 rounded-lg border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Link
                            href={`/admin/packages/collections/${c.id}/edit`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(c.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
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
  );
}
