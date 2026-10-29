import type { B2BAgentStatus } from "@/lib/rbac";

/**
 * True when an account must not hold a session — checked at every sign-in
 * (password, Google, One Tap) and on every session read, so deactivating an
 * account also ends any session it already has.
 *   - deletedAt set      → deleted (staff, customer or B2B agent alike)
 *   - agencyStatus SUSPENDED → B2B agent whose access was suspended
 * A PENDING B2B agent is still awaiting approval, not rejected, so stays allowed.
 */
export function isAccountBlocked(user: {
  deletedAt: Date | null;
  agencyStatus: B2BAgentStatus | null;
}): boolean {
  return user.deletedAt !== null || user.agencyStatus === "SUSPENDED";
}
