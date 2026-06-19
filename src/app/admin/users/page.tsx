import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UsersClient } from "@/components/admin/users/UsersClient";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

const SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  bookingConversionPct: true,
  deletedAt: true,
  createdAt: true,
  _count: { select: { bookings: true, reviews: true } },
} as const;

export default async function AdminUsersPage() {
  const session = await auth();

  const [customers, employees] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: SELECT,
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"] } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: SELECT,
    }),
  ]);

  return (
    <UsersClient
      initialCustomers={customers}
      initialEmployees={employees}
      currentUserId={session?.user?.id ?? ""}
      currentUserRole={session?.user?.role ?? ""}
    />
  );
}
