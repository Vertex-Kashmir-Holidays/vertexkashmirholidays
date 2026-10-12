// Dates on a B2B itinerary: a hotel's check-in / check-out and each day's
// date. The B2B editor stores them as plain calendar dates ("2026-06-10", from
// a date picker — no time); the normal itinerary editor's same fields are
// free-text labels ("Wed 10 Jun"), so anything that isn't a calendar date is
// shown as written.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The value for an `<input type="date">` — "" unless it's a calendar date. */
export function stayDateInputValue(value: string): string {
  return ISO_DATE.test(value) ? value : "";
}

/** "2026-06-10" → "10 Jun 2026" (or "10 Jun" with `year: false`); any other
 *  text is returned unchanged. */
export function formatStayDate(value: string, { year = true }: { year?: boolean } = {}): string {
  const m = ISO_DATE.exec(value);
  if (!m) return value;
  // Built from its parts, so the day never shifts with the viewer's timezone.
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" as const } : {}),
  });
}

/** The calendar date `days` after "2026-06-10" → "2026-06-11". */
export function addDaysToStayDate(value: string, days: number): string {
  const m = ISO_DATE.exec(value);
  if (!m) return "";
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
