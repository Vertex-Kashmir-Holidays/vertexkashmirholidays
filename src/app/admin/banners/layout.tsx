import { requireModuleView } from "@/lib/admin/moduleGuard";

export default async function BannersLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireModuleView("banners");
  if (!guard.ok) return guard.page;
  return <>{children}</>;
}
