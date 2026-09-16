// Server-only resolution of "the" Corporate Office (the first active
// ContactOffice row, admin-managed via /admin/settings) with a Registered
// Office fallback for every context that needs a single company address —
// footer, SEO JSON-LD, PDFs, legal pages, contact page primary card.
import "server-only";
import { unstable_cache } from "next/cache";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatBusinessAddress, REGISTERED_OFFICE_FORMATTED } from "@/lib/businessAddress";

type SettingsForAddress = Pick<
  SiteSettings,
  "addressLine1" | "addressCity" | "addressState" | "addressPincode" | "addressCountry" | "siteAddress"
> | null;

export interface ResolvedOffice {
  name: string;
  address: string;
  hours?: string | null;
  source: "corporate" | "registered";
}

// Called from the public layout (every page) plus /contact and
// /adventures/[slug] directly — was three separate raw Prisma round-trips per
// relevant request before this cache. No mutation route currently calls
// revalidateTag("corporate-offices") (ContactOffice edits happen via the
// generic content-block routes, not audited as part of this pass), so this
// relies on its TTL rather than on-demand invalidation — moderate 30-minute
// window, not the 24h used for content types with a wired invalidation path.
export const getActiveCorporateOffices = unstable_cache(
  () =>
    prisma.contactOffice.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["active-corporate-offices"],
  { revalidate: 1800, tags: ["corporate-offices"] },
);

export function resolveRegisteredOffice(settings: SettingsForAddress): ResolvedOffice {
  return {
    name: "Registered Office",
    address: formatBusinessAddress(settings) ?? settings?.siteAddress ?? REGISTERED_OFFICE_FORMATTED,
    source: "registered",
  };
}

/** Corporate Office (first active ContactOffice row) if one exists, else Registered Office. */
export async function resolvePrimaryOffice(settings: SettingsForAddress): Promise<ResolvedOffice> {
  const [corporate] = await getActiveCorporateOffices();
  if (corporate) {
    return { name: corporate.name, address: corporate.address, hours: corporate.hours, source: "corporate" };
  }
  return resolveRegisteredOffice(settings);
}
