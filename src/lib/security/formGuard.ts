// Honeypot + time-trap — cheap, dependency-free bot signals shared by every
// public form (client sets the fields; server checks them). Neither is a hard
// gate on its own: a determined bot can strip the fields, which is why Turnstile
// + rate limiting sit behind these. They mainly filter dumb form-spam bots.
//
// This module is pure (no server-only imports) so it is safe in client bundles.

/** Hidden field a human never sees; bots that auto-fill inputs populate it. */
export const HONEYPOT_FIELD = "company";
/** Hidden field carrying the form's render time (ms epoch). */
export const TIMETRAP_FIELD = "renderedAt";
/** Submissions faster than this after render are almost certainly bots. */
export const MIN_FORM_FILL_MS = 2000;

/**
 * Server-side check. Returns `false` (with a reason) when the submission looks
 * automated. Absent fields are tolerated (graceful) — only an actively-filled
 * honeypot or an implausibly fast submit is blocked.
 */
export function checkBotSignals(body: unknown): { ok: boolean; reason?: string } {
  if (!body || typeof body !== "object") return { ok: true };
  const rec = body as Record<string, unknown>;

  const hp = rec[HONEYPOT_FIELD];
  if (typeof hp === "string" && hp.trim() !== "") {
    return { ok: false, reason: "honeypot" };
  }

  const t = Number(rec[TIMETRAP_FIELD]);
  if (Number.isFinite(t) && t > 0 && Date.now() - t < MIN_FORM_FILL_MS) {
    return { ok: false, reason: "timetrap" };
  }

  return { ok: true };
}
