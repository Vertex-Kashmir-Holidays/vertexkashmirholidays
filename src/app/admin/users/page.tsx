import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "@/components/admin/users/UsersClient";

export const metadata: Metadata = { title: "Customers — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      deletedAt: true,
      createdAt: true,
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return <UsersClient initialCustomers={customers} />;
}
