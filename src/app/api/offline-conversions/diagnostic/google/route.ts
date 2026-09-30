import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { isSameOrigin } from "@/lib/security/origin";
import { runGoogleValidateOnlyDiagnostic } from "@/lib/offlineConversion/googleDiagnostic";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * TEMPORARY — validate-only diagnostic for the Google Data Manager offline-
 * conversion integration. Sends one synthetic event with validateOnly=true;
 * Google validates it but never ingests it, so NO conversion is recorded.
 * Writes nothing to the database and never touches the queue, Leads or Bookings.
 * Delete this route (and src/lib/offlineConversion/googleDiagnostic.ts) once
 * the integration has been verified.
 *
 * Restricted to SUPERADMIN (which already requires MFA) who also hold
 * offlineConversions:edit; POST only; same-origin only; takes no input.
 *
 * Usage (browser console, logged in as SUPERADMIN on the admin site):
 *   fetch("/api/offline-conversions/diagnostic/google", { method: "POST" })
 *     .then((r) => r.json()).then(console.log)
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  }

  const guard = await requirePermission("offlineConversions", "edit");
  if (guard instanceof NextResponse) return guard;

  if (guard.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Forbidden — SUPERADMIN only" },
      { status: 403, headers: NO_STORE },
    );
  }

  const { httpStatus, ...body } = await runGoogleValidateOnlyDiagnostic();
  return NextResponse.json(body, { status: httpStatus, headers: NO_STORE });
}
