// Server-only access rules for itineraries. Centralised so the API routes and
// the editor RSC enforce identical scoping (no duplicated business logic).
//
// Two kinds of itinerary:
//   • Lead-linked  (leadId set) — visibility & editability follow the owning lead:
//       admin sees/edits all; SALES only its assigned lead; never editable once
//       the lead is converted (or the itinerary is explicitly locked).
//   • Standalone   (leadId null) — classic owner-scoped behaviour.

import type { Role } from "@/lib/rbac";

export function isAdminRole(role?: Role | string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export interface ItineraryForAccess {
  ownerId: string;
  leadId: string | null;
  locked: boolean;
  lead?: { assignedToId: string | null; locked: boolean } | null;
}

export interface SessionUserLike {
  id: string;
  role: Role | string;
}

export interface ItineraryAccess {
  /** May open/read the itinerary. */
  canView: boolean;
  /** May save changes to the itinerary. */
  canEdit: boolean;
  /** True when blocked specifically because the lead is converted / itinerary locked. */
  locked: boolean;
}

export function resolveItineraryAccess(
  it: ItineraryForAccess,
  user: SessionUserLike,
): ItineraryAccess {
  const admin = isAdminRole(user.role);

  if (it.leadId) {
    const assigned = it.lead?.assignedToId === user.id;
    // Admins may VIEW any lead-linked itinerary, but only the lead's assignee may
    // EDIT it — managing a lead (incl. its itinerary) is the assignee's job; an
    // admin's only lead power is reassignment.
    const canView = admin || assigned;
    const locked = it.locked || (it.lead?.locked ?? false);
    return { canView, canEdit: assigned && !locked, locked };
  }

  // Standalone itinerary — owner-scoped.
  const owned = it.ownerId === user.id;
  const canView = admin || owned;
  return { canView, canEdit: canView && !it.locked, locked: it.locked };
}
