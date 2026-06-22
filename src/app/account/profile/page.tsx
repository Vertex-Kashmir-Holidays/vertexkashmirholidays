import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, image: true },
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Profile</h1>
      <ProfileForm
        initialName={user?.name ?? session!.user.name ?? ""}
        email={user?.email ?? session!.user.email ?? ""}
        initialImage={user?.image ?? ""}
      />
    </div>
  );
}
