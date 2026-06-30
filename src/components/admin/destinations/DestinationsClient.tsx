"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Destination {
  id: string;
  name: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  location: string | null;
  createdAt: Date | string;
  _count?: { tours: number };
}

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYyNjVjIi8+PC9zdmc+";

interface Props {
  initialDestinations: Destination[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function DestinationsClient({ initialDestinations, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialDestinations.filter(
    (d) =>
      search === "" ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
        if (res.status === 403) { toast.error("You don't have permission to delete destinations. Contact your administrator."); return; }
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Destination deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete destination.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Destinations</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Manage Kashmir destinations and their content</p>
        </div>
        {canCreate && (
          <Link
            href="/admin/destinations/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Destination
          </Link>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {filtered.length} of {initialDestinations.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Destination", "Location", "Tours", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {search ? "No destinations match your search." : "No destinations yet. Create your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((dest) => (
                  <tr key={dest.id} className={cn("hover:bg-muted/50 transition-colors", confirmDelete === dest.id && "bg-red-500/10/30")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="relative w-10 h-8 rounded-lg overflow-hidden shrink-0">
                          <Image src={dest.coverImage ?? PLACEHOLDER} alt={dest.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-tight truncate max-w-[160px]">{dest.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">/destinations/{dest.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{dest.location ?? "—"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {dest._count?.tours ?? 0}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(dest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>

                    <td className="px-4 py-3">
                      {confirmDelete === dest.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(dest.id)}
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
                          {canEdit && (
                            <Link
                              href={`/admin/destinations/${dest.id}/edit`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(dest.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[10px] text-muted-foreground italic">View only</span>
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
