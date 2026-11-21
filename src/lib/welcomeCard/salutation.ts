// Titles offered for the guest welcome card. Client-safe (no server imports).
// The booking doesn't record the guest's gender, so staff pick the title when
// downloading; one already typed at the start of the name is pre-selected.

export const SALUTATIONS = ["Mr", "Ms", "Mrs", "Dr"] as const;
export type Salutation = (typeof SALUTATIONS)[number];

const LEADING = /^(mr|mrs|ms|miss|dr)\.?\s+/i;

/** "Mr. Antesh Rao" → { title: "Mr", name: "Antesh Rao" }; "Miss" counts as Ms. */
export function splitSalutation(fullName: string): { title: Salutation | null; name: string } {
  const trimmed = fullName.trim();
  const m = trimmed.match(LEADING);
  if (!m) return { title: null, name: trimmed };
  const t = m[1].toLowerCase();
  const title: Salutation = t === "mrs" ? "Mrs" : t === "dr" ? "Dr" : t === "mr" ? "Mr" : "Ms";
  return { title, name: trimmed.slice(m[0].length).trim() || trimmed };
}

export function isSalutation(v: string | null | undefined): v is Salutation {
  return !!v && (SALUTATIONS as readonly string[]).includes(v);
}
