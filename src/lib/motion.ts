import type { Variants } from "framer-motion";

// Shared framer-motion easing — the one source for the curve that was
// previously hand-copied inline across 23+ components (see
// docs/DESIGN_SYSTEM.md → Motion). Durations/delays are NOT centralized
// here — they vary intentionally per component; only this curve was
// genuinely duplicated. Mirrors --ease-brand in globals.css and the
// ease-brand Tailwind utility class — same value, three consumption paths.
export const EASE_BRAND = [0.22, 1, 0.36, 1] as const;

// Shared scroll-reveal variants — the "hidden until scrolled into view"
// shape (initial/whileInView pair) hand-copied inline across 100+
// components. Same reasoning as EASE_BRAND above: only the animated shape
// is shared here, never transition (duration/delay/ease stay on the
// component's own `transition` prop since those vary intentionally).
//
//   <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
//     viewport={viewportOnce} transition={{ duration: 0.5 }}>
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpLg: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

// The `viewport={{ once: true }}` prop was identically hand-copied
// alongside every one of the shapes above — shared for the same reason.
export const viewportOnce = { once: true } as const;
