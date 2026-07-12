"use client";

import { useMemo } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";

// ──────────────────────────────────────────────────────────────────────────
// Generic structured editor for the campaign "advanced section" JSON arrays.
// Each section is a JSON-string array; this renders it as add/remove/reorder
// rows with proper inputs (text/textarea/number/image/feature-list) instead of
// a raw JSON textarea. Image fields are wired to the media gallery + upload via
// ImageField. The value in/out is always the JSON string, so the parent form's
// existing save/validation path is untouched.
// ──────────────────────────────────────────────────────────────────────────

type FieldType = "text" | "textarea" | "number" | "image" | "stringList";

export interface ItemField {
  key: string;
  label: string;
  type?: FieldType; // default "text"
  placeholder?: string;
}

export type ItemSpec =
  // Item is a primitive string (optionally an image URL).
  | { kind: "scalar"; type?: "text" | "image" }
  // Item is a fixed-length array of strings (e.g. [value, label, sub]).
  | { kind: "tuple"; fields: { label: string; placeholder?: string }[] }
  // Item is an object with typed fields.
  | { kind: "object"; fields: ItemField[] };

interface Props {
  label: string;
  description?: string;
  value: string; // JSON string array
  onChange: (json: string) => void;
  spec: ItemSpec;
  folder?: string;
  disabled?: boolean;
}

const inputCls =
  "w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

type Row = unknown;

function parse(value: string): Row[] {
  try {
    const v = JSON.parse(value || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function emptyItem(spec: ItemSpec): Row {
  if (spec.kind === "scalar") return "";
  if (spec.kind === "tuple") return spec.fields.map(() => "");
  const obj: Record<string, unknown> = {};
  for (const f of spec.fields) obj[f.key] = f.type === "stringList" ? [] : f.type === "number" ? 0 : "";
  return obj;
}

export function SectionArrayEditor({ label, description, value, onChange, spec, folder = "campaigns", disabled }: Props) {
  const rows = useMemo(() => parse(value), [value]);

  const commit = (next: Row[]) => onChange(JSON.stringify(next));

  const update = (i: number, row: Row) => {
    const next = [...rows];
    next[i] = row;
    commit(next);
  };
  const add = () => commit([...rows, emptyItem(spec)]);
  const remove = (i: number) => commit(rows.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">{label}</h4>
          {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {!disabled && (
          <button type="button" onClick={add} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {rows.length === 0 && <p className="text-xs text-muted-foreground italic">No items yet.</p>}

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">#{i + 1}</span>
              {!disabled && (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => remove(i)} className="rounded p-1 text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
            <RowFields spec={spec} row={row} folder={folder} disabled={disabled} onChange={(r) => update(i, r)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RowFields({ spec, row, folder, disabled, onChange }: { spec: ItemSpec; row: Row; folder: string; disabled?: boolean; onChange: (r: Row) => void }) {
  if (spec.kind === "scalar") {
    const v = typeof row === "string" ? row : "";
    if (spec.type === "image") {
      return <ImageField value={v} onChange={(url) => onChange(url)} folder={folder} />;
    }
    return <input value={v} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
  }

  if (spec.kind === "tuple") {
    const arr = Array.isArray(row) ? (row as string[]) : [];
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {spec.fields.map((f, idx) => (
          <div key={idx}>
            <label className="mb-1 block text-[12px] font-semibold text-muted-foreground">{f.label}</label>
            <input
              value={arr[idx] ?? ""}
              disabled={disabled}
              placeholder={f.placeholder}
              onChange={(e) => {
                const next = [...arr];
                next[idx] = e.target.value;
                onChange(next);
              }}
              className={inputCls}
            />
          </div>
        ))}
      </div>
    );
  }

  // object
  const obj = (row && typeof row === "object" && !Array.isArray(row) ? row : {}) as Record<string, unknown>;
  const set = (key: string, val: unknown) => onChange({ ...obj, [key]: val });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {spec.fields.map((f) => {
        const type = f.type ?? "text";
        const span = type === "textarea" || type === "image" || type === "stringList" ? "sm:col-span-2" : "";
        return (
          <div key={f.key} className={span}>
            <label className="mb-1 block text-[12px] font-semibold text-muted-foreground">{f.label}</label>
            {type === "image" ? (
              <ImageField value={String(obj[f.key] ?? "")} onChange={(url) => set(f.key, url)} folder={folder} />
            ) : type === "textarea" ? (
              <textarea rows={2} value={String(obj[f.key] ?? "")} disabled={disabled} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            ) : type === "number" ? (
              <input type="number" value={obj[f.key] != null ? String(obj[f.key]) : ""} disabled={disabled} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value === "" ? 0 : Number(e.target.value))} className={inputCls} />
            ) : type === "stringList" ? (
              <textarea
                rows={3}
                value={Array.isArray(obj[f.key]) ? (obj[f.key] as string[]).join("\n") : ""}
                disabled={disabled}
                placeholder={"One per line"}
                onChange={(e) => set(f.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                className={`${inputCls} font-mono text-xs`}
              />
            ) : (
              <input value={String(obj[f.key] ?? "")} disabled={disabled} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            )}
          </div>
        );
      })}
    </div>
  );
}
