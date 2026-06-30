"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  published: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  coverImage: string | null;
}

interface Props {
  initialBlogs: Blog[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function BlogsClient({ initialBlogs, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = initialBlogs.filter(
    (b) =>
      search === "" ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
        if (res.status === 403) { toast.error("You don't have permission to delete posts. Contact your administrator."); return; }
        if (!res.ok) throw new Error();
        toast.success("Blog post deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete blog post.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  async function handleTogglePublish(id: string, published: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !published }),
        });
        if (res.status === 403) { toast.error("You don't have permission to publish posts. Contact your administrator."); return; }
        if (!res.ok) throw new Error();
        toast.success(published ? "Blog unpublished." : "Blog published!");
        router.refresh();
      } catch {
        toast.error("Failed to update status.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Blog Posts</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Manage all blog content and articles</p>
        </div>
        {canCreate && (
          <Link
            href="/admin/blogs/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Post
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
              placeholder="Search posts..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">{filtered.length} of {initialBlogs.length}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Title", "Author", "Status", "Published", "Actions"].map((h) => (
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
                    {search ? "No posts match your search." : "No blog posts yet. Write your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((blog) => (
                  <tr key={blog.id} className={cn("hover:bg-muted/50 transition-colors", confirmDelete === blog.id && "bg-red-500/10/30")}>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs leading-tight truncate max-w-[220px]">{blog.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">/blog/{blog.slug}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">{blog.author ?? "—"}</td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => canEdit && handleTogglePublish(blog.id, blog.published)}
                        disabled={isPending || !canEdit}
                        className="focus:outline-none"
                        title={!canEdit ? "No permission to change status" : blog.published ? "Click to unpublish" : "Click to publish"}
                      >
                        {blog.published ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full hover:bg-green-500/15 transition-colors">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:bg-muted transition-colors">
                            <Clock className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {confirmDelete === blog.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleDelete(blog.id)} disabled={isPending} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors">
                            {isPending ? "…" : "Delete"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <Link href={`/admin/blogs/${blog.id}/edit`} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button onClick={() => setConfirmDelete(blog.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
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
