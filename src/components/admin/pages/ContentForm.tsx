"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";

export interface ContentFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "image";
  placeholder?: string;
}

export interface ContentGroup {
  title: string;
  fields: ContentFieldDef[];
}

interface Props {
  contentKey: "home" | "about" | "contact";
  groups: ContentGroup[];
  initial: Record<string, unknown> | null;
  canEdit: boolean;
}

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:bg-muted disabled:text-muted-foreground";

export function ContentForm({ contentKey, groups, initial, canEdit }: Props) {
  const router = useRouter();
  const allFields = groups.flatMap((g) => g.fields);
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(allFields.map((f) => [f.key, initial?.[f.key] != null ? String(initial[f.key]) : ""])),
  );
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      // Empty strings → null so public pages fall back to their defaults.
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
      );
      const res = await fetch(`/api/pages/content/${contentKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Page content saved.");
      router.refresh();
    } catch {
      toast.error("Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {group.fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">{f.label}</label>
                {f.type === "image" ? (
                  <ImageField value={form[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    disabled={!canEdit}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <input
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    disabled={!canEdit}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={save}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
