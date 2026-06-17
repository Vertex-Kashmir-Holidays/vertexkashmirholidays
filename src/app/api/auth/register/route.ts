import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Direct account creation is intentionally disabled. Registration now requires
// email OTP verification:
//   1. POST /api/auth/register/request-otp  → emails a 6-digit code
//   2. POST /api/auth/register/verify-otp   → verifies the code and creates the account
//
// This stub remains so any old client hitting the legacy endpoint gets a clear
// signal instead of silently creating an unverified account.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Email verification is now required to register. Please use the verification flow.",
    },
    { status: 410 },
  );
}
