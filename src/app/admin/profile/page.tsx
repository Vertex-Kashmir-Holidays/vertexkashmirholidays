import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";

export const metadata: Metadata = { title: "My Profile — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, image: true, role: true },
  });

  return (
    <AdminProfileForm
      initialName={user?.name ?? ""}
      email={user?.email ?? ""}
      initialImage={user?.image ?? ""}
      role={user?.role ?? session!.user.role}
    />
  );
}
