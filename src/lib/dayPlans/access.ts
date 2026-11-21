import { can } from "@/lib/permissions";
import type { Role } from "@/lib/rbac";

/** Day Plans library access for an editor: pick = Itineraries view, save = Itineraries create. */
export async function dayPlanAccess(role: Role): Promise<{ canPick: boolean; canSave: boolean }> {
  const [canPick, canSave] = await Promise.all([can(role, "itinerary", "view"), can(role, "itinerary", "create")]);
  return { canPick, canSave };
}
