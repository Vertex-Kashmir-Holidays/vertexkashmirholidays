import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await auth();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Profile</h1>
      <ProfileForm
        initialName={session!.user.name ?? ""}
        email={session!.user.email ?? ""}
      />
    </div>
  );
}
