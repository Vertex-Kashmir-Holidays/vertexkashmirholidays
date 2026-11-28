"use client";

// Shows staff whether the client (customer or B2B agent) can see this
// itinerary, and whether they're looking at the latest saved version — and
// pushes it to them. Clients only ever read the published snapshot (see
// src/lib/itinerary/publish.ts), so nothing staff save is visible until
// published here.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Send, AlertTriangle } from "lucide-react";

export type PublishState = "never" | "stale" | "current";

interface PublishBarProps {
  /** `${apiBasePath}/${id}/publish` */
  publishUrl: string;
  /** "customer" or "agent" — only changes the wording. */
  audience: string;
  state: PublishState;
  publishedAt: string | null;
  /** Local edits not saved yet — publishing will save them first. */
  dirty: boolean;
  /** Saves the editor; resolves false if the save failed (publish is then skipped). */
  onSave: () => Promise<boolean>;
  canPublish: boolean;
  onPublished: (publishedAt: string) => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Shared publish call — also used by the post-save / post-download toast prompts. */
export async function publishTo(publishUrl: string): Promise<string | null> {
  const res = await fetch(publishUrl, { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(json.error ?? "Could not publish the itinerary.");
    return null;
  }
  return json.publishedAt as string;
}

export function PublishBar({
  publishUrl,
  audience,
  state,
  publishedAt,
  dirty,
  onSave,
  canPublish,
  onPublished,
}: PublishBarProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pending = dirty || state !== "current";

  async function handlePublish() {
    setBusy(true);
    try {
      if (dirty && !(await onSave())) return;
      const at = await publishTo(publishUrl);
      if (!at) return;
      onPublished(at);
      toast.success(`Published — the ${audience} now sees this version.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const tone = pending
    ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";

  const message =
    state === "never"
      ? `Not visible to the ${audience} yet — publish when it's ready to share.`
      : pending
        ? `Unpublished changes — the ${audience} still sees the version from ${fmt(publishedAt!)}.`
        : `The ${audience} sees this version (published ${fmt(publishedAt!)}).`;

  const Icon = state === "never" ? EyeOff : pending ? AlertTriangle : Eye;

  return (
    <div className={`no-print border-b px-3 py-2 sm:px-5 ${tone}`}>
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] font-semibold">
          <Icon className="h-4 w-4 shrink-0" />
          {message}
        </p>
        {canPublish && pending && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {dirty ? `Save & publish to ${audience}` : `Publish to ${audience}`}
          </button>
        )}
      </div>
    </div>
  );
}
