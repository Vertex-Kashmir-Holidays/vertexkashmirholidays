import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // SessionProvider lets client components (e.g. the forced password-change form)
  // call useSession().update() to refresh the JWT after a server-side change.
  return (
    <SessionProvider session={session}>
      <AccountShell
        userName={session.user.name ?? "Traveller"}
        userEmail={session.user.email ?? ""}
      >
        {children}
      </AccountShell>
    </SessionProvider>
  );
}
