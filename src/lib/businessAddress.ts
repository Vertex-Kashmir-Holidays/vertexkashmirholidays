// Formats the structured legal-identity address fields (SiteSettings) into a
// single display string. Single source of truth for "what is our address" —
// callers should prefer this over the legacy freeform SiteSettings.siteAddress
// field, which can drift out of sync (see: it used to say "Boulevard Road,
// Dal Gate, Srinagar", nowhere near the real registered address).
export function formatBusinessAddress(
  settings:
    | {
        addressLine1?: string | null;
        addressCity?: string | null;
        addressState?: string | null;
        addressPincode?: string | null;
        addressCountry?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!settings) return null;
  const parts = [
    settings.addressLine1,
    settings.addressCity,
    [settings.addressState, settings.addressPincode].filter(Boolean).join(" "),
    settings.addressCountry,
  ].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}
