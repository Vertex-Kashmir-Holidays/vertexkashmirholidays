import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatOfferDates } from "@/lib/offers/content";
import { OffersClient } from "@/components/admin/offers/OffersClient";

export const metadata: Metadata = { title: "Occasion Offers — Admin" };
export const dynamic = "force-dynamic";

// Gated by the Packages permission (see MODULE_PATH_ALIASES in moduleGuard.tsx).
export default async function AdminOffersPage() {
  const session = await auth();
  const role = session!.user.role;

  const [offers, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.occasionOffer.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        published: true,
        sortOrder: true,
        occasionType: true,
        startDate: true,
        endDate: true,
        packages: { select: { published: true, priceForTwo: true } },
        _count: { select: { leads: true } },
      },
    }),
    can(role, "packages", "create"),
    can(role, "packages", "edit"),
    can(role, "packages", "delete"),
  ]);

  return (
    <OffersClient
      offers={offers.map(({ packages, _count, startDate, endDate, ...o }) => {
        const live = packages.filter((p) => p.published);
        return {
          ...o,
          dates: formatOfferDates(startDate, endDate),
          packageCount: live.length,
          fromPrice: live.length ? Math.min(...live.map((p) => p.priceForTwo)) : null,
          leadCount: _count.leads,
        };
      })}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
