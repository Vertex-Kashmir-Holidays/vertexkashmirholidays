import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/permissions";
import { flushPublicCache } from "@/lib/cache";

// Staff-triggered full public-site cache flush. Not tied to a single module,
// so it uses requireStaff() rather than requirePermission().
export async function POST() {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  flushPublicCache();
  return NextResponse.json({ ok: true });
}
