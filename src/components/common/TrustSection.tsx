import { TRUST_CONTENT, type TrustSectionType } from "@/lib/trust-content";

interface TrustSectionProps {
  type: TrustSectionType;
  /** Tour/destination/activity/category name — see trust-content.ts for how each type uses it. */
  name?: string;
}

// Lightweight, page-type-specific trust/E-E-A-T copy rendered just above the
// Footer. See src/lib/trust-content.ts for why this replaced a single
// paragraph that used to be hardcoded into the Footer on every page.
//
// Bottom padding only, deliberately: every page this renders on already ends
// its own last section with generous bottom padding/margin before this
// component (confirmed per host page), so adding top padding here as well
// would double that gap — most noticeably on the tour detail page, whose
// <main> already carries pb-28 on mobile to clear the sticky booking bar.
export function TrustSection({ type, name }: TrustSectionProps) {
  const { heading, text } = TRUST_CONTENT[type];

  return (
    <section className="mx-auto max-w-[1300px] px-4 pb-10 sm:px-6 sm:pb-12">
      <h2 className="text-[18px] font-bold text-foreground">{heading}</h2>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-foreground/75">{text(name)}</p>
    </section>
  );
}
