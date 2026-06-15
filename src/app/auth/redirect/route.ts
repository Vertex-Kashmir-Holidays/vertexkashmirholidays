import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";

// Role-aware landing endpoint hit right after a successful sign-in.
// Staff land in the admin panel, everyone else in their customer account area.
export async function GET(req: Request) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const target = isStaff(role) ? "/admin/dashboard" : "/account";
  return NextResponse.redirect(new URL(target, req.url));
}
