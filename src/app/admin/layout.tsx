import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminShell
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </AdminShell>
  );
}
