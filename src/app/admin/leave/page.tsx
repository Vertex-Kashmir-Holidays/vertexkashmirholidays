import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { LeaveClient } from "@/components/admin/leave/LeaveClient";
import type { Role } from "@/lib/rbac";

export const metadata: Metadata = { title: "Leave — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLeavePage() {
  const session = await auth();
  const role = session?.user?.role as Role;
  const isManager = await can(role, "leave", "edit");

  return <LeaveClient isManager={isManager} />;
}
