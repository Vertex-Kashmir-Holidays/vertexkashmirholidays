import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AccountShell
      userName={session.user.name ?? "Traveller"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </AccountShell>
  );
}
