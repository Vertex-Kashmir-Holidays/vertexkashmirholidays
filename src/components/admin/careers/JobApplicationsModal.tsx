"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Download, ChevronDown, ChevronUp, Trash2, Loader2, Inbox } from "lucide-react";
import { usePagination } from "@/components/admin/ui/usePagination";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import type { CareersApplicationRecord } from "@/lib/careers/applications";

interface Application extends CareersApplicationRecord {
  publicId: string | null;
}

interface Props {
  jobId: string;
  jobTitle: string;
  canDelete: boolean;
  onClose: () => void;
}

export function JobApplicationsModal({ jobId, jobTitle, canDelete, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/careers/${jobId}/applications`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setApplications(data.applications ?? []);
      } catch {
        if (!cancelled) toast.error("Could not load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const { page, setPage, pageSize, changePageSize, pageCount, total, pageItems } = usePagination(
    applications,
    10,
  );

  function rowKey(app: Application, i: number) {
    return app.publicId ?? `${app.email}-${i}`;
  }

  function handleDelete(app: Application, key: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/careers/${jobId}/applications`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: app.publicId, resumePublicId: app.resumePublicId }),
        });
        if (res.status === 403) {
          toast.error("You don't have permission to delete applications.");
          return;
        }
        if (!res.ok) throw new Error();
        setApplications((prev) => prev.filter((a, i) => rowKey(a, i) !== key));
        toast.success("Application deleted.");
      } catch {
        toast.error("Failed to delete application.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-4xl max-h-[85vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-foreground">Applications</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{jobTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8" />
              No applications yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-border bg-muted">
                  {["Name", "Email", "Phone", "Resume", ""].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((app, i) => {
                  const key = rowKey(app, i);
                  const isExpanded = expanded === key;
                  return (
                    <Fragment key={key}>
                      <tr className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">
                          {app.fullName}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{app.email}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {app.phone}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" /> Resume
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {confirmDelete === key ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(app, key)}
                                disabled={isPending}
                                className="rounded-lg bg-red-500 px-2 py-1 text-[12px] font-bold text-white transition-colors hover:bg-red-600"
                              >
                                {isPending ? "…" : "Delete"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="rounded-lg border border-border px-2 py-1 text-[12px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setExpanded(isExpanded ? null : key)}
                                className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-muted-foreground hover:text-primary"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                View more
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete(key)}
                                  title="Delete"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/30">
                          <td colSpan={5} className="px-4 py-4">
                            <dl className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <dt className="font-semibold text-muted-foreground">Experience</dt>
                                <dd className="mt-0.5 text-foreground">{app.experience || "—"}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-muted-foreground">Submitted</dt>
                                <dd className="mt-0.5 text-foreground">
                                  {new Date(app.submittedAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </dd>
                              </div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
          onPage={setPage}
          onPageSize={changePageSize}
          noun="applications"
        />
      </div>
    </div>
  );
}
