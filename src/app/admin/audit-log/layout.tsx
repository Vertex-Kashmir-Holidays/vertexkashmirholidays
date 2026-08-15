import { requireModuleView } from "@/lib/admin/moduleGuard";

export default async function AuditLogLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireModuleView("auditLog");
  if (!guard.ok) return guard.page;
  return <>{children}</>;
}
