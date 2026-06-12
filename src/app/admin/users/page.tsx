import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UsersClient } from "@/components/admin/users/UsersClient";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <UsersClient
      initialUsers={users}
      totalCount={totalCount}
      currentUserId={session?.user?.id ?? ""}
    />
  );
}
