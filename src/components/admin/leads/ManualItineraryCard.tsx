"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, FileUp, Link2, Loader2, Lock, Trash2 } from "lucide-react";
import { manualItineraryFileError, type ManualItineraryInfo } from "@/lib/leads/manualItinerary";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Staff card for a lead's / B2B request's manual itinerary: a PDF the
 * customer (on their booking) or agent (on the request) can download, plus an
 * artifact link only staff ever see. Converting still needs a generated
 * itinerary — staff generate it as per the uploaded PDF.
 */
export function ManualItineraryCard({
  leadId,
  initial,
  canEdit,
  audience,
}: {
  leadId: string;
  initial: ManualItineraryInfo;
  canEdit: boolean;
  /** Who sees the PDF — "agent" (B2B request) or "customer" (normal lead). */
  audience: "agent" | "customer";
}) {
  const [info, setInfo] = useState(initial);
  const [artifact, setArtifact] = useState(initial.artifactUrl ?? "");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function send(method: "POST" | "DELETE", fd?: FormData, done?: string) {
    start(async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}/manual-itinerary`, { method, body: fd });
        const j = (await res.json().catch(() => ({}))) as { error?: string; manualItinerary?: ManualItineraryInfo };
        if (!res.ok || !j.manualItinerary) return void toast.error(j.error ?? "Save failed.");
        setInfo(j.manualItinerary);
        setArtifact(j.manualItinerary.artifactUrl ?? "");
        if (done) toast.success(done);
      } catch {
        toast.error("An error occurred.");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  function upload(file: File | undefined) {
    const err = manualItineraryFileError(file);
    if (err) return void toast.error(err);
    const fd = new FormData();
    fd.set("file", file!);
    send("POST", fd, info.url ? "Itinerary PDF replaced." : "Itinerary PDF uploaded.");
  }

  function saveArtifact() {
    const fd = new FormData();
    fd.set("artifactUrl", artifact.trim());
    send("POST", fd, artifact.trim() ? "Artifact link saved." : "Artifact link removed.");
  }

  const seenBy = audience === "agent" ? "the agent (on this request)" : "the customer (on their booking)";

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-bold text-foreground">Manual itinerary (PDF)</p>
        <p className="text-[11px] text-muted-foreground">Downloadable by {seenBy}.</p>
      </div>

      {info.url ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{info.name ?? "Itinerary.pdf"}</span>
          </a>
          {info.uploadedAt && <span className="text-[11px] text-muted-foreground">· {fmt(info.uploadedAt)}</span>}
          {canEdit && (
            <span className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                <FileUp className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                onClick={() => send("DELETE", undefined, "Itinerary PDF removed.")}
                disabled={pending}
                aria-label="Remove the itinerary PDF"
                className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      ) : canEdit ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />} Upload PDF
          (max 4 MB)
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">No PDF uploaded.</p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {info.url && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Converting still needs a generated itinerary — generate it as per this PDF.
        </p>
      )}

      <div className="border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> Artifact link
          <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
            <Lock className="h-2.5 w-2.5" /> Staff only
          </span>
        </p>
        {canEdit ? (
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              value={artifact}
              onChange={(e) => setArtifact(e.target.value)}
              placeholder="https://claude.ai/…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            {info.artifactUrl && artifact.trim() === info.artifactUrl && (
              <a
                href={info.artifactUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the artifact"
                className="inline-flex items-center rounded-lg border border-border px-2 text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={saveArtifact}
              disabled={pending || artifact.trim() === (info.artifactUrl ?? "")}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        ) : info.artifactUrl ? (
          <a
            href={info.artifactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open artifact
          </a>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No link added.</p>
        )}
      </div>
    </div>
  );
}
