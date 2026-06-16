"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Eye, ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { cn } from "@/lib/utils";

interface LegalPageItem {
  slug: string;
  navLabel: string;
  title: string;
  content: string;
  updatedAt: string | null;
}

interface Props {
  pages: LegalPageItem[];
  canEdit: boolean;
}

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:bg-muted disabled:text-muted-foreground";

function PageCard({ page, canEdit, defaultOpen }: { page: LegalPageItem; canEdit: boolean; defaultOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/legal/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      toast.success(`${page.navLabel} saved.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{page.navLabel}</h3>
          <p className="truncate text-xs text-muted-foreground">/{page.slug}</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Page Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} className={inputCls} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground">Content (HTML)</label>
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[320px] rounded-xl border border-border bg-muted/40 p-5">
                <BlogPostBody html={content} />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEdit}
                rows={22}
                className={cn(inputCls, "resize-y font-mono text-[13px] leading-relaxed")}
              />
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              Use headings (&lt;h2&gt;), paragraphs (&lt;p&gt;), lists (&lt;ul&gt;/&lt;li&gt;) and links. Rendered with the site theme.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/${page.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              View live <ExternalLink className="h-3 w-3" />
            </Link>
            {canEdit && (
              <button
                onClick={save}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LegalPagesClient({ pages, canEdit }: Props) {
  return (
    <div className="space-y-4">
      {pages.map((page, i) => (
        <PageCard key={page.slug} page={page} canEdit={canEdit} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
