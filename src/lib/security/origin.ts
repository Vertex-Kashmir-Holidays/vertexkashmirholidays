// Same-origin guard for our hand-rolled mutation routes. Auth.js protects its
// own endpoints (built-in CSRF); this covers custom POST handlers like the lead
// and newsletter forms. It allows requests whose Origin matches the request
// host (our own pages) and tolerates a missing Origin (some same-origin POSTs
// omit it), while rejecting an explicit cross-site Origin.

export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // no Origin header → treat as same-origin
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
