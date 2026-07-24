"use client";
import { useEffect } from "react";
import { trackJobViewed } from "@/lib/analytics";

// Module-level dedup guard — prevents React Strict Mode's intentional double-mount
// (and any concurrent-mode remount edge case) from sending duplicate job_viewed
// hits. Same shape as PackageViewTracker's guard.
const recentFires = new Map<string, number>();
const DEDUP_MS = 3000;

/**
 * Drop this into the job detail RSC page to fire a job_viewed event on mount.
 * Renders nothing — pure side-effect component.
 */
export function JobViewedTracker({ jobTitle, jobId }: { jobTitle: string; jobId: string }) {
  useEffect(() => {
    const now = Date.now();
    const last = recentFires.get(jobId) ?? 0;
    if (now - last < DEDUP_MS) return;
    recentFires.set(jobId, now);
    trackJobViewed(jobTitle, jobId);
  }, [jobTitle, jobId]);
  return null;
}
