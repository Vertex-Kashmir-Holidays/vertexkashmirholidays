import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConnectClient } from "@/components/admin/connect/ConnectClient";

export const metadata: Metadata = { title: "Vertex Connect — Admin" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ room?: string }> };

export default async function ConnectPage({ searchParams }: PageProps) {
  const [session, { room: initialRoomId }] = await Promise.all([auth(), searchParams]);
  const currentUserId = session?.user?.id ?? "";

  const staffUsers = await prisma.user.findMany({
    where: { deletedAt: null, role: { not: "CUSTOMER" } },
    select: { id: true, name: true, image: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <ConnectClient
      currentUserId={currentUserId}
      staffUsers={staffUsers}
      initialRoomId={initialRoomId}
    />
  );
}
