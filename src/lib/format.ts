// Shared INR currency formatting for new code. Not retrofitted into the ~25
// existing call sites that already hand-roll `toLocaleString("en-IN")` /
// `Intl.NumberFormat` locally — that's out of scope for the Finance module.

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** "₹1,23,456" — whole rupees, Indian digit grouping. */
export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(Math.round(amount || 0));
}

/** "₹1.23 L" / "₹1.23 Cr" for compact stat cards; falls back to formatCurrency below ₹1,000. */
export function formatCurrencyCompact(amount: number): string {
  const n = amount || 0;
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return formatCurrency(n);
}

/** "2026-08" -> "Aug 2026", for chart month axes/tooltips. */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
