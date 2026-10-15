import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { getReviewStats } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? Don't show the login form again — send them to where
  // they belong (staff → admin, customers → their account).
  const session = await auth();
  if (session?.user) {
    redirect(isStaff(session.user.role) ? "/admin/dashboard" : "/account");
  }

  // Google One Tap injects its own <script> tag client-side, which needs this
  // request's CSP nonce to be trusted (see proxy.ts's nonce-based CSP).
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  // Live approved-review rating for the side panel — never a typed figure.
  const { average, total } = await getReviewStats();

  return <AuthScreen nonce={nonce} rating={total > 0 ? { average, total } : null} />;
}
