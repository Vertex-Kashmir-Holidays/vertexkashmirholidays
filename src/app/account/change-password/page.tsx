import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ForceChangePasswordForm } from "@/components/account/ForceChangePasswordForm";

export const metadata: Metadata = { title: "Set your password — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Already set their own password — nothing forced to do here.
  if (!session.user.mustChangePassword) redirect("/account");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          Set your password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account was created with a temporary password. For your security, please choose a new
          password before continuing.
        </p>
      </div>
      <ForceChangePasswordForm />
    </div>
  );
}
