"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
import { getMeta, type FieldDef } from "@/lib/admin/pageFields";
import { ImageField } from "@/components/admin/pages/ImageField";
import { VideoField } from "@/components/admin/pages/VideoField";
import { cn } from "@/lib/utils";

type Item = Record<string, unknown> & { id: string; sortOrder?: number; isActive?: boolean };

interface Props {
  title: string;
  description?: string;
  resource: string;
  fields: FieldDef[];
  items: Item[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /**
   * Optional: URL template for a per-item "View" link (e.g. a category's
   * filtered public listing). Any `{fieldKey}` token is replaced with the
   * item's value for that field — e.g. "/blog?category={slug}". Must be a
   * plain string (not a function) since this crosses the server/client
   * component boundary as a prop.
   */
  viewHrefTemplate?: string;
}

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

function toInput(value: unknown, type: FieldDef["type"]): string {
  if (type === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  if (type === "date") return new Date(value as string).toISOString().slice(0, 10);
  return String(value);
}

function buildViewHref(template: string, item: Item): string | null {
  let missing = false;
  const filled = template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const value = item[key];
    if (value == null || value === "") missing = true;
    return String(value ?? "");
  });
  return missing ? null : filled;
}

export function ListEditor({ title, description, resource, fields, items, canCreate, canEdit, canDelete, viewHrefTemplate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const meta = getMeta(resource);
  const primaryKey = fields[0]?.key ?? "id";

  function openNew() {
    setEditing("new");
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setActive(true);
    setSortOrder(String(items.length));
  }

  function openEdit(item: Item) {
    setEditing(item);
    setForm(Object.fromEntries(fields.map((f) => [f.key, toInput(item[f.key], f.type)])));
    setActive(item.isActive ?? true);
    setSortOrder(String(item.sortOrder ?? 0));
  }

  function close() {
    setEditing(null);
    setForm({});
  }

  async function save() {
    // Build payload: omit empty optional fields so nullish coercion passes.
    const payload: Record<string, unknown> = {};
    if (meta.sortable) payload.sortOrder = Number(sortOrder) || 0;
    if (meta.activatable) payload.isActive = active;
    for (const f of fields) {
      const v = form[f.key];
      if (f.type === "boolean") {
        payload[f.key] = v === "true";
        continue;
      }
      if (v === "" || v == null) {
        if (f.required) {
          toast.error(`${f.label} is required.`);
          return;
        }
        continue;
      }
      payload[f.key] = v;
    }

    setBusy(true);
    try {
      const isNew = editing === "new";
      const url = isNew ? `/api/pages/${resource}` : `/api/pages/${resource}/${(editing as Item).id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Item added." : "Item updated.");
      close();
      router.refresh();
    } catch {
      toast.error("Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: Item) {
    try {
      const res = await fetch(`/api/pages/${resource}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !(item.isActive ?? true) }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Failed to toggle.");
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Item deleted.");
      setConfirmDelete(null);
      router.refresh();
    } catch {
      toast.error("Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {canCreate && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-muted-foreground">No items yet.</p>
        ) : (
          items.map((item) => {
            const viewHref = viewHrefTemplate ? buildViewHref(viewHrefTemplate, item) : null;
            return (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              {meta.sortable && (
                <span className="w-6 shrink-0 text-[11px] font-medium text-muted-foreground/60">{item.sortOrder ?? 0}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", item.isActive === false ? "text-muted-foreground" : "text-foreground")}>
                  {String(item[primaryKey] ?? "—")}
                </p>
                {fields[1] && (
                  <p className="truncate text-xs text-muted-foreground">{String(item[fields[1].key] ?? "")}</p>
                )}
              </div>
              {meta.activatable && item.isActive === false && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Hidden</span>
              )}
              {viewHref && (
                <Link
                  href={viewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="View"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              {meta.activatable && canEdit && (
                <button onClick={() => toggleActive(item)} className="text-muted-foreground hover:text-primary" aria-label="Toggle visibility">
                  {item.isActive === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
              {canEdit && (
                <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete &&
                (confirmDelete === item.id ? (
                  <span className="flex items-center gap-1">
                    <button onClick={() => remove(item.id)} disabled={busy} className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[11px] text-muted-foreground">Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(item.id)} className="text-muted-foreground hover:text-red-500 dark:text-red-400" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ))}
            </div>
            );
          })
        )}
      </div>

      {/* Add/Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-display text-base font-bold text-foreground">
                {editing === "new" ? `Add to ${title}` : `Edit ${title}`}
              </h4>
              <button onClick={close} className="text-muted-foreground hover:text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3.5">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {f.label}{f.required && <span className="text-red-400"> *</span>}
                  </label>
                  {f.type === "image" ? (
                    <ImageField value={form[f.key] ?? ""} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} folder={resource} />
                  ) : f.type === "video" ? (
                    <VideoField value={form[f.key] ?? ""} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} folder={resource} />
                  ) : f.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={form[f.key] === "true"}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.checked ? "true" : "false" }))}
                      className="h-4 w-4 accent-primary"
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={form[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}

              {(meta.sortable || meta.activatable) && (
                <div className="flex items-center gap-4">
                  {meta.sortable && (
                    <div className="w-28">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sort order</label>
                      <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
                    </div>
                  )}
                  {meta.activatable && (
                    <label className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground">
                      <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
                      Visible on site
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">Cancel</button>
              <button
                onClick={save}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
