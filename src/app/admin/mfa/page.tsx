import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MfaEnrollForm } from "@/components/admin/mfa/MfaEnrollForm";
import { MfaChallengeForm } from "@/components/admin/mfa/MfaChallengeForm";

export const metadata: Metadata = { title: "Two-factor authentication — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Nothing to do here if this account doesn't need MFA or already cleared it.
  if (!session.user.mfaPending) redirect("/admin/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabledAt: true },
  });
  const alreadyEnrolled = Boolean(user?.mfaEnabledAt);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          Two-factor authentication
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {alreadyEnrolled
            ? "Enter the 6-digit code from your authenticator app to continue."
            : "Your role requires an authenticator app for sign-in. Set it up once, and you won't be asked again on this step."}
        </p>
      </div>
      {alreadyEnrolled ? <MfaChallengeForm /> : <MfaEnrollForm />}
    </div>
  );
}
