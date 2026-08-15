import { requireModuleView } from "@/lib/admin/moduleGuard";

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireModuleView("employees");
  if (!guard.ok) return guard.page;
  return <>{children}</>;
}
