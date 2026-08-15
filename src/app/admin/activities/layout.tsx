import { requireModuleView } from "@/lib/admin/moduleGuard";

export default async function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireModuleView("activities");
  if (!guard.ok) return guard.page;
  return <>{children}</>;
}
