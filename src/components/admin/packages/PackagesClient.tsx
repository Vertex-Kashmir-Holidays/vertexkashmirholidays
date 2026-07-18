"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Star,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tour {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration: number;
  priceFrom: number;
  rating: number;
  reviewCount: number;
  published: boolean;
  bestseller: boolean;
  createdAt: Date | string;
  coverImage: string | null;
}

const CATEGORY_STYLES: Record<string, string> = {
  HONEYMOON: "bg-pink-100 text-pink-700",
  FAMILY: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  ADVENTURE: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  LUXURY: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
};

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYyNjVjIi8+PC9zdmc+";

interface PackagesClientProps {
  initialTours: Tour[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function PackagesClient({
  initialTours,
  canCreate,
  canEdit,
  canDelete,
}: PackagesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialTours.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tours/${id}`, { method: "DELETE" });
        if (res.status === 403) {
          toast.error("You don't have permission to delete packages. Contact your administrator.");
          return;
        }
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Package deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete package.");
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
          <h2 className="font-display font-extrabold text-foreground text-xl">Packages (Tours)</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Manage all packages, itineraries and pricing
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/packages/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Package
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50 appearance-none"
            >
              <option value="ALL">All Categories</option>
              <option value="HONEYMOON">Honeymoon</option>
              <option value="FAMILY">Family</option>
              <option value="ADVENTURE">Adventure</option>
              <option value="LUXURY">Luxury</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <p className="text-xs text-muted-foreground self-center shrink-0">
            Showing {filtered.length} of {initialTours.length}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {[
                  "Tour",
                  "Category",
                  "Duration",
                  "Price",
                  "Rating",
                  "Status",
                  "Date",
                  "Actions",
                ].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {search || categoryFilter !== "ALL"
                      ? "No packages match your filters."
                      : "No packages yet. Create your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((tour) => (
                  <tr
                    key={tour.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      confirmDelete === tour.id && "bg-red-500/10/30",
                    )}
                  >
                    {/* Tour */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="relative w-10 h-8 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={tour.coverImage ?? PLACEHOLDER}
                            alt={tour.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-tight truncate max-w-[160px]">
                            {tour.title}
                          </p>
                          <p className="text-[12px] text-muted-foreground truncate">
                            /tours/{tour.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[12px] font-bold px-2 py-0.5 rounded-full",
                          CATEGORY_STYLES[tour.category] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {CATEGORY_LABELS[tour.category] ?? tour.category}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {tour.duration}D
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-xs font-bold text-foreground whitespace-nowrap">
                      ₹{tour.priceFrom.toLocaleString("en-IN")}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        <span className="text-xs font-semibold text-foreground">
                          {tour.rating > 0 ? tour.rating.toFixed(1) : "—"}
                        </span>
                        {tour.reviewCount > 0 && (
                          <span className="text-[12px] text-muted-foreground">
                            ({tour.reviewCount})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {tour.published ? (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tour.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {confirmDelete === tour.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(tour.id)}
                            disabled={isPending}
                            className="text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
                          >
                            {isPending ? "…" : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[12px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <Link
                              href={`/admin/packages/${tour.id}/edit`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(tour.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[12px] text-muted-foreground italic">
                              View only
                            </span>
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
