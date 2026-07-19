// Shared framer-motion easing — the one source for the curve that was
// previously hand-copied inline across 23+ components (see
// docs/DESIGN_SYSTEM.md → Motion). Durations/delays are NOT centralized
// here — they vary intentionally per component; only this curve was
// genuinely duplicated. Mirrors --ease-brand in globals.css and the
// ease-brand Tailwind utility class — same value, three consumption paths.
export const EASE_BRAND = [0.22, 1, 0.36, 1] as const;
