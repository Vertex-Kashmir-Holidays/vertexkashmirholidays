"use client";


import { useEffect } from "react";
import { trackPackageView } from "@/lib/analytics";


/**
* Drop this into any RSC tour/package page to fire a package_view event on mount.
* Renders nothing — pure side-effect component.
*/
export function PackageViewTracker({ packageName }: { packageName: string }) {
 useEffect(() => {
   trackPackageView(packageName);
 }, [packageName]);
 return null;
}
