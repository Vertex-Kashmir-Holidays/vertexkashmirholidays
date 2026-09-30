import { prisma } from "@/lib/prisma";
import { parsePackageOptions } from "@/lib/tours/content";

export interface LeadTourOption {
  id: string;
  title: string;
  /** Names of the tour's package options (Tour.packageOptions), if any. */
  packageNames: string[];
}

/** Tour picker options for the admin lead forms (new / edit / detail). */
export async function getLeadTourOptions(): Promise<LeadTourOption[]> {
  const tours = await prisma.tour.findMany({
    select: { id: true, title: true, packageOptions: true },
    orderBy: { title: "asc" },
  });
  return tours.map((t) => ({
    id: t.id,
    title: t.title,
    packageNames: parsePackageOptions(t.packageOptions).map((o) => o.name),
  }));
}
