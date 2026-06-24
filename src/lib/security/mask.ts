// PII masking for server logs. We log enough to debug abuse (shape of the
// value, last couple of digits) without writing full phone numbers or emails to
// the log sink.

export function maskPhone(phone?: string | null): string {
  if (!phone) return "(none)";
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 4) return "***";
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

export function maskEmail(email?: string | null): string {
  if (!email) return "(none)";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const head = user.slice(0, 2);
  return `${head}${user.length > 2 ? "***" : ""}@${domain}`;
}
