"use client";
import { useEffect } from "react";
import { trackPackageView } from "@/lib/analytics";

// Module-level dedup guard — prevents React Strict Mode's intentional double-mount
// (and any concurrent-mode remount edge case) from sending duplicate package_view
// hits. Key: packageName, value: timestamp of last fire.
// 300 ms window is safely above the synchronous Strict Mode remount delay but well
// below any realistic user navigation time, so genuine re-visits still fire.
const recentFires = new Map<string, number>();
const DEDUP_MS = 300;

/**
* Drop this into any RSC tour/package page to fire a package_view event on mount.
* Renders nothing — pure side-effect component.
*/
export function PackageViewTracker({ packageName }: { packageName: string }) {
 useEffect(() => {
   const now = Date.now();
   const last = recentFires.get(packageName) ?? 0;
   if (now - last < DEDUP_MS) return;
   recentFires.set(packageName, now);
   trackPackageView(packageName);
 }, [packageName]);
 return null;
}
