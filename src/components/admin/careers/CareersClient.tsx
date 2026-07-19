"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, MapPin, CheckCircle2, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmploymentType } from "@prisma/client";
import { JobApplicationsModal } from "./JobApplicationsModal";

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: EmploymentType;
  location: string;
  published: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialJobs: Job[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function CareersClient({ initialJobs, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

  const filtered = initialJobs.filter(
    (j) =>
      search === "" ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      j.slug.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/careers/${id}`, { method: "DELETE" });
        if (res.status === 403) {
          toast.error("You don't have permission to delete jobs. Contact your administrator.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success("Job deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete job.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  async function handleTogglePublish(id: string, published: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/careers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !published }),
        });
        if (res.status === 403) {
          toast.error("You don't have permission to publish jobs. Contact your administrator.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success(published ? "Job unpublished." : "Job published!");
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
          <h2 className="font-display font-extrabold text-foreground text-xl">Careers</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Manage job openings</p>
        </div>
        {canCreate && (
          <Link
            href="/admin/careers/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Job
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
              placeholder="Search jobs..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {filtered.length} of {initialJobs.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Job", "Location", "Status", "Posted", "Actions"].map((h) => (
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
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {search ? "No jobs match your search." : "No jobs yet. Create your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr
                    key={job.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      confirmDelete === job.id && "bg-red-500/10/30",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="min-w-0 max-w-xs">
                        <p className="font-semibold text-foreground text-xs leading-tight truncate">
                          {job.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {job.department} · {EMPLOYMENT_LABELS[job.employmentType]}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{job.location}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => canEdit && handleTogglePublish(job.id, job.published)}
                        disabled={!canEdit || isPending}
                        className={cn(
                          "flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full transition-colors",
                          job.published
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-muted text-muted-foreground",
                          canEdit && "cursor-pointer hover:brightness-95",
                        )}
                      >
                        {job.published ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {job.publishedAt
                        ? new Date(job.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {confirmDelete === job.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(job.id)}
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
                          <button
                            onClick={() => setViewingJob(job)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View Applications"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <Link
                              href={`/admin/careers/${job.id}/edit`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(job.id)}
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

      {viewingJob && (
        <JobApplicationsModal
          jobId={viewingJob.id}
          jobTitle={viewingJob.title}
          canDelete={canDelete}
          onClose={() => setViewingJob(null)}
        />
      )}
    </div>
  );
}
