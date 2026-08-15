import { requireModuleView } from "@/lib/admin/moduleGuard";

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireModuleView("about");
  if (!guard.ok) return guard.page;
  return <>{children}</>;
}
