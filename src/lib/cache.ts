import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────────────────────────────────
// On-demand cache invalidation.
//
// Public pages use ISR (`export const revalidate = 300`), so content/image
// edits made in the admin take up to 5 minutes to appear. That lag is
// intentional (it keeps the public site cheap and fast), but staff need a way
// to force-refresh immediately after an important change. `flushPublicCache`
// purges every page rendered under the root layout — a full site flush.
// ──────────────────────────────────────────────────────────────────────────
export function flushPublicCache() {
  // The "layout" type invalidates the whole subtree under the root layout,
  // i.e. every public page in one call.
  revalidatePath("/", "layout");
}
