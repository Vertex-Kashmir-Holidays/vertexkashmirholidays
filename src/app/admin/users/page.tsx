import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "@/components/admin/users/UsersClient";

export const metadata: Metadata = { title: "Customers — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Matches UsersClient's default tab ("Normal") and "Show deleted" = off —
  // see the agency/includeDeleted handling in /api/users for how the client
  // re-fetches when either changes.
  const where = { role: "CUSTOMER" as const, deletedAt: null, agencyStatus: null };

  // Only the first page (matching UsersClient's default page size) is fetched
  // server-side for a fast initial paint — every subsequent page/search/filter
  // change is handled client-side via the already-existing, correctly
  // paginated /api/users endpoint, instead of the previous approach of loading
  // (and silently capping at) the first 200 rows.
  const [customers, totalCount, deletedCount, b2bCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        deletedAt: true,
        createdAt: true,
        lastLoginAt: true,
        agencyStatus: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: { not: null } } }),
    prisma.user.count({ where: { role: "CUSTOMER", agencyStatus: { not: null } } }),
  ]);

  return (
    <UsersClient
      initialCustomers={customers}
      totalCount={totalCount}
      deletedCount={deletedCount}
      initialB2bCount={b2bCount}
    />
  );
}
